# Port Configuration for Server Performance Analysis Tool

## Issue Addressed

The application was encountering `EADDRINUSE` errors when trying to start on predefined ports (3000, 3001, 3005, etc.) because these ports were already in use on the server.

## Solution Implemented

We've implemented a dynamic port finding system using the `portfinder` package to automatically locate and use available ports on the server.

### Key Changes

1. **Added portfinder dependency**:
   - Installed the `portfinder` npm package

2. **Modified server/index.ts**:
   - Added port finding logic
   - Configured range of ports to try (3000-9000)
   - Implemented fallback mechanism to a high port (9876) if no ports are available in the range

3. **Added TypeScript definitions**:
   - Created `server/types/portfinder.d.ts` for TypeScript support

## How It Works

1. The server attempts to find an available port starting from a base port (default: 3000 or environment variable `PORT`)
2. It tries ports sequentially up to port 9000
3. If successful, it starts the server on the first available port
4. If no ports are available in that range, it falls back to port 9876
5. The actual port in use is logged at startup: `serving on port XXXX`

## Configuration Options

You can specify a starting port by setting the `PORT` environment variable:

```bash
PORT=5000 npm run dev
```

## Troubleshooting

If you still encounter port conflicts:

1. The console will log which port is being used
2. You can manually set a higher port range by modifying `portfinder.basePort` and `portfinder.highestPort` in `server/index.ts`
3. In extreme cases, you can use `lsof -i :PORT` to identify and terminate processes using specific ports

## Note for Deployment

In production environments, you should consider setting a specific port through an environment variable and ensuring it doesn't conflict with other services.
