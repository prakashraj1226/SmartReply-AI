# 🚀 SmartReply AI - 100% Free Production Deployment Guide
> Deploy Frontend, Backend, and Database with **Zero Cost** and **No Credit Card Required**!

---

## 🏗️ Architecture Overview

| Component | Technology | Free Hosting Provider | Why This Provider? |
| :--- | :--- | :--- | :--- |
| **Database** | PostgreSQL 16 | **[Neon.tech](https://neon.tech)** | 100% Free Forever Serverless PostgreSQL, 0.5 GB storage, zero credit card, instant SSL connection string. |
| **Backend** | Spring Boot 3 (Java 17) | **[Render.com](https://render.com)** | Free Web Service (Docker / Java 17), 512 MB RAM, free HTTPS, automated GitHub deploys. |
| **Frontend** | Angular 18 (SPA) | **[Vercel](https://vercel.com)** or **[Render Static Site](https://render.com)** | 100% Free Forever, global ultra-fast edge CDN, free custom domains & SSL. |

---

## ⚡ Step 1: Create 100% Free PostgreSQL on Neon.tech (2 Minutes)

1. Open **[neon.tech](https://neon.tech)** and click **Sign Up** (Sign in with your GitHub account).
2. Click **Create Project**:
   - **Project Name**: `smartreply-db`
   - **Postgres Version**: `16`
   - **Region**: Choose closest to you (e.g., `Singapore` / `ap-southeast-1` or `Frankfurt` / `eu-central-1`).
3. Once created, on the Dashboard under **Connection Details**:
   - Change dropdown to **`Java / JDBC`**.
   - Your connection string will look like:
     ```
     jdbc:postgresql://ep-silent-sun-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
   - Keep note of:
     - **Database URL**: `jdbc:postgresql://<host>/neondb?sslmode=require`
     - **User**: (e.g. `neondb_owner`)
     - **Password**: (your Neon generated password)

> 💡 **Flyway Auto-Migration**: Spring Boot will automatically run all Flyway schema migrations on startup, creating all tables (`customers`, `conversations`, `messages`, `knowledge_articles`, etc.) automatically!

---

## 🚀 Step 2: Deploy Backend on Render.com (3 Minutes)

1. Open **[render.com](https://render.com)** and sign in with GitHub.
2. Click **New +** (top right) ➡️ **Web Service**.
3. Select your repository: **`prakashraj1226/SmartReply-AI`**.
4. Configure the Web Service:
   - **Name**: `smartreply-backend`
   - **Region**: Choose same region as your DB (e.g., Singapore or Frankfurt).
   - **Environment**: **`Docker`**
   - **Docker Context Directory**: `.` (or `./backend`)
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Instance Type**: **`Free`** (512 MB RAM)
5. Scroll down to **Environment Variables** and add:

   | Key | Value |
   | :--- | :--- |
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<your-neon-host>/neondb?sslmode=require` |
   | `SPRING_DATASOURCE_USERNAME` | `<your-neon-username>` |
   | `SPRING_DATASOURCE_PASSWORD` | `<your-neon-password>` |
   | `JWT_SECRET` | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` |
   | `CORS_ALLOWED_ORIGINS` | `*` |
   | `WHATSAPP_VERIFY_TOKEN` | `smartreply_verify_token_secure_2026` |
   | `PORT` | `8080` |

6. Click **Create Web Service**.
7. Render will build the Docker container and start your Spring Boot application.
8. Once deployed, note down your backend URL (e.g., `https://smartreply-backend.onrender.com`).
   - You can test it by opening: `https://smartreply-backend.onrender.com/actuator/health` ➡️ `{"status":"UP"}`.

---

## 🌐 Step 3: Deploy Frontend on Vercel (2 Minutes)

1. Open **[vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **Add New...** ➡️ **Project**.
3. Import your repository: **`prakashraj1226/SmartReply-AI`**.
4. In the configuration panel:
   - **Framework Preset**: `Other` (or `Angular`)
   - **Root Directory**: Click **Edit** and choose `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/frontend/browser`
5. Under **Environment Variables**, add:
   - Key: `NG_APP_API_URL` (or update `environment.prod.ts` with your Render backend URL)
6. Click **Deploy**.
7. Vercel will build and publish your app with global CDN and SSL (e.g., `https://smartreply-ai.vercel.app`)!

---

## 🎯 Alternative: 1-Click Render Blueprint

Since this repository includes [`render.yaml`](file:///home/maintwiz/Music/smartreply-ai/render.yaml):
1. In Render.com, click **New +** ➡️ **Blueprint**.
2. Select `prakashraj1226/SmartReply-AI`.
3. Provide your Neon DB connection details when prompted.
4. Render will deploy **both** Backend and Frontend simultaneously!

---

## ⚙️ Maintenance & Production Tips

- **Free Tier Sleep Behavior**: Render free web services spin down after 15 minutes of inactivity. The first request takes ~45 seconds to wake up. To keep it awake 24/7 for free, you can set up a free monitor on **[UptimeRobot](https://uptimerobot.com)** pinging `https://smartreply-backend.onrender.com/actuator/health` every 10 minutes!
- **Meta WhatsApp Webhook**: Set your Meta WhatsApp Cloud API Webhook Callback URL to:
  `https://smartreply-backend.onrender.com/api/webhooks/whatsapp` with Verify Token `smartreply_verify_token_secure_2026`.
