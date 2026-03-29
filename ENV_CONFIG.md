# Environment Configuration

This project uses environment-based API endpoint configuration to support both local development and production deployments.

## Environment Files

### `.env.local` (Development)
Used when running `npm run dev` locally. Points to your local backend:
```
VITE_API_BASE_URL=http://localhost:5000
```

### `.env.production` (Production)
Used when building for production (`npm run build`). Points to your production server:
```
VITE_API_BASE_URL=https://my-school-pwjd.onrender.com
```

## How It Works

1. **Vite's Environment Variables**: Uses `import.meta.env.VITE_*` pattern
2. **Runtime Configuration**: The `src/config/api.ts` module provides API config
3. **Development Proxy**: Vite's dev server proxies `/api` requests to the configured target
4. **Production**: Built code uses the production API URL directly

## Usage in Components

### Option 1: Using the API Config (Recommended)
```typescript
import { buildApiUrl } from "@/config/api";

const endpoint = buildApiUrl("/api/students");
const response = await fetch(endpoint, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});
```

### Option 2: Direct Relative URLs (Current Approach)
If using Vite's proxy (already configured in vite.config.ts), you can continue using relative paths:
```typescript
const response = await fetch("/api/students", { /* ... */ });
```

## Configuration Details

### For Local Development
1. Ensure your backend is running on `http://localhost:5000`
2. Run `npm run dev` to start the Vite dev server
3. The proxy in vite.config.ts will forward `/api/*` requests to your local backend

### For Production
1. Update `.env.production` with your actual server URL if needed
2. Run `npm run build` to create optimized production bundle
3. Deploy to Vercel (or your hosting platform)
4. Vercel's rewrites in `vercel.json` will handle `/api/*` routing

## Environment Variables Available

In your code, you can access:
```typescript
import { apiConfig } from "@/config/api";

console.log(apiConfig.baseURL);        // "http://localhost:5000" or production URL
console.log(apiConfig.isDevelopment);  // true in dev, false in prod
console.log(apiConfig.isProduction);   // false in dev, true in prod
```

## Customization

To use different API endpoints or add more environment variables:

1. **Add to `.env.local` and `.env.production`**:
   ```
   VITE_API_BASE_URL=http://localhost:5000
   VITE_API_TIMEOUT=30000
   ```

2. **Import in your config**:
   ```typescript
   export const apiConfig = {
     baseURL: import.meta.env.VITE_API_BASE_URL,
     timeout: import.meta.env.VITE_API_TIMEOUT,
   };
   ```

## Security Notes

- `.env.local` is in `.gitignore` and won't be committed
- Never commit sensitive credentials in `.env.production`
- Use Vercel's environment variables for production secrets
- Public environment variables should be prefixed with `VITE_`
