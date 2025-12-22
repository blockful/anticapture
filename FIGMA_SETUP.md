# Figma API Proxy Setup Guide

## Overview

This project uses a secure server-side proxy to access the Figma API without exposing tokens to the browser or public repository.

## Security Architecture

- ✅ **Token stored only in server environment variables** (`FIGMA_TOKEN`)
- ✅ **Token never exposed to browser/client**
- ✅ **Repository can remain fully public**
- ✅ **Rate limiting and input validation**

## Setup Instructions

### 1. Local Development

**Step 1**: Create a `.env.local` file in the `apps/dashboard` directory (if it doesn't exist):

```bash
# apps/dashboard/.env.local
FIGMA_TOKEN=your_figma_personal_access_token_here
```

**Step 2**: Get your Figma Personal Access Token:

1. Go to https://www.figma.com/developers/api#access-tokens
2. Click "Create a new personal access token"
3. Give it a name (e.g., "Anticapture Development")
4. Copy the token (it starts with `figd_`)
5. Paste it into your `.env.local` file

**Important**:

- `.env.local` is gitignored and should never be committed
- The token must start with `figd_`
- Make sure there are no spaces or quotes around the token value
- Restart Storybook after adding/changing the token

### 2. Production (Vercel/Serverless)

Add the environment variable in your hosting platform:

**Vercel:**

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `FIGMA_TOKEN` with your Figma token value
4. Select the appropriate environments (Production, Preview, Development)

**Other platforms:**

- Set `FIGMA_TOKEN` as a server-side environment variable
- Never use `NEXT_PUBLIC_` prefix (that would expose it to the browser)

### 3. Verify Setup

The API endpoint is available at:

- **Local**: `http://localhost:3000/api/figma?fileId=YOUR_FILE_ID`
- **Production**: `https://your-domain.com/api/figma?fileId=YOUR_FILE_ID`

Test it:

```bash
curl "http://localhost:3000/api/figma?fileId=DEKMQifA8YOb3oxznHboSY"
```

## Usage

### In Storybook

Storybook stories automatically use the secure proxy. The token is loaded from server-side environment variables:

```typescript
import { getFigmaDesignConfig } from "@/shared/utils/figma-storybook";

const meta = {
  parameters: {
    design: getFigmaDesignConfig("https://www.figma.com/design/..."),
  },
};
```

### In Frontend Code

Use the client utility to fetch Figma data:

```typescript
import { fetchFigmaFile } from "@/shared/utils/figma";

// Using fileId
const data = await fetchFigmaFile({ fileId: "DEKMQifA8YOb3oxznHboSY" });

// Or using URL
const data = await fetchFigmaFile({
  url: "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/...",
});
```

## API Endpoint

### `GET /api/figma`

**Query Parameters:**

- `fileId` (string, required): Figma file ID
- `url` (string, optional): Full Figma URL (fileId will be extracted)

**Response:**

```json
{
  "name": "File Name",
  "lastModified": "2024-01-01T00:00:00Z",
  "version": "1234567890",
  "document": { ... }
}
```

**Rate Limiting:**

- 30 requests per minute per IP address
- Returns 429 status if exceeded

**Error Responses:**

- `400`: Invalid or missing fileId
- `404`: File not found
- `429`: Rate limit exceeded
- `500`: Server error or missing token

## Security Features

1. **Input Validation**: File IDs are validated before making requests
2. **Rate Limiting**: Prevents abuse (30 req/min per IP)
3. **Response Sanitization**: Only necessary data is returned
4. **Error Handling**: Sensitive information is never leaked
5. **CORS Protection**: Optional origin checks (configure in route.ts)

## Troubleshooting

### Storybook not showing Figma designs

1. **Check environment variable**:
   - Ensure `FIGMA_TOKEN` is set in `apps/dashboard/.env.local`
   - Verify the file exists and is in the correct location
   - Check that the token value doesn't have quotes or spaces
2. **Restart Storybook**:
   - Stop Storybook (Ctrl+C)
   - Start it again: `pnpm dashboard storybook`
   - Environment variables are loaded at startup
3. **Check console**:
   - Look for warnings about missing token in the browser console
   - Check the terminal where Storybook is running for errors
4. **Verify token format**:
   - Token should start with `figd_`
   - Should be a long string (typically 40+ characters)
   - No spaces, quotes, or line breaks
5. **Test the token**:
   ```bash
   # Test if token works with Figma API directly
   curl -H "X-Figma-Token: YOUR_TOKEN" https://api.figma.com/v1/files/DEKMQifA8YOb3oxznHboSY
   ```

### API returns 500 error

1. **Check token**: Verify `FIGMA_TOKEN` is set correctly
2. **Check token validity**: Ensure the token hasn't expired
3. **Check logs**: Server logs will show the actual error

### Rate limit errors

- The API limits to 30 requests per minute per IP
- For higher limits, consider implementing Redis-based rate limiting

## Why This Approach is Safe

1. **Token Isolation**: Token exists only in server environment variables, never in code
2. **No Client Exposure**: Frontend code never sees or receives the token
3. **Public Repo Safe**: No secrets in codebase, only in environment configuration
4. **Controlled Access**: Server can implement additional security layers (rate limiting, origin checks, etc.)

## Files Created

- `apps/dashboard/app/api/figma/route.ts` - API route handler
- `apps/dashboard/shared/utils/figma.ts` - Client utility
- `apps/dashboard/shared/utils/figma-storybook.ts` - Storybook helper

## Migration Notes

All Storybook story files have been updated to use `getFigmaDesignConfig()` instead of hardcoded tokens. The old pattern:

```typescript
// ❌ OLD - Hardcoded token (INSECURE)
design: {
  type: "figspec",
  url: "...",
  accessToken: "figd_..."
}
```

Has been replaced with:

```typescript
// ✅ NEW - Secure server-side token
import { getFigmaDesignConfig } from "@/shared/utils/figma-storybook";

design: getFigmaDesignConfig("...");
```
