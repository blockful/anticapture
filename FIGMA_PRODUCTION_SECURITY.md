# Figma Token Production Security

## ✅ Your Token is Protected in Production

### Development Mode (Local)

- ✅ **Token works**: Design tab shows Figma designs
- ✅ **Token injected**: Via webpack DefinePlugin for Storybook addon-designs
- ✅ **Safe**: Only runs locally on your machine

### Production Build (`pnpm build-storybook`)

- ✅ **Token excluded**: Automatically set to `undefined` in production builds
- ✅ **Design tab disabled**: Will show "Personal Access Token is required" (expected)
- ✅ **Token never exposed**: Not included in any production bundle files

## How It Works

The Storybook configuration checks `NODE_ENV`:

```typescript
const isProduction = process.env.NODE_ENV === "production";

if (!isProduction && process.env.FIGMA_TOKEN) {
  // Dev mode: Inject token
} else if (isProduction) {
  // Production: Explicitly set to undefined
  "process.env.FIGMA_TOKEN": JSON.stringify(undefined)
}
```

**Storybook automatically sets `NODE_ENV=production` when you run `storybook build`**, so the token is automatically excluded.

## Testing Production Security

After building Storybook for production, verify the token is not exposed:

```bash
# Build Storybook
pnpm dashboard build-storybook

# Test for token exposure
pnpm dashboard test:storybook-production
```

This will scan all production build files and verify no tokens are present.

## Next.js Production Deployment

For your **Next.js app** (not Storybook):

1. ✅ **API Route** (`/api/figma`): Uses `process.env.FIGMA_TOKEN` server-side only
2. ✅ **Token never exposed**: Only accessible in server-side code
3. ✅ **Set in hosting platform**: Add `FIGMA_TOKEN` as environment variable in Vercel/etc.

## Summary

| Environment                              | Token Status        | Design Tab Works?    |
| ---------------------------------------- | ------------------- | -------------------- |
| **Local Dev** (`storybook dev`)          | ✅ Injected         | ✅ Yes               |
| **Production Build** (`storybook build`) | ❌ Excluded         | ❌ No (by design)    |
| **Next.js Production**                   | ✅ Server-side only | N/A (uses API proxy) |

## Important Notes

1. **Storybook is typically dev-only**: Most teams don't deploy Storybook to production
2. **If you deploy Storybook**: The design tab won't work (token excluded), but that's intentional for security
3. **Next.js app**: Token works perfectly in production via the API proxy (server-side only)
4. **Your token is safe**: Never exposed in production builds or client-side code
