import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  getOrderStatus
} from '../controllers/orders.controller';
import { verifyToken } from '../middleware/authenticate';

const router = express.Router();

router.post('/createOrder',verifyToken, createOrder);
router.get('/getallOrders',verifyToken, getOrders);
router.get('/getSingleOrder/:id',verifyToken, getOrderById);
router.put('/updateOrder/:id',verifyToken, updateOrder);
router.delete('/deleteOrder/:id',verifyToken, deleteOrder);
router.put('/updateOrderStatus',verifyToken, updateOrderStatus);
router.get('/getOrderStatus/:orderId',verifyToken, getOrderStatus);


export default router;
