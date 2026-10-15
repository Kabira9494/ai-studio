import { NextResponse } from "next/server";
import { checkRateLimit } from "../../../lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODELS = {
  image: "black-forest-labs/flux-schnell",
  video: "wan-video/wan-2.1-t2v-480p",
};

function getIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "anonymous";
}

export async function POST(req) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Server is missing REPLICATE_API_TOKEN. Add it in .env.local (local) or Vercel settings (deployed)." },
      { status: 500 }
    );
  }

  const required = process.env.APP_PASSWORD;
  if (required) {
    const given = req.headers.get("x-app-password");
    if (given !== required) {
      return NextResponse.json({ error: "Wrong or missing access code." }, { status: 401 });
    }
  }

  const { ok, remaining } = await checkRateLimit(getIp(req));
  if (!ok) {
    return NextResponse.json(
      { error: "You've hit today's generation limit. Try again tomorrow." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  const type = body.type === "video" ? "video" : "image";
  if (!prompt) {
    return NextResponse.json({ error: "Please enter a prompt." }, { status: 400 });
  }

  const model = MODELS[type];
  const input =
    type === "video"
      ? { prompt }
      : { prompt, aspect_ratio: "16:9", output_format: "webp" };

  try {
    const res = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail || "The model provider rejected the request." },
        { status: res.status }
      );
    }

    return NextResponse.json({
      id: data.id,
      status: data.status,
      remaining: remaining,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the model provider. Check your connection and token." },
      { status: 502 }
    );
  }
}
