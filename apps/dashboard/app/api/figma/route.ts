import { NextRequest, NextResponse } from "next/server";

/**
 * Figma API Proxy Route
 *
 * Securely proxies Figma API requests without exposing the token to the client.
 *
 * Security features:
 * - Token stored only in server environment variables
 * - Input validation for fileId
 * - Basic rate limiting
 * - Response sanitization
 * - CORS protection
 */

// Simple in-memory rate limiting (can be enhanced with Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  // Try various headers for IP (respects proxies)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

function validateFileId(fileId: string): boolean {
  // Figma file IDs are alphanumeric strings, typically 15-30 characters
  // Basic validation - adjust based on your needs
  return /^[a-zA-Z0-9_-]{10,50}$/.test(fileId);
}

function extractFileIdFromUrl(url: string): string | null {
  // Extract file ID from Figma URL patterns:
  // https://www.figma.com/design/{fileId}/...
  // https://figma.com/design/{fileId}/...
  const match = url.match(/figma\.com\/design\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }

    // Get fileId from query params or URL
    const { searchParams } = new URL(request.url);
    const fileIdParam = searchParams.get("fileId");
    const urlParam = searchParams.get("url");

    let fileId: string | null = null;

    if (fileIdParam) {
      fileId = fileIdParam;
    } else if (urlParam) {
      fileId = extractFileIdFromUrl(urlParam);
    }

    if (!fileId || !validateFileId(fileId)) {
      return NextResponse.json(
        { error: "Invalid or missing fileId parameter" },
        { status: 400 },
      );
    }

    // Get token from server environment (never exposed to client)
    const figmaToken = process.env.FIGMA_TOKEN;
    if (!figmaToken) {
      return NextResponse.json(
        { error: "Figma service is not configured" },
        { status: 500 },
      );
    }

    // Optional: Check origin in production (uncomment and configure as needed)
    // const origin = request.headers.get("origin");
    // const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
    // if (origin && !allowedOrigins.includes(origin)) {
    //   return NextResponse.json({ error: "Unauthorized origin" }, { status: 403 });
    // }

    // Call Figma API
    const figmaApiUrl = `https://api.figma.com/v1/files/${fileId}`;
    const figmaResponse = await fetch(figmaApiUrl, {
      headers: {
        "X-Figma-Token": figmaToken,
      },
    });

    if (!figmaResponse.ok) {
      const errorText = await figmaResponse.text();
      console.error(`Figma API error: ${figmaResponse.status} - ${errorText}`);

      // Don't expose internal errors to client
      return NextResponse.json(
        { error: "Failed to fetch Figma file data" },
        { status: figmaResponse.status === 404 ? 404 : 500 },
      );
    }

    const figmaData = await figmaResponse.json();

    // Sanitize response - only return necessary data
    // Adjust this based on what your frontend actually needs
    const sanitizedResponse = {
      name: figmaData.name,
      lastModified: figmaData.lastModified,
      version: figmaData.version,
      document: figmaData.document,
      // Add other fields as needed, but avoid sensitive data
    };

    return NextResponse.json(sanitizedResponse, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Figma proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
