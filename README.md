# 🏆 FIFA World Cup 2026 Live App

A high-performance, real-time web application to track the FIFA World Cup 2026. Get live match scores, browse the comprehensive tournament schedule, check group standings, follow the knockout bracket, and watch live streams directly from official broadcasters.

### ✨ Sponsored By
This open-source project is proudly sponsored and maintained by **[RizQara Tech](https://www.rizqara.tech/)**. 

## 🚀 Features

- **🔴 Real-Time Live Scores:** Instant push notifications and live score updates powered by Server-Sent Events (SSE) and the ESPN public API.
- **📺 Premium Live Watch:** Integrated video player and broadcaster directory (HLS & YouTube streams) for watching matches live.
- **📅 Interactive Schedule:** View the full tournament schedule dynamically grouped by date.
- **📊 Live Standings:** Real-time point updates and group tables.
- **🏆 Knockout Stage Tracking:** Follow teams through the Round of 32 all the way to the final at MetLife Stadium.
- **⚡ Native App Feel:** Fast bottom navigation, a premium maroon UI, in-app toast alerts, and a polished splash loading screen.
- **🔍 SEO Optimized:** Fully optimized for search engines with dynamic meta tags, OpenGraph, and Twitter Cards.

## 🛠️ Technology Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (Zero massive UI frameworks for maximum speed)
- **Backend:** Node.js, Express.js
- **Live Data:** ESPN API (Real-time polling & SSE push)
- **Deployment:** Pre-configured for seamless Serverless deployment on **Vercel** (`vercel.json` included).

## 🚀 Quick Start (Local Development)

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3001`

## ☁️ Deployment (Vercel)

This application is structurally prepared for 1-click deployment on Vercel. 
- Vercel automatically detects the `api/index.js` file as a serverless backend.
- Static assets are automatically served from the root folder.
- The included `vercel.json` ensures all `/api/*` routes are perfectly mapped.

Just push the code to a Git provider (GitHub, GitLab, BitBucket) and import the repository into your Vercel dashboard.
