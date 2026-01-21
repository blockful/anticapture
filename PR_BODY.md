# Fix: Token Holders Endpoint Validation Error

## Problem Fixed

Fixed validation error in `/token-holders` endpoint: `"Validation error: Expected number, received string at \"totalCount\""`

## Root Cause

The SQL `COUNT(*)` query was returning a string value, but the Zod response schema expected a number type. This caused validation to fail when the response was being parsed.

## Solution

- Added explicit `Number()` conversion to the `totalCount` field in the repository layer
- Follows existing pattern used in other parts of the codebase (`account-balance/interactions.ts`)
- Ensures type consistency between database response and API schema

## Frontend Impact

### ✅ No Breaking Changes Required

This fix is **backward compatible** - no frontend code changes are needed.

### What Changed

- `totalCount` field in `/token-holders` response is now guaranteed to be a `number` type
- Previously, it could sometimes be returned as a string, causing validation errors
- The API contract remains the same - `totalCount` was always supposed to be a number

### Frontend Verification

If you want to verify the fix is working in your frontend code:

1. **Type Safety**: TypeScript should now work correctly with `totalCount` as a number
2. **Runtime Checks**: Any code that expects `totalCount` to be a number will work reliably
3. **No More Validation Errors**: The endpoint should no longer throw validation errors

### Example Response (After Fix)

```json
{
  "period": {
    "days": "90d",
    "startTimestamp": "2025-09-30T18:51:52.000Z",
    "endTimestamp": "2025-12-29T18:51:52.000Z"
  },
  "totalCount": 22006,  // ✅ Now guaranteed to be number type
  "items": [...]
}
```

### Testing

- ✅ Endpoint tested with various pagination parameters
- ✅ Filtering works correctly (`delegate=nonzero`, etc.)
- ✅ `totalCount` consistently returns as number type
- ✅ No validation errors occur

## Files Changed

- `apps/indexer/src/api/repositories/token-holders/index.ts` - Added `Number()` conversion

## Related

- Follows the same pattern as `apps/indexer/src/api/repositories/account-balance/interactions.ts:138`
