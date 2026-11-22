# 🎬 NginxFlix — Production-Grade Streaming Infrastructure

A full-scale, hands-on infrastructure engineering project demonstrating **25+ advanced NGINX features** integrated into a single cohesive streaming platform architecture, powered by Node.js/Express microservices in Docker.

---

## 📐 Architecture Topology

All external traffic enters strictly through NGINX on ports 80 and 443. All backend Express services are hidden on Docker's private bridge network.

```text
                                [ User / Client Browser ]
                                            │
                                            ▼
           [ NGINX :80 ] ──HTTP 301 Permanent Redirect──► [ NGINX :443 (TLS/SSL) ]
                                                                   │
    ┌───────────────────────────┬──────────────────────────────────┼───────────────────────────┬───────────────────────────┐
    │ (www)                     │ (app)                            │ (api)                     │ (cdn)                     │ (ws)
    ▼                           ▼                                  ▼                           ▼                           ▼
www.nginxflix.local      app.nginxflix.local                api.nginxflix.local         cdn.nginxflix.local         ws.nginxflix.local
[Static Marketing Site]  [Least-Connections Balancer]       [Path-Based API Gateway]    [Edge Proxy Cache]          [WebSocket Proxy]
    │                           │                                  │                           │                           │
 HTML/CSS Assets         ┌──────┼──────┐                    ┌──────┼──────┐              Proxy to :4002              Chat WebSockets
                         │      │      │                    │      │      │            (use_stale failover)        (Connection upgrade)
                       :3001  :3002  :3003                /users /videos /search               │                           │
                       App-1  App-2  App-3                  │      │      │              video-service               chat-service
                                                          :4001  :4002  :4003

                                                admin.nginxflix.local
                                                [IP Whitelist + Basic Auth]
                                                            │
                                                  /nginx_status & App-1
```

---

## 🌟 The 25 NGINX Features Implemented

| # | Feature | Directive / Implementation | Description |
|---|---|---|---|
| **1** | **Static File Serving** | `root`, `index`, `try_files` | High-performance direct static asset delivery bypassing Node.js. |
| **2** | **Virtual Hosting** | `server_name` | Multiple subdomains (`www`, `app`, `api`, `cdn`, `ws`, `admin`) on one IP. |
| **3** | **SSL/TLS Termination** | `ssl_certificate`, `ssl_protocols` | TLS 1.2 & 1.3 termination with self-signed wildcard certs. |
| **4** | **HTTP &rarr; HTTPS Redirect** | `return 301 https://$host$request_uri;` | Immediate permanent redirection preserving host, path, and queries. |
| **5** | **Reverse Proxy** | `proxy_pass` | Transparently forwards client requests to internal Docker containers. |
| **6** | **Load Balancing** | `least_conn` | Routes traffic to the instance with the fewest active connections. |
| **7** | **Passive Health Checks** | `max_fails=3 fail_timeout=30s` | Auto-detects backend failure and temporarily diverts traffic. |
| **8** | **API Gateway Routing** | `location ~ ^/v1/...` | Path-based routing dispatching to User, Video, and Search services. |
| **9** | **Proxy Disk Caching** | `proxy_cache`, `proxy_cache_valid` | Two-level hierarchy disk cache with sub-millisecond response time. |
| **10** | **Cache Bypass** | `proxy_cache_bypass $http_x_cache_bypass;` | Client-triggered real-time cache invalidation and refresh. |
| **11** | **WebSocket Proxying** | `Upgrade`, `Connection "upgrade"` | Full-duplex connection upgrades for real-time live chat. |
| **12** | **Rate Limiting** | `limit_req_zone`, `limit_req_status 429` | Leaky-bucket throttling returning RFC 6585 `429 Too Many Requests`. |
| **13** | **Connection Limiting** | `limit_conn_zone`, `limit_conn` | Limits maximum concurrent open TCP sockets per client IP. |
| **14** | **IP Whitelisting & Deny** | `allow`, `deny all` | Default-deny firewall on the admin portal. |
| **15** | **Gzip Compression** | `gzip on`, `gzip_comp_level 6` | Compresses text, HTML, CSS, JSON, and SVG payloads. |
| **16** | **Custom Error Pages** | `error_page 404 502 503` | Branded Netflix-themed interceptors with `internal;` access control. |
| **17** | **URL Rewriting** | `rewrite ... break`, `return 301` | Scoped legacy query rewrites (`/watch?v=123` &rarr; `/v1/videos/123`). |
| **18** | **CORS & Preflight** | `Access-Control-Allow-*` | Native OPTIONS preflight interception returning `204 No Content`. |
| **19** | **Security Headers** | `Strict-Transport-Security`, `CSP` | HSTS, X-Frame-Options, X-Content-Type-Options protection. |
| **20** | **Distributed Tracing** | `proxy_set_header X-Request-ID` | Correlation ID generation via `$request_id` passed to backends and client. |
| **21** | **Structured JSON Logging**| `log_format json_log escape=json` | Elastic/Splunk-ready JSON access logs with upstream latency metrics. |
| **22** | **HTTP Basic Auth** | `auth_basic`, `.htpasswd` | Apache MD5 (APR1) encrypted credentials protecting the admin area. |
| **23** | **Canary Deployments** | `upstream ... weight=9 / weight=1` | Weighted routing sending 90% traffic to v1 and 10% to canary v2. |
| **24** | **Buffering & Timeouts** | `proxy_buffering on`, `proxy_buffers` | Tuning response buffers to decouple Node.js from slow mobile clients. |
| **25** | **Dynamic Device Map** | `map $http_user_agent $device_type` | Zero-cost User-Agent regex parsing to identify mobile vs desktop clients. |

