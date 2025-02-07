import express from 'express';
import { getAllUsers, deleteUser, toggleUserBlock, getUser, updateUser, toggleWishlist, getUserWishlist } from '../controllers/user.controller';
import { verifyToken } from "../middleware/authenticate";


const router = express.Router();

// Admin routes
router.get('/getAllUsers',verifyToken, getAllUsers); 

router.delete('/deleteUser/:id',verifyToken, deleteUser);

router.patch('/blockUnblockUser/:id',verifyToken, toggleUserBlock);

router.get('/getSingleUser/:id',verifyToken, getUser); 

router.patch('/updateUser/:id',verifyToken, updateUser); 

router.post("/wishlist/toggle", verifyToken, toggleWishlist);

router.get('/getUserWishlist', verifyToken, getUserWishlist);


export default router;