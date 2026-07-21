"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials not configured");
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error("Upload service is not configured - missing Supabase credentials");
    return NextResponse.json(
      { error: "Upload service is not configured - Supabase credentials missing" },
      { status: 503 }
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (e) {
    console.error("Failed to parse form data:", e);
    return NextResponse.json(
      { error: "Failed to parse form data" },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Limit to 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const safeName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const path = `uploads/${safeName}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const { error, data } = await supabase.storage
      .from("media")
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error(`Supabase upload error for ${file.name}:`, error);
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(path);

    console.log(`File uploaded successfully: ${file.name} -> ${path}`);

    return NextResponse.json({
      url: urlData.publicUrl,
      name: file.name,
    });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error(`Upload error for ${file.name}:`, errorMsg);
    return NextResponse.json(
      { error: `Upload failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
