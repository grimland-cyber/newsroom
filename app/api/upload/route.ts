import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { getServiceRoleClient } from "@/lib/supabase/client";
import { inspectUpload } from "@/lib/upload-policy";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    console.error("Upload service is not configured - missing SUPABASE_SERVICE_ROLE_KEY");
    return NextResponse.json(
      { error: "Upload service is not configured - SUPABASE_SERVICE_ROLE_KEY missing" },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error("Failed to parse form data:", error);
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const decision = inspectUpload(file.name, file.type, bytes);
  if (!decision.ok) {
    return NextResponse.json({ error: decision.error }, { status: 400 });
  }

  const safeName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${decision.extension}`;
  const path = `uploads/${safeName}`;

  try {
    const { error } = await supabase.storage.from("media").upload(path, bytes, {
      contentType: decision.contentType,
      upsert: false,
    });

    if (error) {
      console.error(`Supabase upload error for ${file.name}:`, error);
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);

    return NextResponse.json({
      url: urlData.publicUrl,
      name: file.name,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Upload error for ${file.name}:`, errorMsg);
    return NextResponse.json({ error: `Upload failed: ${errorMsg}` }, { status: 500 });
  }
}
