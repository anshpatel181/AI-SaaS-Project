import OpenAI from "openai";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import { PDFParse } from "pdf-parse";
import { prisma } from "../config/prisma.js";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit"
import sharp from "sharp";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

const ratelimit = new Ratelimit({ // now in redis RAM request count is stored in key-value pair which means for eg: userId: user_123 then request count is stored like this: user_123: { // timeStamp1, // timeStamp2, // timeStamp3, // timeStamp4, // timeStamp5 if this request happens in 1 minute as we setted // } for eg if we make first request at 10: 1 and second request at 10: 2 then the gap between these two request is 60 seconds so first request will be out from sliding window and new request will be added then.
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
})

export const generateArticle = async (req, res) => {
  try {
    const userId = req.userId;

    const { success } = await ratelimit.limit(userId)

    if (!success) {
      return res.status(429).json({
        success: false, message: "You are doing that too fast! Please wait a minute."
      })
    }

    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.status(403).json({ success: false, message: "Limit reached. Upgrade to continue." });
    }

    const articleTokens = Math.min(Number(length) || 800, 1200);

    // Add "stream: true" to the OpenAI call
    const response = await openai.chat.completions.create({ //at this point gemini starts generating response and stores chunks in response
      model: "gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: articleTokens,
      stream: true, // using this now data comes in chunks
    });

    // 2. Set headers so the browser knows data will arrive in chunks, not as one JSON block
    res.setHeader('Content-Type', 'text/plain; charset=utf-8'); //we are sending response as plain text
    res.setHeader('Transfer-Encoding', 'chunked'); //data will arrive in chunks continuously

    let fullContent = "";

    // 3. Loop through the stream(response) and send chunks to the frontend instantly
    for await (const chunk of response) {  // this means waits for the next chunk and processes it which means wait for the next chunk and extract text from it and send to the frontend. streams are asynchronous because chunks arrive over time so we have used for await which means wait asynchronously untill next chunk arrives.
      const text = chunk.choices[0]?.delta?.content || "";
      fullContent += text;
      res.write(text); // Send the raw text to the browser immediately
    }

    // 4. Once streaming is done, save the full article to the database using Prisma
    await prisma.creations.create({
      data: {
        user_id: userId,
        prompt: prompt,
        content: fullContent,
        type: 'article'
      }
    });

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    // 5. Close the connection
    res.end();

  } catch (error) {
    console.log(error.message);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    } else {
      res.end();
    }
  }
};


export const generateBlogTitle = async (req, res) => {
  try {
    const userId = req.userId;

    const { success } = await ratelimit.limit(userId)

    if (!success) {
      return res.status(429).json({
        success: false, message: "You are doing that too fast! Please wait a minute."
      })
    }

    const { prompt } = req.body;
    const plan = req.plan;

    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    const response = await openai.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 600,
    });

    const content = response.choices[0].message.content;

    await prisma.creations.create({
      data: {
        user_id: userId,
        prompt,
        content,
        type: 'blog-title'
      }
    })

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }
    return res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const generateImage = async (req, res) => {
  try {
    const userId = req.userId;

    const { success } = await ratelimit.limit(userId)

    if (!success) {
      return res.status(429).json({
        success: false, message: "You are doing that too fast! Please wait a minute."
      })
    }

    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: { "x-api-key": process.env.CLIPDROP_API_KEY },
        responseType: "arraybuffer",
      },
    );

    const base64Image = `data:image/png;base64,${Buffer.from(data, "binary").toString("base64")}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    await prisma.creations.create({
      data: {
        user_id: userId,
        prompt,
        content: secure_url,
        type: 'image',
        publish: publish ?? false
      }
    })

    return res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log("Error in generateImage:", error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const userId = req.userId;

    const { success } = await ratelimit.limit(userId)

    if (!success) {
      return res.status(429).json({
        success: false, message: "You are doing that too fast! Please wait a minute."
      })
    }

    const image = req.file;

    // Validate image dimensions
    const metadata = await sharp(image.buffer).metadata();

    const megapixels =
      (metadata.width * metadata.height) / 1000000;

    if (megapixels > 25) {
      return res.json({
        success: false,
        message: `Image too large (${megapixels.toFixed(1)} MP). Please upload image below 25 MP.`,
      });
    }

    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    const resizedBuffer = await sharp(image.buffer).resize({
      width: 3000,
      height: 3000,
      fit: "inside",
      withoutEnlargement: true,
    }).jpeg({ quality: 80 }).toBuffer();

    const base64Image = resizedBuffer.toString("base64");

    const { secure_url } = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64Image}`,
      {
        transformation: {
          effect: "background_removal",
          background_removal: "remove_the_background",
        },
      }
    );

    await prisma.creations.create({
      data: {
        user_id: userId,
        prompt: 'Remove background from image',
        content: secure_url,
        type: 'image'
      }
    })

    return res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const userId = req.userId;

    const { success } = await ratelimit.limit(userId)

    if (!success) {
      return res.status(429).json({
        success: false, message: "You are doing that too fast! Please wait a minute."
      })
    }

    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    const uploadResult = await cloudinary.uploader.upload(`data:${image.mimetype};base64,${image.buffer.toString("base64")}`, {
      resource_type: "image",
    });

    const { public_id } = uploadResult;

    const imageUrl = cloudinary.url(public_id, {
      transformation: [{ effect: `gen_remove:prompt_${object}` }],
      resource_type: "image",
    });

    await prisma.creations.create({
      data: {
        user_id: userId,
        prompt: `Removed ${object} from image`,
        content: imageUrl,
        type: 'image'
      }
    })

    return res.json({ success: true, content: imageUrl });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const resumeReview = async (req, res) => {
  try {
    const userId = req.userId;

    const { success } = await ratelimit.limit(userId)

    if (!success) {
      return res.status(429).json({
        success: false, message: "You are doing that too fast! Please wait a minute."
      })
    }

    const resume = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({
        success: false,
        message: "Resume file size exceeds allowed size (5MB).",
      });
    }

    const parser = new PDFParse({ data: resume.buffer });
    const pdfData = await parser.getText();

    const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement. Resume Content:\n\n${pdfData.text}`;

    const response = await openai.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8'); //we are sending response as plain text
    res.setHeader('Transfer-Encoding', 'chunked');

    let fullContent = ""; 

    for await (const chunk of response) {
      const text = chunk.choices[0]?.delta?.content || "";
      fullContent += text;
      res.write(text);
    }

    await prisma.creations.create({
      data: {
        user_id: userId,
        prompt: 'Review the uploaded resume',
        content: fullContent,
        type: 'resume-review'
      }
    })

    res.end()
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};
