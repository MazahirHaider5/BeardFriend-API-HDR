import { Request, Response } from "express";
import { comparePassword } from "../utils/bcrytp";
import { generateAccessToken } from "../utils/jwt";
import User, { IUser } from "../models/users.model";
import { sendMail } from "../utils/mailer";
import { generateOtp } from "../utils/otp";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ["profile", "email"]
    },
    async (accessToken, _, profile, done) => {
      try {
        let user = await User.findOne({
          provider: "google",
          provider_id: profile.id
        });

        if (!user) {
          user = await User.create({
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            provider: "google",
            provider_id: profile.id,
            profilephoto: profile.photos?.[0]?.value,
            is_verified: true,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL!,
      profileFields: ["id", "emails", "name", "photos"]
    },
    async (accessToken, _, profile, done) => { 
      try {
        let user = await User.findOne({
          provider: "facebook",
          provider_id: profile.id
        });

        if (!user) {
          user = await User.create({
            email: profile.emails?.[0]?.value,
            name: `${profile.name?.givenName} ${profile.name?.familyName}`,
            provider: "facebook",
            provider_id: profile.id,
            profilephoto: profile.photos?.[0]?.value,
            is_verified: true,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      return done(new Error("User not found"), null);
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Register user and barber
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, username, role } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: "Email and password are required"
    });
    return;
  }

  if (role && !['barber', 'member'].includes(role)) {
    res.status(400).json({
      success: false,
      message: "Role must be either 'barber' or 'member'"
    });
    return;
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists with this email"
      });
      return;
    }

    // Generate OTP
    const otp = generateOtp();

    // Create user with unverified status
    const user = await User.create({
      username,
      email,
      password: password,
      role: role || 'member', 
      otp,
      otp_expiry: new Date(Date.now() + 90 * 1000), // 90 seconds expiry
      is_verified: false,
    });

    await sendMail(
      email,
      "Email Verification OTP",
      `Your OTP for email verification is: ${otp}. It will expire in 90 seconds.`
    );

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;

    res.status(201).json({
      success: true,
      message: "Please verify your email using the OTP sent to your email address",
      user: userResponse
    });
    return;
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message
    });
    return;
  }
};

// Verify OTP to verify account
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({
      success: false,
      message: "Email and OTP are required"
    });
    return;
  }

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }

    if (user.is_verified) {
      res.status(400).json({
        success: false,
        message: "Email is already verified"
      });
      return;
    }

    if (user.otp !== otp) {
      res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
      return;
    }

    if (user.otp_expiry && new Date() > user.otp_expiry) {
      res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one"
      });
      return;
    }

    // Verify and activate the user
    user.is_verified = true;
    user.otp = undefined;
    user.otp_expiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully"
    });
    return;
  } catch (error) {
    console.error("Error during email verification:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message
    });
    return;
  }
};

export const resendEmailVerificationOtp = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({
      success: false,
      message: "Email is required"
    });
    return;
  }

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }

    if (user.is_verified) {
      res.status(400).json({
        success: false,
        message: "Email is already verified"
      });
      return;
    }

    // Generate new OTP
    const otp = generateOtp();
    user.otp = otp;
    user.otp_expiry = new Date(Date.now() + 90 * 1000);
    await user.save();

    // Send new verification email
    await sendMail(
      email,
      "Email Verification OTP",
      `Your new OTP for email verification is: ${otp}. It will expire in 90 seconds.`
    );

    res.status(200).json({
      success: true,
      message: "New OTP sent successfully"
    });
    return;
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message
    });
    return;
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: "Email and password are required"
    });
    return;
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }

    if (user.blocked || !user.is_verified) {
      res.status(403).json({
        success: false,
        message: "Account is blocked or not verified"
      });
      return;
    }

    const passwordMatch = await comparePassword(password, user.password ?? "");
    if (!passwordMatch) {
      res.status(401).json({
        success: false,
        message: "Incorrect password"
      });
      return;
    }

    const userPayload: IUser = user.toObject();
    delete userPayload.password;

    const accessToken = generateAccessToken(userPayload);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userPayload
    });
    return;
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message
    });
    return;
  }
};

// Google OAuth routes
export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"]
});

export const googleAuthCallback = (req: Request, res: Response) => {
  passport.authenticate("google", async (err: Error, user: IUser) => {
    if (err || !user) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/error`);
    }

    try {
      const accessToken = generateAccessToken(user);

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.redirect(`${process.env.CLIENT_URL}/auth/success`);
    } catch (error) {
      console.error("Error in Google auth callback:", error);
      return res.redirect(`${process.env.CLIENT_URL}/auth/error`);
    }
  })(req, res);
};

// Facebook OAuth routes
export const facebookAuth = passport.authenticate("facebook", {
  scope: ["email"]
});

export const facebookAuthCallback = (req: Request, res: Response) => {
  passport.authenticate("facebook", async (err: Error, user: IUser) => {
    if (err || !user) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/error`);
    }

    try {
      const accessToken = generateAccessToken(user);

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.redirect(`${process.env.CLIENT_URL}/auth/success`);
    } catch (error) {
      console.error("Error in Facebook auth callback:", error);
      return res.redirect(`${process.env.CLIENT_URL}/auth/error`);
    }
  })(req, res);
};

// Password reset flow
export const requestOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({
      success: false,
      message: "Email is required"
    });
    return;
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otp_expiry = new Date(Date.now() + 90 * 1000); // 90 seconds expiry
    await user.save();

    await sendMail(
      email,
      "Password Reset OTP",
      `Your OTP for password reset is: ${otp}. It will expire in 90 seconds.`
    );

    res.status(200).json({
      success: true,
      message: "OTP sent to email"
    });
    return;
  } catch (error) {
    console.error("Error requesting OTP:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
    return;
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({
      success: false,
      message: "Email and OTP are required"
    });
    return;
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }

    if (user.otp !== otp) {
      res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
      return;
    }

    if (user.otp_expiry && new Date() > user.otp_expiry) {
      res.status(400).json({
        success: false,
        message: "OTP has expired"
      });
      return;
    }

    user.is_verified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP verified successfully"
    });
    return;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
    return;
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    res.status(400).json({
      success: false,
      message: "Email and new password are required"
    });
    return;
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }

    if (!user.is_verified) {
      res.status(400).json({
        success: false,
        message: "OTP not verified"
      });
      return;
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otp_expiry = undefined;
    user.is_verified = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully"
    });
    return;
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
    return;
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });

    res.status(200).json({
      success: true,
      message: "Logout successful"
    });
    return;
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
    return;
  }
};
