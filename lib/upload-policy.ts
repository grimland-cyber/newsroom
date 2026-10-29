export type UploadDecision =
  | { ok: true; extension: string; contentType: string }
  | { ok: false; error: string };

const ALLOWED: Record<string, { contentType: string; mimes: string[] }> = {
  jpg: { contentType: "image/jpeg", mimes: ["image/jpeg", "image/jpg", "image/pjpeg"] },
  jpeg: { contentType: "image/jpeg", mimes: ["image/jpeg", "image/jpg", "image/pjpeg"] },
  png: { contentType: "image/png", mimes: ["image/png"] },
  gif: { contentType: "image/gif", mimes: ["image/gif"] },
  webp: { contentType: "image/webp", mimes: ["image/webp"] },
  avif: { contentType: "image/avif", mimes: ["image/avif"] },
  pdf: { contentType: "application/pdf", mimes: ["application/pdf"] },
  pptx: {
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    mimes: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  },
  docx: {
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    mimes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  },
  xlsx: {
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    mimes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  },
  zip: {
    contentType: "application/zip",
    mimes: ["application/zip", "application/x-zip-compressed"],
  },
};

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

function asciiAt(bytes: Uint8Array, offset: number, text: string): boolean {
  if (bytes.length < offset + text.length) return false;
  for (let i = 0; i < text.length; i++) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

function signatureMatches(extension: string, bytes: Uint8Array): boolean {
  switch (extension) {
    case "png":
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47]);
    case "jpg":
    case "jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "gif":
      return asciiAt(bytes, 0, "GIF8");
    case "webp":
      return asciiAt(bytes, 0, "RIFF") && asciiAt(bytes, 8, "WEBP");
    case "avif":
      return asciiAt(bytes, 4, "ftyp") && (asciiAt(bytes, 8, "avif") || asciiAt(bytes, 8, "avis"));
    case "pdf":
      return asciiAt(bytes, 0, "%PDF");
    case "zip":
    case "docx":
    case "pptx":
    case "xlsx":
      return (
        startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
        startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
        startsWith(bytes, [0x50, 0x4b, 0x07, 0x08])
      );
    default:
      return false;
  }
}

/**
 * Accept the same kinds of files the admin form offers (images, PDF, Office, zip).
 * SVG and HTML are rejected. The stored content type comes from the allowlist,
 * not from the browser.
 */
export function inspectUpload(
  filename: string,
  mime: string,
  bytes: Uint8Array
): UploadDecision {
  const extension = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  const rule = ALLOWED[extension];
  if (!rule) {
    return {
      ok: false,
      error: "File type not allowed. Upload an image, PDF, Office document, or zip.",
    };
  }

  const normalizedMime = mime.trim().toLowerCase();
  const mimeOk =
    normalizedMime.length === 0 ||
    normalizedMime === "application/octet-stream" ||
    rule.mimes.includes(normalizedMime);
  if (!mimeOk || !signatureMatches(extension, bytes)) {
    return {
      ok: false,
      error: "File type not allowed. The file contents do not match an allowed type.",
    };
  }

  return { ok: true, extension, contentType: rule.contentType };
}
