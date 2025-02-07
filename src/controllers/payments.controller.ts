import { Request, Response } from "express";
import Stripe from "stripe";
import User, { IUser } from "../models/users.model";
import PaymentModel, { IPayment } from "../models/payments.model";
import Product, { IProduct } from "../models/products.model";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Stripe secret key is not defined in environment variables.");
}
const stripe = new Stripe(stripeSecretKey);

export const createCheckoutSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { product_id, successUrl, cancelUrl } = req.body;

    if (!product_id || !successUrl || !cancelUrl) {
      res.status(400).json({ error: "Missing required fields." });
      return;
    }

    const user: IUser | null = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    // Fetch products from the database
    const products: IProduct[] = await Product.find({
      _id: { $in: product_id }
    });
    if (products.length !== product_id.length) {
      res.status(404).json({ error: "One or more products not found." });
      return;
    }

    // Calculate total price
    let totalPrice = 0;
    for (const product of products) {
      // Apply discount if available
      const discount = product.product_discount || 0;
      const discountedPrice = product.product_price * (1 - discount / 100);
      totalPrice += discountedPrice;
    }

    // Create or fetch Stripe customer
    let stripeCustomerId = user.stripe_customer_id;

    if (stripeCustomerId) {
      try {
        // Check if the customer exists in Stripe
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (error) {
        // If the customer does not exist, create a new one
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId }
        });
        stripeCustomerId = customer.id;
        user.stripe_customer_id = stripeCustomerId;
        await user.save();
      }
    } else {
      // If no customer ID is stored, create a new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId }
      });
      stripeCustomerId = customer.id;
      user.stripe_customer_id = stripeCustomerId;
      await user.save();
    }

    // Create Stripe price
    const stripePrice = await stripe.prices.create({
      unit_amount: Math.round(totalPrice * 100),
      currency: "usd",
      product_data: {
        name: products.map((product) => product.product_name).join(", ")
      }
    });

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: stripeCustomerId,
      line_items: [
        {
          price: stripePrice.id,
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        product_id: JSON.stringify(product_id)
      },
      payment_intent_data: {
        metadata: {
          userId: userId.toString(),
          product_id: JSON.stringify(product_id)
        }
      }
    });

    // Create payment record before checking payment intent
    const payment: IPayment = new PaymentModel({
      user_id: userId,
      transaction_id: session.id,
      product_id: product_id,
      price: totalPrice,
      status: "pending",
      payment_method: "card"
    });
    await payment.save();

    // Only update payment intent if it exists
    if (session.payment_intent) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent as string
        );
        await stripe.paymentIntents.update(paymentIntent.id, {
          metadata: {
            ...paymentIntent.metadata,
            checkout_session: session.id
          }
        });
      } catch (error) {
        console.error("Error updating payment intent metadata:", error);
      }
    }

    res.status(200).json({
      sessionId: session.id,
      checkoutUrl: session.url
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchCheckoutSessionDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "User not Authenticated" });
      return;
    }

    // Fetch user
    const user: IUser | null = await User.findById(userId);
    if (!user?.stripe_customer_id) {
      res
        .status(400)
        .json({ error: "User has not associated Stripe customer ID." });
      return;
    }

    // Fetch latest Checkout Session
    const checkoutSessions = await stripe.checkout.sessions.list({
      customer: user.stripe_customer_id,
      limit: 1,
      expand: ["data.payment_intent"]
    });

    if (checkoutSessions.data.length === 0) {
      res
        .status(404)
        .json({ error: "No checkout sessions found for this customer." });
      return;
    }

    const session = checkoutSessions.data[0];
    const paymentIntentId = (session.payment_intent as Stripe.PaymentIntent)
      ?.id;

    // Extract session details
    const sessionDetails = {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      status: session.status,
      mode: session.mode,
      amountTotal: session.amount_total ? session.amount_total / 100 : 0,
      product_id: session.metadata?.product_id
        ? JSON.parse(session.metadata.product_id)
        : [],
      created: session.created ? new Date(session.created * 1000) : null,
      transactionId: paymentIntentId
    };

    res.status(200).json({
      message: "Checkout session details fetched.",
      sessionDetails
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
};
