import express from "express";
import cors from "cors"
import 'dotenv/config'
import { clerkMiddleware } from '@clerk/express'
import aiRouter from "./routes/aiRoutes.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoutes.js";
import helmet from "helmet"

const app = express();

await connectCloudinary();

const PORT = process.env.PORT || 3000;

app.use(helmet())
app.use(cors({
    origin: "https://ai-saa-s-project-nine.vercel.app"
}));

app.use('/api/user/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())
app.use(clerkMiddleware())

app.get("/", (req, res) => {
    res.send("Server is Live!")
})

app.use("/api/ai", aiRouter)
app.use("/api/user", userRouter)

app.listen(PORT, () => {
    console.log("Server is running on port:", PORT);
    
})