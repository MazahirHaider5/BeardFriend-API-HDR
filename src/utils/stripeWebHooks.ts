import { Request, Response } from "express";
import Stripe from "stripe";
import PaymentModel from "../models/payments.model";
import IUser from "../models/users.model";
import { sendMail } from "../utils/mailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers["stripe-signature"] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log("Webhook received:", event.type, "Event ID:", event.id);

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                await handleCheckoutSessionCompleted(session);
                break;
            }
            case "checkout.session.expired": {
                const session = event.data.object;
                await handleCheckoutSessionExpired(session);
                break;
            }
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                await handlePaymentSuccess(paymentIntent);
                break;
            }
            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object;
                await handlePaymentFailure(paymentIntent);
                break;
            }
            case "payment_intent.canceled": {
                const paymentIntent = event.data.object;
                await handlePaymentCanceled(paymentIntent);
                break;
            }
            case "charge.succeeded": {
                const charge = event.data.object;
                await handleChargeSuccess(charge);
                break;
            }
            case "charge.failed": {
                const charge = event.data.object;
                await handleChargeFailure(charge);
                break;
            }
        }

        res.json({ received: true });
    } catch (err: any) {
        console.error(`Webhook Error:`, err);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
};

const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
    try {
        console.log("Processing checkout session:", session.id);

        const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['payment_intent']
        });

        const paymentIntent = expandedSession.payment_intent as Stripe.PaymentIntent;
        const receiptUrl = paymentIntent ? (await stripe.charges.retrieve(paymentIntent.latest_charge as string)).receipt_url ?? undefined : undefined;

        const updatedPayment = await updatePaymentRecord(session.id, paymentIntent, receiptUrl);

        if (!updatedPayment) {
            console.error("Payment record not found for session:", session.id);
            return;
        }

        console.log("Updated payment record:", updatedPayment);

        if (session.metadata?.userId) {
            await updateUserRecord(session.metadata.userId, paymentIntent, updatedPayment);
        }
    } catch (error) {
        console.error("Error handling checkout session completion:", error);
        throw error;
    }
};

const handleCheckoutSessionExpired = async (session: Stripe.Checkout.Session) => {
    try {
        console.log("Processing expired checkout session:", session.id);
        
        const payment = await PaymentModel.findOne({ transaction_id: session.id });
        if (payment) {
            payment.status = "failed";
            payment.error_message = "Checkout session expired";
            await payment.save();
            
            if (session.metadata?.userId) {
                const user = await IUser.findById(session.metadata.userId);
                if (user?.email) {
                    await sendMail(user.email, "Payment Session Expired", 
                        `Your payment session has expired. Please try again if you wish to complete your purchase.`);
                }
            }
        }
    } catch (error) {
        console.error("Error handling expired checkout session:", error);
    }
};

const updatePaymentRecord = async (sessionId: string, paymentIntent: Stripe.PaymentIntent, receiptUrl: string | undefined) => {
    return await PaymentModel.findOneAndUpdate(
        { transaction_id: sessionId },
        {
            status: "completed",
            payment_intent_id: paymentIntent?.id,
            payment_method: paymentIntent?.payment_method as string,
            receipt_url: receiptUrl,
        },
        { new: true }
    );
};

const updateUserRecord = async (userId: string, paymentIntent: Stripe.PaymentIntent, updatedPayment: any) => {
    const user = await IUser.findById(userId);
    if (user) {
        user.last_transaction_id = paymentIntent?.id;
        await user.save();
        console.log("Updated user record:", user.id);

        if (updatedPayment.receipt_url && user.email) {
            const emailContent = paymentSuccessEmailTemplate(user.email, updatedPayment.receipt_url);
            await sendMail(user.email, "Payment Successful", emailContent);
        } else {
            console.error("Missing email or receipt URL for user ID:", user.id);
        }
    } else {
        console.error("User not found for ID:", userId);
    }
};

const handlePaymentSuccess = async (paymentIntent: Stripe.PaymentIntent) => {
    try {
        console.log("Processing payment intent:", paymentIntent.id);

        // Try to find payment by payment_intent_id first
        let payment = await PaymentModel.findOne({
            payment_intent_id: paymentIntent.id
        });

        // If not found, try to find by checking the session ID in metadata
        if (!payment && paymentIntent.metadata?.checkout_session) {
            payment = await PaymentModel.findOne({
                transaction_id: paymentIntent.metadata.checkout_session
            });
        }

        if (payment) {
            payment.status = "completed";
            payment.payment_intent_id = paymentIntent.id;
            payment.payment_method = paymentIntent.payment_method as string;

            // If there's a charge, update receipt URL
            if (paymentIntent.latest_charge) {
                const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
                payment.receipt_url = charge.receipt_url ?? undefined;
            }

            await payment.save();
            console.log("Updated payment record:", payment.id);
        } else {
            console.log("No payment record found for payment intent:", paymentIntent.id);
        }
    } catch (error) {
        console.error("Error handling payment success:", error);
        throw error;
    }
};