---

## 🚀 Quick Start Guide

### 1. Configure Local DNS
Add the following entries to your hosts file (`C:\Windows\System32\drivers\etc\hosts` on Windows or `/etc/hosts` on Linux/macOS):
```text
127.0.0.1   www.nginxflix.local
127.0.0.1   app.nginxflix.local
127.0.0.1   api.nginxflix.local
127.0.0.1   cdn.nginxflix.local
127.0.0.1   ws.nginxflix.local
127.0.0.1   admin.nginxflix.local
```
*(On Windows, you can right-click PowerShell as Administrator and run `powershell -ExecutionPolicy Bypass -File scripts\setup-hosts.ps1`).*

### 2. Launch Containers
```bash
docker compose up --build -d
```

### 3. Run the Automated 25-Feature Test Suite
* **PowerShell**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts\test-features.ps1
  ```
* **Bash**:
  ```bash
  bash scripts/test-features.sh
  ```

---

## 🌐 Endpoints & Portals

* **Marketing Site**: [https://www.nginxflix.local](https://www.nginxflix.local)
* **Load-Balanced App**: [https://app.nginxflix.local](https://app.nginxflix.local)
* **API Gateway Users**: [https://api.nginxflix.local/v1/users](https://api.nginxflix.local/v1/users)
* **API Gateway Videos**: [https://api.nginxflix.local/v1/videos](https://api.nginxflix.local/v1/videos)
* **API Gateway Search**: [https://api.nginxflix.local/v1/search?q=nginx](https://api.nginxflix.local/v1/search?q=nginx)
* **Canary Deployment**: [https://api.nginxflix.local/v2/](https://api.nginxflix.local/v2/)
* **CDN Caching**: [https://cdn.nginxflix.local/videos/1/thumbnail](https://cdn.nginxflix.local/videos/1/thumbnail)
* **Live Video Player**: [https://cdn.nginxflix.local/videos/1/watch](https://cdn.nginxflix.local/videos/1/watch)
* **HTTP 206 Byte-Range Video Stream**: [https://cdn.nginxflix.local/videos/1/stream](https://cdn.nginxflix.local/videos/1/stream)
* **WebSocket Live Chat**: [https://ws.nginxflix.local](https://ws.nginxflix.local)
* **Admin Portal**: [https://admin.nginxflix.local](https://admin.nginxflix.local) *(User: `admin` / Password: `admin123`)*
* **Telemetry Metrics**: [https://admin.nginxflix.local/nginx_status](https://admin.nginxflix.local/nginx_status)
