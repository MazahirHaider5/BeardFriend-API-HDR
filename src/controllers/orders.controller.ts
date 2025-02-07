import { Request, Response } from 'express';
import Order from '../models/orders.model';
import mongoose from 'mongoose';
import { IUser } from '../models/users.model';
import Product from '../models/products.model';

interface IUserRequest extends Request {
  user?: IUser;
}

export const createOrder = async (req: IUserRequest, res: Response): Promise<void> => {
    try {
        const { product_id, order_items, order_status, stripe_customer_id, paypal_customer_id } = req.body;

        if (!req.user) {
            res.status(401).json({ message: "User not authenticated" });
            return;
        }

        const user_id = req.user.id;

        if (!product_id || !order_items || !user_id) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }

        const product = await Product.findById(product_id);
        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }

        // Calculate total order price by summing individual item costs (price * quantity)
        let totalOrderPrice = 0;
        order_items.forEach((item: { quantity: number }) => {
            // Multiply product price by quantity for each order item
            totalOrderPrice += product.product_price * item.quantity;
        });

        const newOrder = new Order({
            product_id,
            order_items,
            order_price: [totalOrderPrice], 
            order_status: order_status || 'pending',
            user_id,
            stripe_customer_id,
            paypal_customer_id,
        });

        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while creating order' });
    }
};

// Get all orders or orders by user_id
export const getOrders = async (req: Request, res: Response): Promise <void> => {
  try {
    const { user_id } = req.query;

    let orders;
    if (user_id) {
      orders = await Order.find({ user_id });
    } else {
      orders = await Order.find();
    }

    if (orders.length === 0) {
       res.status(404).json({ message: 'No orders found' });
       return
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
};

// Get a specific order by ID
export const getOrderById = async (req: Request, res: Response): Promise <void> => {
  try {
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
       res.status(400).json({ message: 'Invalid order ID' });
       return
    }

    const order = await Order.findById(orderId);

    if (!order) {
       res.status(404).json({ message: 'Order not found' });
       return
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching order' });
  }
};

// Update an order's status or payment status
export const updateOrder = async (req: Request, res: Response): Promise <void> => {
  try {
    const { order_status, order_payment_status } = req.body;
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
       res.status(400).json({ message: 'Invalid order ID' });
       return
    }

    const order = await Order.findById(orderId);

    if (!order) {
       res.status(404).json({ message: 'Order not found' });
       return
    }

    // Update the order fields
    if (order_status) order.order_status = order_status;
    if (order_payment_status !== undefined) order.order_payment_status = order_payment_status;

    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating order' });
  }
};

// Delete an order
export const deleteOrder = async (req: Request, res: Response): Promise <void> => {
  try {
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
       res.status(400).json({ message: 'Invalid order ID' });
       return
    }

    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
       res.status(404).json({ message: 'Order not found' });
       return
    }

    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting order' });
  }
};

// Controller method to validate valid status transitions based on the schema enums
const isValidStatusTransition = (currentStatus: "pending" | "in process" | "delivered" | "cancelled", newStatus: "pending" | "in process" | "delivered" | "cancelled"): boolean => {
  const validTransitions: Record<string, string[]> = {
    "pending": ["in process", "cancelled"],
    "in process": ["delivered", "cancelled"],
    "cancelled": [],
    "delivered": [],
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};


// Controller method to update the order status
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, status } = req.body;

    // Check if the new status is valid according to the enum in the schema
    const validStatuses = ["pending", "in process", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
       res.status(400).json({ error: 'Invalid status value' });
       return
    }

    // Find the order and check if status transition is valid
    const order = await Order.findById(orderId);
    if (!order) {
       res.status(404).json({ error: 'Order not found' });
       return
    }

    if (!isValidStatusTransition(order.order_status, status)) {
       res.status(400).json({ error: `Cannot transition from ${order.order_status} to ${status}` });
       return
    }

    // Update the order status and save
    order.order_status = status;
    const updatedOrder = await order.save();

    res.status(200).json({ message: 'Order status updated', order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error:(error as Error).message });
  }
};

// Controller method to get the current order status
export const getOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
       res.status(404).json({ error: 'Order not found' });
       return
    }

    res.status(200).json({ order_status: order.order_status });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: (error as Error).message });
  }
};