const handleChargeSuccess = async (charge: Stripe.Charge) => {
    try {
        console.log("Processing charge:", charge.id);

        const updatedPayment = await PaymentModel.findOneAndUpdate(
            { payment_intent_id: charge.payment_intent },
            {
                charge_id: charge.id,
                receipt_url: charge.receipt_url,
                payment_method: charge.payment_method as string,
                status: "completed"
            },
            { new: true }
        );

        if (updatedPayment) {
            console.log("Updated payment with charge details:", updatedPayment.id);
        } else {
            console.log("No payment record found for charge:", charge.id);
        }
    } catch (error) {
        console.error("Error handling charge success:", error);
        throw error;
    }
};

// Email template for payment success
const paymentSuccessEmailTemplate = (email: string, receiptUrl: string): string => {
    return `
    Dear ${email},

    Thank you for your payment. Your transaction was successful.

    You can view your receipt here: ${receiptUrl}
    If you have any questions, please contact our support team.

    Best regards,
    BeardFriends
    `;
};

// In handlePaymentFailure:
const handlePaymentFailure = async (paymentIntent: Stripe.PaymentIntent) => {
    try {
        console.log("Processing failed payment intent:", paymentIntent.id);

        // First try to find by payment_intent_id
        let payment = await PaymentModel.findOne({
            payment_intent_id: paymentIntent.id
        });

        // If not found and metadata exists, try finding by session ID
        if (!payment && paymentIntent.metadata?.checkout_session) {
            payment = await PaymentModel.findOne({
                transaction_id: paymentIntent.metadata.checkout_session
            });
        }

        // If still not found, try finding by product_id in metadata
        if (!payment && paymentIntent.metadata?.product_id) {
            const productIds = JSON.parse(paymentIntent.metadata.product_id);
            payment = await PaymentModel.findOne({
                product_id: { $all: productIds },
                status: "pending"
            });
        }

        if (payment) {
            payment.status = "failed";
            payment.payment_intent_id = paymentIntent.id;
            payment.error_message = paymentIntent.last_payment_error?.message || "Payment failed";
            payment.error_code = paymentIntent.last_payment_error?.decline_code || undefined;

            await payment.save();
            console.log("Marked payment as failed:", payment.id);
            
            if (payment.user_id) {
                const user = await IUser.findById(payment.user_id);
                if (user?.email) {
                    await sendMail(user.email, "Payment Failed", paymentFailureEmailTemplate(user.email, payment.error_message));
                }
            }
        } else {
            console.error("Payment record not found for:", {
                payment_intent: paymentIntent.id,
                metadata: paymentIntent.metadata
            });
        }
    } catch (error) {
        console.error("Critical error in payment failure handling:", error);
    }
};


const handleChargeFailure = async (charge: Stripe.Charge) => {
    try {
        console.log("Processing failed charge:", charge.id);

        // First try to find by payment intent ID
        let payment = await PaymentModel.findOne({
            payment_intent_id: charge.payment_intent
        });

        // If not found, try to get session ID from payment intent metadata
        if (!payment && charge.payment_intent) {
            const paymentIntent = await stripe.paymentIntents.retrieve(
                charge.payment_intent as string
            );
            const sessionId = paymentIntent.metadata?.checkout_session;
            if (sessionId) {
                payment = await PaymentModel.findOne({ 
                    transaction_id: sessionId 
                });
            }
        }

        if (payment) {
            payment.charge_id = charge.id;
            payment.status = "failed";
            payment.error_message = charge.failure_message ?? undefined;
            await payment.save();
            if (payment.user_id) {
                const user = await IUser.findById(payment.user_id);
                if (user) {
                    const emailContent = paymentFailureEmailTemplate(user.email, payment.error_message ?? "Payment processing failed");
                    await sendMail(user.email, "Payment Failed", emailContent);
                }
            }
            console.log("Updated payment record:", payment.id);
        } else {
            console.log("No payment record found for failed charge:", charge.id);
        }
    } catch (error) {
        console.error("Error handling charge failure:", error);
        throw error;
    }
};

const paymentFailureEmailTemplate = (email: string, errorMessage: string): string => {
    return `
    Dear ${email},

    We regret to inform you that your payment could not be processed.
    Reason: ${errorMessage}

    Please check your payment information and try again. If the problem persists, 
    contact your bank or use a different payment method.

    If you need assistance, please contact our support team.

    Best regards,
    BeardFriends
    `;
};

const handlePaymentCanceled = async (paymentIntent: Stripe.PaymentIntent) => {
    try {
        console.log("Processing canceled payment intent:", paymentIntent.id);
        
        const payment = await PaymentModel.findOne({ 
            payment_intent_id: paymentIntent.id 
        });
        
        if (payment) {
            payment.status = "failed";
            payment.error_message = "Payment canceled";
            await payment.save();
        }
    } catch (error) {
        console.error("Error handling canceled payment:", error);
    }
};

