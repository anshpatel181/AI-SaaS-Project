import { prisma } from "../config/prisma.js"
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { clerkClient } from "@clerk/express";
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const getUserCreations = async (req, res) => {
    try {
        const userId = req.userId

        // const creations = await sql`SELECT * FROM creations where user_id = ${userId} order by created_at DESC`
        const creations = await prisma.creations.findMany({
            where: {user_id: userId},
            orderBy: {created_at: 'desc'}
        })
        res.json({success: true, creations})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const getPublishedCreations = async (req, res) => {
    try {
        const CACHE_KEY = "published_creations_feed";

        // 1. Try to get the data from Redis Cache first
        const cachedCreations = await redis.get(CACHE_KEY);

        if (cachedCreations) {
            console.log("Serving Community Feed from Redis Cache! ⚡");
            return res.json({ success: true, creations: cachedCreations });
        }

        // 2. If not in cache, fetch from the actual Database
        console.log("Serving Community Feed from Database 🐢");
        const creations = await prisma.creations.findMany({
            where: { publish: true },
            orderBy: { created_at: 'desc' }
        });

        // 3. Save the result to Redis Cache for 60 seconds (ex: 60)
        // For the next 60 seconds, everyone gets the fast cached version!
        if (creations.length > 0) {
            await redis.set(CACHE_KEY, creations, { ex: 60 });
        }

        res.json({ success: true, creations });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export const toggleLikeCreation = async (req, res) => {
    try {

        const userId = req.userId        
        const {id} = req.body

        // const [creation] = await sql`SELECT * from creations where id = ${id}`
        const creation = await prisma.creations.findUnique({
            where: {id},
        })
        
        if(!creation) {
            return res.json({success: false, message: "Creation not found"})
        }

        let currentLikes = creation.likes || [];
        
        if(currentLikes.includes(userId)) { 
            currentLikes = currentLikes.filter((cur_id) => cur_id !== userId)
            
            // await sql`update creations set likes = ${currentLikes} where id = ${id}`
            await prisma.creations.update({
                where: {id},
                data: {likes: currentLikes}
            })

            await redis.del("published_creations_feed")
            return res.json({success: true, message: "Creation Unliked"})
        }

        currentLikes.push(`${userId}`)        
        // await sql`update creations set likes = ${currentLikes} where id = ${id}`
        await prisma.creations.update({
            where: {id},
            data: {likes: currentLikes}
        })

        await redis.del("published_creations_feed")

        res.json({success: true, message: "Creation Liked"})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

// 1. This creates an order before the user pays
export const createRazorpayOrder = async (req, res) => {
    try {
        const instance = new Razorpay({ //creates razorpay instance which allows creating orders, fetching payments, refunds etc.
            key_id: process.env.RAZORPAY_KEY_ID, //public identifier from razorpay dashboard
            key_secret: process.env.RAZORPAY_KEY_SECRET, // private secret key used for authentication, security, and signature generation and never expose this to frontend.
        });

        //defines payment order details
        const options = { 
            amount: 99900,  // Amount in paisa (99900 paisa = ₹999)
            currency: "INR",
            receipt: `receipt_${req.userId}`,  //creates unique receipt identifier which is useful for tracking payments, debugging, invoices
        };

        //create order in razorpay which means sends request to razorpay server and it creates payment order 
        const order = await instance.orders.create(options); 

        res.json({ success: true, order }); //send order to frontend to open razorpay checkout popup
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// 2. This verifies the payment after the user pays and upgrades them
export const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.userId; 
                
        // Create the expected signature using your secret key
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        // Check if the signature sent by Razorpay matches our expected one
        const isAuthentic = expectedSignature === razorpay_signature;
        
        if (isAuthentic) {
            // Payment is legit! Upgrade the user to premium in Clerk
            await clerkClient.users.updateUserMetadata(userId, {
                publicMetadata: {
                    plan: "premium",
                },
            });

            res.json({ success: true, message: "Payment successful! You are now a Premium user." });
        } else {
            res.json({ success: false, message: "Payment verification failed." });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
