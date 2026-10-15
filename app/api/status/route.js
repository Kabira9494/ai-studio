import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Server is missing REPLICATE_API_TOKEN." }, { status: 500 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing prediction id." }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data?.detail || "Could not check status." }, { status: res.status });
    }

    let output = data.output;
    if (Array.isArray(output)) output = output[0];

    return NextResponse.json({
      status: data.status,
      output: output || null,
      error: data.error || null,
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the model provider." }, { status: 502 });
  }
}
