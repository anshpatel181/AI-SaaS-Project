<div align="center">
  <h1>⚡ Quick.ai — AI SaaS Platform</h1>
  <p>A production-grade, full-stack AI SaaS application with real-time streaming, a complete monetization pipeline, and enterprise-level performance optimizations.</p>

  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-Upstash-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</div>

---

## 📖 About The Project

Quick.ai is a fully-monetized AI SaaS platform offering a suite of generative AI tools for text and image creation. It is built on a scalable architecture that uses serverless infrastructure, real-time data streaming, and advanced caching strategies.

This project goes beyond a standard CRUD application by implementing:
- **Real-time server-sent data streams** for a ChatGPT-like experience
- **Cryptographic payment verification** via Razorpay webhooks
- **Sliding-window rate limiting** using Redis to protect costly AI endpoints
- **Cache invalidation strategies** to ensure data consistency at scale

---

## ✨ Features

| Feature | Description |
|---|---|
| 📝 AI Article Writer | Generates long-form articles in real-time using Google Gemini Flash |
| 💡 Blog Title Generator | Suggests creative blog titles based on a topic |
| 🖼️ AI Image Generator | Text-to-image generation powered by Clipdrop API (Premium) |
| ✂️ Background Remover | Removes image backgrounds using Cloudinary's Generative AI (Premium) |
| 🎨 AI Object Removal | Removes specific objects from images using Cloudinary (Premium) |
| 📄 Resume Reviewer | Parses uploaded PDFs and provides AI-powered feedback (Premium) |
| 👥 Community Feed | A public gallery of user-published AI creations with a like system |
| 💳 Premium Subscriptions | Full Razorpay integration with backend signature verification |

---

## 🏗️ System Architecture

```
User Browser
    │
    ▼
React Frontend (Vite)
    │  JWT via Clerk Auth
    ▼
Express.js Backend
    │
    ├──► Auth Middleware (Clerk) ──► Rate Limiter (Upstash Redis)
    │
    ├──► AI Controller
    │       ├──► Google Gemini Flash (Streaming)
    │       ├──► Clipdrop API (Image Gen)
    │       └──► Cloudinary AI (Background/Object Removal)
    │
    ├──► User Controller
    │       ├──► Redis Cache (Community Feed)
    │       └──► Razorpay (Order + Signature Verification)
    │
    └──► Prisma ORM ──► Neon Serverless PostgreSQL
```

---

## 🛠️ Tech Stack

**Frontend**
- React 19, Vite, Tailwind CSS v4
- React Router v7 (with Route-based Lazy Loading)
- Clerk React SDK, Axios, React Hot Toast

**Backend**
- Node.js, Express.js 5
- Prisma ORM (with B-tree database indexing)
- Neon Serverless PostgreSQL
- Upstash Serverless Redis (Caching + Rate Limiting)

**AI & Integrations**
- Google Gemini Flash (via OpenAI-compatible SDK)
- Clipdrop API (Text-to-Image)
- Cloudinary SDK (AI transformations, media storage)
- Multer + pdf-parse (File upload pipeline)

**Auth & Payments**
- Clerk (Authentication, Role Management via `publicMetadata`)
- Razorpay (Payment orders + `crypto` HMAC-SHA256 signature verification)

**DevOps**
- Docker (Containerized backend)

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- A [Neon](https://neon.tech) PostgreSQL database
- An [Upstash](https://upstash.com) Redis database
- A [Razorpay](https://razorpay.com) account (Test Mode)
- A [Clerk](https://clerk.com) application
- A [Cloudinary](https://cloudinary.com) account
- A [Clipdrop](https://clipdrop.co/apis) API key
- A [Google AI Studio](https://aistudio.google.com) Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. **Set up the Backend**
   ```bash
   cd server
   npm install
   npx prisma generate
   npx prisma db push
   ```

3. **Set up the Frontend**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure Environment Variables**

   Create `server/.env`:
   ```env
   DATABASE_URL=your_neon_postgres_url
   GEMINI_API_KEY=your_gemini_api_key
   CLIPDROP_API_KEY=your_clipdrop_api_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLERK_SECRET_KEY=your_clerk_secret_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   UPSTASH_REDIS_REST_URL=your_upstash_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_token
   ```

   Create `client/.env`:
   ```env
   VITE_BASE_URL=http://localhost:3000
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

5. **Run the Application**

   Open two terminals:
   ```bash
   # Terminal 1 — Backend
   cd server && npm run server

   # Terminal 2 — Frontend
   cd client && npm run dev
   ```

---

## 🐳 Docker (Backend)

To run the backend in a Docker container:
```bash
cd server
docker build -t quickai-server .
docker run -p 3000:3000 --env-file .env quickai-server
```

---

## 📁 Project Structure

```
AI SaaS Project/
├── client/                  # React + Vite Frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   └── pages/           # Lazy-loaded route pages
│   └── index.html
│
└── server/                  # Node.js + Express Backend
    ├── config/              # DB, Cloudinary, Multer, Prisma setup
    ├── controllers/         # Business logic (AI, User, Payments)
    ├── middlewares/         # Auth + Plan verification
    ├── prisma/              # Database schema & migrations
    ├── routes/              # API route definitions
    ├── Dockerfile           # Docker configuration
    └── server.js            # Entry point
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
