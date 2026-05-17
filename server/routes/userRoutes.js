import express from "express"
import { addPlanToClerk, createRazorpayOrder, getPublishedCreations, getUserCreations, toggleLikeCreation, verifyRazorpayPayment } from "../controllers/userController.js";
import { auth } from "../middlewares/auth-middleware.js";

const userRouter = express.Router();

userRouter.post("/webhook", addPlanToClerk)
userRouter.post('/create-razorpay-order', auth, createRazorpayOrder)
userRouter.post('/verify-razorpay-payment', auth, verifyRazorpayPayment)
userRouter.get("/get-user-creations", auth, getUserCreations)
userRouter.get("/get-published-creations", getPublishedCreations)
userRouter.post("/toggle-like-creations", auth, toggleLikeCreation)

export default userRouter; 