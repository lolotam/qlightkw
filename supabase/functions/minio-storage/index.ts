import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Reverse proxy (Nginx) handles port forwarding:
// s3.walidmohamed.com → 127.0.0.1:9000 (S3 API)
// minio.walidmohamed.com → 127.0.0.1:9001 (Console)
const MINIO_ENDPOINT = "https://s3.walidmohamed.com";
const MINIO_BUCKET = "qlifgtkw";
const MINIO_PUBLIC_URL = `${MINIO_ENDPOINT}/${MINIO_BUCKET}`;

// Some reverse proxies / WAFs (e.g. Cloudflare Bot Fight / Managed Challenge)
// may return an HTML challenge page to non-browser clients.
// Sending a reasonable UA/Accept often avoids that.
const DEFAULT_UA =
  "Mozilla/5.0 (compatible; QLightStorageMigration/1.0; +https://qlightkw.lovable.app)";
const DEFAULT_ACCEPT = "*/*";

// Helper to create AWS Signature v4
async function signRequest(
  method: string,
  path: string,
  queryString: string,
  headers: Record<string, string>,
  body: ArrayBuffer | null,
  accessKey: string,
  secretKey: string
): Promise<Record<string, string>> {
  const region = "us-east-1";
  const service = "s3";
  const host = new URL(MINIO_ENDPOINT).host;
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.substring(0, 8);

  // Create canonical headers
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const payloadHash = body 
    ? await sha256Hex(body) 
    : "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // empty string hash
  
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  
  // Create canonical request
  const canonicalRequest = [
    method,
    path,
    queryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  // Create string to sign
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = await sha256Hex(new TextEncoder().encode(canonicalRequest).buffer as ArrayBuffer);
  const stringToSign = [algorithm, amzDate, credentialScope, canonicalRequestHash].join("\n");

  // Calculate signature
  const kDate = await hmacSha256(`AWS4${secretKey}`, dateStamp);
  const kRegion = await hmacSha256Raw(kDate, region);
  const kService = await hmacSha256Raw(kRegion, service);
  const kSigning = await hmacSha256Raw(kService, "aws4_request");
  const signature = await hmacSha256Hex(kSigning, stringToSign);

  const authorization = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    "Host": host,
    "X-Amz-Date": amzDate,
    "X-Amz-Content-Sha256": payloadHash,
    "Authorization": authorization,
    ...headers,
  };
}

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(key: string, data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
}

async function hmacSha256Raw(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function hmacSha256Hex(key: ArrayBuffer, data: string): Promise<string> {
  const signatureBuffer = await hmacSha256Raw(key, data);
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// List objects in bucket
async function listObjects(accessKey: string, secretKey: string, prefix: string, maxKeys: number) {
  const path = `/${MINIO_BUCKET}`;
  const queryString = `list-type=2&max-keys=${maxKeys}${prefix ? `&prefix=${encodeURIComponent(prefix)}` : ""}`;
  const url = `${MINIO_ENDPOINT}${path}?${queryString}`;

  const headers = await signRequest(
    "GET",
    path,
    queryString,
    {
      "User-Agent": DEFAULT_UA,
      "Accept": DEFAULT_ACCEPT,
    },
    null,
    accessKey,
    secretKey
  );
  
  const response = await fetch(url, { method: "GET", headers });

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("text/html")) {
    const html = await response.text();
    const snippet = html.slice(0, 500).replace(/\s+/g, " ");
    console.error("Unexpected HTML from S3 listObjects:", {
      status: response.status,
      contentType,
      cfRay: response.headers.get("cf-ray"),
      server: response.headers.get("server"),
      snippet,
    });
    throw new Error(
      `S3 returned HTML for LIST (status ${response.status}). Likely WAF/Cloudflare/proxy. Snippet: ${snippet}`
    );
  }
  
  if (!response.ok) {
    const text = await response.text();
    console.error("ListObjects error:", response.status, text);
    throw new Error(`Failed to list objects: ${response.status}`);
  }

  const xml = await response.text();
  
  // Parse XML response (simple parsing for our needs)
  const files: Array<{name: string; size: number; lastModified: string; url: string}> = [];
  const contentMatches = xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g);
  
  for (const match of contentMatches) {
    const content = match[1];
    const keyMatch = content.match(/<Key>([^<]+)<\/Key>/);
    const sizeMatch = content.match(/<Size>([^<]+)<\/Size>/);
    const lastModifiedMatch = content.match(/<LastModified>([^<]+)<\/LastModified>/);
    
    if (keyMatch) {
      files.push({
        name: keyMatch[1],
        size: sizeMatch ? parseInt(sizeMatch[1]) : 0,
        lastModified: lastModifiedMatch ? lastModifiedMatch[1] : "",
        url: `${MINIO_PUBLIC_URL}/${keyMatch[1]}`,
      });
    }
  }

  return files;
}

