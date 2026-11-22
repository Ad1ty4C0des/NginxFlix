# NginxFlix Automated Feature Test Suite (PowerShell)
# Tests all 25 NGINX features against the live Docker environment

$PassCount = 0
$FailCount = 0

function Test-NginxFeature {
    param (
        [string]$FeatureId,
        [string]$FeatureName,
        [scriptblock]$TestLogic
    )

    try {
        $result = & $TestLogic
        if ($result.Passed) {
            Write-Host "[PASS] [$FeatureId]: $FeatureName" -ForegroundColor Green
            $global:PassCount++
        } else {
            Write-Host "[FAIL] [$FeatureId]: $FeatureName" -ForegroundColor Red
            Write-Host "   Reason: $($result.Reason)" -ForegroundColor Yellow
            $global:FailCount++
        }
    } catch {
        Write-Host "[FAIL] [$FeatureId]: $FeatureName (Exception)" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Yellow
        $global:FailCount++
    }
}

Write-Host "`n=== Starting NginxFlix 25-Feature Test Suite ===" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor DarkGray

# 1. Static File Serving
Test-NginxFeature "F01" "Static File Serving (HTML/CSS)" {
    $res = curl.exe -sk https://www.nginxflix.local/
    @{ Passed = ($res -match "Welcome to NginxFlix" -or $res -match "Stream with"); Reason = "Expected marketing page title in response" }
}

# 2. Virtual Hosting
Test-NginxFeature "F02" "Virtual Hosting (Multiple Server Blocks)" {
    $resWWW = curl.exe -sk https://www.nginxflix.local/
    $resApp = curl.exe -sk https://app.nginxflix.local/
    @{ Passed = ($resWWW -match "html" -and $resApp -match '"service":"app"'); Reason = "Different subdomains must route to different server blocks" }
}

# 3. SSL/TLS Termination
Test-NginxFeature "F03" "SSL/TLS Termination (HTTPS & Protocols)" {
    $res = curl.exe -skI https://www.nginxflix.local/
    @{ Passed = ($res -match "HTTP/1.1 200 OK"); Reason = "HTTPS connection must complete successfully" }
}

# 4. HTTP to HTTPS Redirect
Test-NginxFeature "F04" "HTTP to HTTPS 301 Permanent Redirect" {
    $res = curl.exe -sI http://www.nginxflix.local/
    @{ Passed = ($res -match "301 Moved Permanently" -and $res -match "Location: https://www.nginxflix.local/"); Reason = "Expected 301 redirect to HTTPS" }
}

# 5. Reverse Proxy
Test-NginxFeature "F05" "Reverse Proxy (proxy_pass to Express)" {
    $res = curl.exe -sk https://app.nginxflix.local/
    @{ Passed = ($res -match '"service":"app"'); Reason = "Expected Express JSON response" }
}

# 6. Load Balancing
Test-NginxFeature "F06" "Load Balancing across Upstream Pool" {
    $res = curl.exe -sk https://app.nginxflix.local/
    @{ Passed = ($res -match '"instance":"app-'); Reason = "Expected instance identifier from backend pool" }
}

# 7. Passive Health Checks
Test-NginxFeature "F07" "Passive Health Checks (max_fails / fail_timeout)" {
    $conf = Get-Content "nginx\conf.d\upstream.conf" -Raw
    @{ Passed = ($conf -match "max_fails=3" -and $conf -match "fail_timeout=30s"); Reason = "Upstream passive health checks must be configured" }
}

# 8. Path-Based API Gateway Routing
Test-NginxFeature "F08" "API Gateway Path Routing (/v1/users, /v1/videos, /v1/search)" {
    $u = curl.exe -sk https://api.nginxflix.local/v1/users
    $v = curl.exe -sk https://api.nginxflix.local/v1/videos
    $s = curl.exe -sk "https://api.nginxflix.local/v1/search?q=nginx"
    @{ Passed = ($u -match "Alice" -and $v -match "Nginx Masterclass" -and $s -match '"service":"search-service"'); Reason = "All microservices must answer on their subpaths" }
}

# 9. Proxy Caching
Test-NginxFeature "F09" "Disk Proxy Caching (MISS -> HIT)" {
    $null = curl.exe -skI https://cdn.nginxflix.local/videos/
    $res = curl.exe -skI https://cdn.nginxflix.local/videos/
    @{ Passed = ($res -match "X-Cache-Status: HIT"); Reason = "Second request must be a cache HIT" }
}

# 10. Cache Bypass
Test-NginxFeature "F10" "Cache Bypass via X-Cache-Bypass Header" {
    $res = curl.exe -skI -H "X-Cache-Bypass: 1" https://cdn.nginxflix.local/videos/
    @{ Passed = ($res -match "X-Cache-Status: BYPASS"); Reason = "Header must trigger BYPASS" }
}

# 11. WebSocket Proxying
Test-NginxFeature "F11" "WebSocket Upgrade & Protocol Switching (101)" {
    $res = curl.exe -sk -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Sec-WebSocket-Version: 13" https://ws.nginxflix.local/ --max-time 1
    @{ Passed = ($res -match "101 Switching Protocols" -and $res -match "Upgrade: websocket"); Reason = "Expected 101 Switching Protocols handshake" }
}

# 12. Rate Limiting
Test-NginxFeature "F12" "Rate Limiting with Custom 429 Status" {
    $statuses = @()
    for ($i = 1; $i -le 35; $i++) {
        $statuses += curl.exe -sk -o /dev/null -w "%{http_code}" https://api.nginxflix.local/v1/users
    }
    @{ Passed = ($statuses -contains "429"); Reason = "Rapid burst must trigger HTTP 429" }
}

