# 🚀 RAAH NAGAR - Production Deployment & Reverse Proxy Architecture

This directory provides production-ready reverse proxy templates for **HTTPS** and **WSS (WebSocket Secure)** termination.

## 🏗️ Architecture Overview

```
[ User Browser / Mobile App ]
             │ (HTTPS / WSS on Port 443)
             ▼
[ Reverse Proxy: Nginx or Caddy ] ── Terminating TLS & Serving Static Vite Build
             │ (Internal HTTP / WS on 127.0.0.1:5000)
             ▼
[ Node.js Express & WebSocket Server ] ── (app.set('trust proxy', 1))
             │
      ┌──────┴──────┐
      ▼             ▼
[ MySQL 9.7 ]  [ Real IoT Gateway ]
```

### Key Production Safety Principles
1. **Node is NOT the TLS termination layer**: Nginx or Caddy handles TLS 1.2/1.3, SSL certificate rotation, HTTP/2, and static asset distribution.
2. **Strict Production CORS**: In production (`NODE_ENV=production`), Express rejects any requests from `localhost`, `127.0.0.1`, or unverified origins. Only origins explicitly defined in `ALLOWED_ORIGINS` starting with `https://` are permitted.
3. **Real WebSocket Authentication**: When a client connects to the WebSocket, it must send an authenticated JWT within 5 seconds. The backend verifies the signature and validates that the user exists, is active, and is verified in the MySQL database before sending any society telemetry.
4. **No Fake / Simulated State**: All hardware states start at `0` or `'NOT_CONNECTED'` until an authenticated physical IoT gateway posts live telemetry to `/api/iot/gateway/telemetry`.
5. **Real SMTP Notifications**: Email dispatches are routed through live SMTP sockets with strict confirmation checks.

## 🔧 Deployment Steps

### Option A: Using Nginx + Certbot
1. Copy `deploy/nginx.conf` to `/etc/nginx/sites-available/raahnagar.conf`.
2. Replace `society.yourdomain.com` with your production domain name.
3. Enable the site and obtain SSL certificates:
   ```bash
   sudo ln -s /etc/nginx/sites-available/raahnagar.conf /etc/nginx/sites-enabled/
   sudo certbot --nginx -d society.yourdomain.com
   sudo nginx -t && sudo systemctl reload nginx
   ```
4. Build the frontend:
   ```bash
   npm run build
   sudo cp -r dist/* /var/www/raahnagar/dist/
   ```

### Option B: Using Caddy (Zero-Config SSL)
1. Copy `deploy/Caddyfile` to `/etc/caddy/Caddyfile`.
2. Replace `society.yourdomain.com` with your production domain.
3. Reload Caddy:
   ```bash
   sudo systemctl reload caddy
   ```
