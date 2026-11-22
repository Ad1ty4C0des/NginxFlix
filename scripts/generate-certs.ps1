$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sslDir = Join-Path (Split-Path -Parent $scriptDir) "nginx\ssl"

if (-not (Test-Path $sslDir)) {
    New-Item -ItemType Directory -Path $sslDir -Force | Out-Null
}

# Locate openssl
$opensslCmd = Get-Command openssl -ErrorAction SilentlyContinue
if (-not $opensslCmd) {
    $possiblePaths = @(
        "C:\Program Files\Git\usr\bin\openssl.exe",
        "C:\Program Files (x86)\Git\usr\bin\openssl.exe",
        "C:\Git\usr\bin\openssl.exe"
    )
    foreach ($p in $possiblePaths) {
        if (Test-Path $p) {
            $opensslExe = $p
            break
        }
    }
} else {
    $opensslExe = $opensslCmd.Source
}

if (-not $opensslExe) {
    Write-Error "OpenSSL not found. Please install Git or OpenSSL for Windows."
    exit 1
}

Write-Host "🔐 Using OpenSSL at: $opensslExe"
Write-Host "📁 Generating SSL Certificates in: $sslDir"

Push-Location $sslDir
try {
    # 1. CA Key
    Write-Host "1️⃣ Generating CA private key (ca.key)..."
    & $opensslExe genrsa -out ca.key 2048

    # 2. CA Cert
    Write-Host "2️⃣ Generating CA certificate (ca.crt)..."
    & $opensslExe req -x509 -new -nodes -key ca.key -sha256 -days 365 -out ca.crt `
        -subj "/C=US/ST=State/L=City/O=NginxFlix/CN=NginxFlix CA"

    # 3. Server Key
    Write-Host "3️⃣ Generating Server private key (server.key)..."
    & $opensslExe genrsa -out server.key 2048

    # 4. Server CSR
    Write-Host "4️⃣ Generating CSR (server.csr)..."
    & $opensslExe req -new -key server.key -out server.csr `
        -subj "/C=US/ST=State/L=City/O=NginxFlix/CN=*.nginxflix.local"

    # 5. SAN config
    $extContent = @"
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = *.nginxflix.local
DNS.2 = nginxflix.local
DNS.3 = localhost
IP.1 = 127.0.0.1
"@
    Set-Content -Path cert.ext -Value $extContent

    # 6. Sign Server Cert
    Write-Host "5️⃣ Signing server certificate with CA (server.crt)..."
    & $opensslExe x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial `
        -out server.crt -days 365 -sha256 -extfile cert.ext

    Remove-Item -Force -ErrorAction SilentlyContinue server.csr, cert.ext, ca.srl

    Write-Host "✅ SSL certificates generated successfully in $sslDir"
    Get-ChildItem -Path .
}
finally {
    Pop-Location
}