// Upload object to bucket
async function uploadObject(
  accessKey: string, 
  secretKey: string, 
  fileName: string, 
  data: ArrayBuffer, 
  contentType: string
) {
  const path = `/${MINIO_BUCKET}/${fileName}`;
  const url = `${MINIO_ENDPOINT}${path}`;

  const headers = await signRequest("PUT", path, "", { "Content-Type": contentType }, data, accessKey, secretKey);
  headers["Content-Type"] = contentType;

  const response = await fetch(url, { 
    method: "PUT", 
    headers,
    body: data,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Upload error:", response.status, text);
    throw new Error(`Failed to upload: ${response.status}`);
  }

  return `${MINIO_PUBLIC_URL}/${fileName}`;
}

// Download object from bucket
async function getObject(accessKey: string, secretKey: string, fileName: string) {
  const path = `/${MINIO_BUCKET}/${fileName}`;
  const url = `${MINIO_ENDPOINT}${path}`;

  const headers = await signRequest(
    "GET",
    path,
    "",
    {
      "User-Agent": DEFAULT_UA,
      "Accept": DEFAULT_ACCEPT,
    },
    null,
    accessKey,
    secretKey
  );
  const response = await fetch(url, { method: "GET", headers });

  if (!response.ok) {
    const text = await response.text();
    console.error("GetObject error:", response.status, text.substring(0, 500));
    throw new Error(`Failed to get object: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const contentTypeLower = contentType.toLowerCase();
  if (contentTypeLower.includes("text/html")) {
    const html = await response.text();
    const snippet = html.slice(0, 500).replace(/\s+/g, " ");
    console.error("Unexpected HTML from S3 getObject:", {
      fileName,
      status: response.status,
      contentType,
      cfRay: response.headers.get("cf-ray"),
      server: response.headers.get("server"),
      snippet,
    });
    throw new Error(
      `S3 returned HTML instead of file bytes for "${fileName}" (status ${response.status}). ` +
        `Likely WAF/Cloudflare/proxy. Snippet: ${snippet}`
    );
  }

  const buf = await response.arrayBuffer();
  // NOTE: Avoid `String.fromCharCode(...bytes)` for large files (it can overflow the call stack).
  const base64 = encodeBase64(buf);

  return { base64, contentType };
}

// Delete object from bucket
async function deleteObject(accessKey: string, secretKey: string, fileName: string) {
  const path = `/${MINIO_BUCKET}/${fileName}`;
  const url = `${MINIO_ENDPOINT}${path}`;

  const headers = await signRequest("DELETE", path, "", {}, null, accessKey, secretKey);

  const response = await fetch(url, { method: "DELETE", headers });

  if (!response.ok && response.status !== 204) {
    const text = await response.text();
    console.error("Delete error:", response.status, text);
    throw new Error(`Failed to delete: ${response.status}`);
  }

  return true;
}

// Base64 decode helper
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const accessKey = Deno.env.get("MINIO_ACCESS_KEY");
    const secretKey = Deno.env.get("MINIO_SECRET_KEY");

    if (!accessKey || !secretKey) {
      console.error("MinIO credentials not configured");
      return new Response(
        JSON.stringify({ success: false, error: "MinIO credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get action from query params OR body (for supabase.functions.invoke which uses POST)
    const url = new URL(req.url);
    let action = url.searchParams.get("action");
    let body: Record<string, any> = {};

    // Try to parse body if POST - supabase.functions.invoke sends JSON
    if (req.method === "POST") {
      try {
        const text = await req.text();
        console.log("Raw body:", text.substring(0, 500));
        if (text) {
          body = JSON.parse(text);
          console.log("Parsed body:", JSON.stringify(body));
          // If action is in body, use it
          if (body.action) {
            action = body.action;
          }
        }
      } catch (e) {
        console.error("Body parse error:", e);
        // Body might be empty or not JSON
      }
    }

    console.log(`MinIO Storage action: ${action}, method: ${req.method}`);

    // LIST - Get files from bucket
    if (action === "list") {
      const prefix = url.searchParams.get("prefix") || body.prefix || "";
      const maxKeys = parseInt(url.searchParams.get("limit") || body.limit || "200");

      console.log(`Listing files with prefix: ${prefix}, maxKeys: ${maxKeys}`);

      const files = await listObjects(accessKey, secretKey, prefix, maxKeys);

      console.log(`Found ${files.length} files`);

      return new Response(
        JSON.stringify({ success: true, files }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET - Download file from bucket (base64)
    if (action === "get" && req.method === "POST") {
      const fileName = body.fileName;

      if (!fileName) {
        return new Response(
          JSON.stringify({ success: false, error: "No fileName provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Getting file: ${fileName}`);

      const { base64, contentType } = await getObject(accessKey, secretKey, fileName);

      return new Response(
        JSON.stringify({ success: true, fileData: base64, contentType }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // UPLOAD - Upload file to bucket (supports both FormData and JSON with base64)
    if (action === "upload" && req.method === "POST") {
      let fileData: ArrayBuffer;
      let fileName: string;
      let contentType: string;
      let folder: string = "";

      // Check if body has base64 data (from supabase.functions.invoke)
      if (body.fileData && body.fileName) {
        fileData = base64ToArrayBuffer(body.fileData);
        fileName = body.fileName;
        contentType = body.contentType || "application/octet-stream";
        folder = body.folder || "";
      } else {
        // Try FormData (from direct fetch)
        const formData = await req.formData();
        const file = formData.get("file") as File;
        folder = formData.get("folder") as string || "";

        if (!file) {
          return new Response(
            JSON.stringify({ success: false, error: "No file provided" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        fileData = await file.arrayBuffer();
        fileName = file.name;
        contentType = file.type;
      }

      const preserveName = Boolean(body.preserveName);

      // Generate filename
      let finalFileName: string;
      if (preserveName) {
        // Keep caller-provided name under the requested folder
        const cleanName = String(fileName).replace(/^\/+/, "");
        finalFileName = folder ? `${folder}/${cleanName}` : cleanName;
      } else {
        const ext = fileName.split(".").pop();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        finalFileName = folder 
          ? `${folder}/${timestamp}-${random}.${ext}`
          : `${timestamp}-${random}.${ext}`;
      }

      console.log(`Uploading file: ${finalFileName}, size: ${fileData.byteLength}, type: ${contentType}`);

      const publicUrl = await uploadObject(accessKey, secretKey, finalFileName, fileData, contentType);

      console.log(`Upload successful: ${publicUrl}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          url: publicUrl,
          fileName: finalFileName,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE - Delete file from bucket
    if (action === "delete" && req.method === "POST") {
      const fileName = body.fileName;

      if (!fileName) {
        return new Response(
          JSON.stringify({ success: false, error: "No fileName provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Deleting file: ${fileName}`);

      await deleteObject(accessKey, secretKey, fileName);

      console.log(`Delete successful: ${fileName}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

     return new Response(
       JSON.stringify({ success: false, error: "Invalid action. Use: list, get, upload, or delete" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("MinIO Storage error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
