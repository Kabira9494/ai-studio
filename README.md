# AI Studio — Image & Video Generator

A real, working AI generator. Type a prompt → the model renders an image or video → it appears on the page. Built with **Next.js** and the **Replicate** API, ready to deploy free on **Vercel**.

This is a genuine full-stack app: a React frontend, serverless API routes that keep your secret key safe, and a live model provider. Good to use, and a strong portfolio piece.

---

## How it works (the important bit)

```
Browser (page.js)
   │  sends your prompt
   ▼
/api/generate  ──►  Replicate  (your secret key lives HERE, on the server — never in the browser)
   │  returns a job id
   ▼
/api/status    ──►  polls Replicate every 2.5s until the image/video is ready
   │
   ▼
Browser shows the result
```

Your API key sits in a server environment variable. The browser never sees it, so no one can steal it from the page source. That is why a generator must have a backend — a plain HTML page cannot do this safely.

---

## Run it on your computer (5 steps)

You need **Node.js 18 or newer** installed (https://nodejs.org).

1. **Open the folder in a terminal**, then install dependencies:
   ```bash
   npm install
   ```

2. **Get a Replicate token** at https://replicate.com/account/api-tokens
   (sign up is free; you add a little credit when you want to generate).

3. **Create your env file.** Copy `.env.local.example` to `.env.local` and paste your token:
   ```
   REPLICATE_API_TOKEN=r8_your_real_token_here
   ```

4. **Start it:**
   ```bash
   npm run dev
   ```

5. Open **http://localhost:3000**, type a prompt, hit **Build it**. First image takes ~10–20s; video takes longer.

---

## Put it online (Vercel — free)

1. Push this folder to a **GitHub** repo (or drag it into Vercel directly).
2. Go to https://vercel.com, sign in with GitHub, click **Add New → Project**, and pick the repo.
3. Before deploying, open **Settings → Environment Variables** and add:
   - Name: `REPLICATE_API_TOKEN`
   - Value: your token
4. Click **Deploy**. In ~1 minute you get a live URL like `your-app.vercel.app`.

Any time you change the code and push to GitHub, Vercel redeploys automatically.

---

## Cost — know this before you share it widely

Every generation spends real money from **your** Replicate balance:
- Images (Flux Schnell): roughly a few cents each.
- Video: often $0.10–$1+ per clip depending on the model and length.

Check current prices on each model's page at https://replicate.com/explore.
**If you make the site public with no limits, every visitor spends your money.** See "Making it earn" below before opening it up.

---

## Changing or adding models

Open `app/api/generate/route.js`. The `MODELS` object near the top maps `image` and `video` to a Replicate model slug (`owner/name`). Swap in any model from https://replicate.com/explore — e.g. a different video model, a photoreal image model. Each model expects slightly different `input` fields; the model's Replicate page documents them.

---

## Keeping your balance safe (set this up before sharing a link)

Two layers protect you, both already built in:

**1. Access code** — set `APP_PASSWORD` in your env to any phrase. Visitors must enter it before they can generate, so a public link only works for people you give the code to. Leave it blank and anyone can use it (fine while testing locally, risky in public).

**2. Per-visitor daily cap** — optional but recommended once the link is truly public. Create a free Redis database at https://upstash.com, copy its REST URL and token into `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, and each IP is capped at 10 generations a day. Change the number in `lib/ratelimit.js`. If you don't set these, the app still runs — the access code is your protection.

Recommended order: test locally → set `APP_PASSWORD` and deploy → share the code with a few people → add Upstash before opening it up wider → add payments only once people actually want more.

---

## Making it earn

The app as-is spends your money per generation, so to earn you need users to cover the cost plus a margin. Realistic routes:

1. **Free trial, then pay.** Give new users a few free generations, then require sign-up + payment. Add **Clerk** (auth) and **Stripe** (payments) — both have free tiers and drop-in Next.js guides. Charge credits; each credit covers a generation plus your markup.
2. **Pick a niche.** "AI product photos for Etsy sellers" or "thumbnails for YouTubers" beats a general generator — easier to market, people pay more for a specific job.
3. **Service first, platform later.** Use this tool yourself to deliver images/videos for clients on Fiverr or locally. Cash now, no payment system needed, and it tells you what people actually pay for before you build billing.
4. **Add rate limits early** (per IP or per signed-in user) so a public link can't drain your balance. **Upstash** (free Redis) is the usual way in Next.js.

Build order that keeps risk low: get it working for yourself → add auth so only you can use it → add rate limits → add Stripe when you have real demand.

---

## Files

| Path | What it does |
|------|--------------|
| `app/page.js` | The UI — prompt box, image/video toggle, result view, polling logic |
| `app/api/generate/route.js` | Starts a generation job; holds your secret key; model list lives here |
| `app/api/status/route.js` | Polls the provider until the result is ready |
| `app/globals.css` | Styling |
| `.env.local.example` | Template for your token (copy to `.env.local`) |

Built as a starting point — extend it however you like.