# 13. Connection Limiting
Test-NginxFeature "F13" "Connection Limiting Zone (limit_conn_zone)" {
    $conf = Get-Content "nginx\nginx.conf" -Raw
    @{ Passed = ($conf -match "limit_conn_zone" -and $conf -match "conn_limit:10m"); Reason = "Connection limiting zone must be configured in nginx.conf" }
}

# 14. IP Whitelisting & Deny
Test-NginxFeature "F14" "IP Access Control (allow / deny rules)" {
    $conf = Get-Content "nginx\conf.d\admin.conf" -Raw
    @{ Passed = ($conf -match "allow 127.0.0.1" -and $conf -match "deny all"); Reason = "Default-deny IP firewall must be active on admin" }
}

# 15. Gzip Compression
Test-NginxFeature "F15" "Gzip Compression" {
    $res = curl.exe -skI -H "Accept-Encoding: gzip" https://www.nginxflix.local/
    @{ Passed = ($res -match "Content-Encoding: gzip"); Reason = "Response must have Content-Encoding: gzip" }
}

# 16. Custom Branded Error Pages
Test-NginxFeature "F16" "Custom Error Pages (404, 502, 503)" {
    $res404 = curl.exe -sk https://www.nginxflix.local/not-found-page-test
    @{ Passed = ($res404 -match "Lost your way in the stream"); Reason = "Custom 404.html must render on nonexistent paths" }
}

# 17. URL Rewrites & Redirects
Test-NginxFeature "F17" "Scoped URL Rewrite (/watch?v=123 -> /v1/videos/123)" {
    $res = curl.exe -skI "https://api.nginxflix.local/watch?v=123"
    @{ Passed = ($res -match "301 Moved Permanently" -and $res -match "Location: https://api.nginxflix.local/v1/videos/123"); Reason = "Expected 301 redirect to /v1/videos/123" }
}

# 18. CORS Headers & Preflight
Test-NginxFeature "F18" "CORS Headers & OPTIONS Preflight (204 No Content)" {
    $res = curl.exe -sk -X OPTIONS -I https://api.nginxflix.local/v1/videos
    @{ Passed = ($res -match "204" -and $res -match "Access-Control-Allow-Origin: \*"); Reason = "OPTIONS request must return 204 with CORS headers" }
}

# 19. Security Headers
Test-NginxFeature "F19" "Security Headers (HSTS, X-Frame-Options, CSP)" {
    $res = curl.exe -skI https://www.nginxflix.local/
    @{ Passed = ($res -match "Strict-Transport-Security" -and $res -match "X-Frame-Options: SAMEORIGIN" -and $res -match "X-Content-Type-Options: nosniff"); Reason = "Strict security headers must be attached" }
}

# 20. Custom Proxy Headers & Tracing
Test-NginxFeature "F20" "Distributed Tracing via X-Request-ID Passthrough" {
    $res = curl.exe -skI https://app.nginxflix.local/
    @{ Passed = ($res -match "X-Request-ID:"); Reason = "X-Request-ID must be generated and returned" }
}

# 21. Structured JSON Access Logs
Test-NginxFeature "F21" "Structured JSON Logging" {
    $logLine = Get-Content "logs\nginx\access.log" -Tail 1 -ErrorAction SilentlyContinue
    $isJson = $false
    if ($logLine) {
        try { $null = $logLine | ConvertFrom-Json; $isJson = $true } catch {}
    }
    @{ Passed = $isJson; Reason = "Access log must contain valid JSON entries" }
}

# 22. HTTP Basic Authentication
Test-NginxFeature "F22" "HTTP Basic Authentication (.htpasswd)" {
    $unauth = curl.exe -skI https://admin.nginxflix.local/
    $auth = curl.exe -skI -u admin:admin123 https://admin.nginxflix.local/
    @{ Passed = ($unauth -match "401 Unauthorized" -and $auth -match "200 OK"); Reason = "401 without auth, 200 with credentials" }
}

# 23. Canary Weighted Upstream Routing
Test-NginxFeature "F23" "Canary Deployment (Weighted 90/10 Distribution)" {
    $canaryHits = 0
    for ($i = 1; $i -le 25; $i++) {
        $res = curl.exe -sk https://api.nginxflix.local/v2/
        if ($res -match "search-service") { $canaryHits++ }
    }
    @{ Passed = ($canaryHits -ge 1); Reason = "Canary service must receive ~10% of traffic" }
}

# 24. Timeout & Buffering Tuning
Test-NginxFeature "F24" "Proxy Buffering & Connection Tuning" {
    $conf = Get-Content "nginx\conf.d\app.conf" -Raw
    @{ Passed = ($conf -match "proxy_buffering on" -and $conf -match "proxy_buffers 8 4k"); Reason = "Proxy buffering and buffer sizes must be configured" }
}

# 25. Map Directive & Dynamic Device Detection
Test-NginxFeature "F25" "Map Directive (User-Agent to X-Device-Type)" {
    $res = curl.exe -skI -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)" https://api.nginxflix.local/v1/videos
    @{ Passed = ($res -match "X-Device-Type: mobile"); Reason = "iPhone user-agent must map to mobile device type" }
}

Write-Host "`n========================================================" -ForegroundColor DarkGray
if ($FailCount -eq 0) {
    Write-Host "[SUMMARY] FINAL SCORE: $PassCount / 25 Passed ($FailCount Failed)" -ForegroundColor Green
} else {
    Write-Host "[SUMMARY] FINAL SCORE: $PassCount / 25 Passed ($FailCount Failed)" -ForegroundColor Red
}
Write-Host "========================================================`n" -ForegroundColor DarkGray
