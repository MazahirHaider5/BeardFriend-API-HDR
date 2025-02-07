import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/users.model";

interface JWTPayload {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

const getAccessToken = (req: Request): string | undefined => {
  let token = req.cookies.accessToken;
  
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  return token;
};

export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise <void> => {
  const token = getAccessToken(req);
  
  if (!token) {
     res.status(403).json({
      success: false,
      message: "Access token required"
    });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
     res.status(500).json({
      success: false,
      message: "JWT secret is not defined"
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JWTPayload;

    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.is_verified || user.blocked) {
       res.status(401).json({
        success: false,
        message: "User not found or account is non-verified or blocked"
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
       res.status(401).json({
        success: false,
        message: "Access token has expired"
      });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
       res.status(401).json({
        success: false,
        message: "Invalid access token"
      });
      return;
    }

     res.status(500).json({
      success: false,
      message: "An error occurred while verifying the access token",
      error: (error as Error).message
    });
    return;
  }
};

export default verifyToken;

