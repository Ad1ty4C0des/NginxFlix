#!/usr/bin/env bash
set -e

# Directory where certs should go
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="$(cd "${SCRIPT_DIR}/../nginx/ssl" && pwd)"

echo "🔐 Generating SSL Certificates in ${SSL_DIR}..."
mkdir -p "${SSL_DIR}"
cd "${SSL_DIR}"

# 1. Generate CA private key
echo "1️⃣ Generating CA private key (ca.key)..."
openssl genrsa -out ca.key 2048

# 2. Generate CA root certificate
echo "2️⃣ Generating CA certificate (ca.crt)..."
openssl req -x509 -new -nodes -key ca.key -sha256 -days 365 -out ca.crt \
  -subj "/C=US/ST=State/L=City/O=NginxFlix/CN=NginxFlix CA"

# 3. Generate server private key
echo "3️⃣ Generating Server private key (server.key)..."
openssl genrsa -out server.key 2048

# 4. Generate Certificate Signing Request (CSR)
echo "4️⃣ Generating CSR (server.csr)..."
openssl req -new -key server.key -out server.csr \
  -subj "/C=US/ST=State/L=City/O=NginxFlix/CN=*.nginxflix.local"

# 5. Create SAN configuration for wildcard certificate
cat > cert.ext << 'EOF'
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = *.nginxflix.local
DNS.2 = nginxflix.local
DNS.3 = localhost
IP.1 = 127.0.0.1
EOF

# 6. Sign server certificate with CA
echo "5️⃣ Signing server certificate with CA (server.crt)..."
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt -days 365 -sha256 -extfile cert.ext

# Clean up temporary files
rm -f server.csr cert.ext ca.srl

echo "✅ SSL certificates successfully generated:"
ls -la server.crt server.key ca.crt ca.key
