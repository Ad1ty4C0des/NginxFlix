# PowerShell Script to automatically configure C:\Windows\System32\drivers\etc\hosts
$hostsPath = "C:\Windows\System32\drivers\etc\hosts"

$entries = @"

# --- NginxFlix Local Domain Mappings ---
127.0.0.1   www.nginxflix.local
127.0.0.1   app.nginxflix.local
127.0.0.1   api.nginxflix.local
127.0.0.1   cdn.nginxflix.local
127.0.0.1   ws.nginxflix.local
127.0.0.1   admin.nginxflix.local
"@

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️ This script requires Administrator rights to update the hosts file." -ForegroundColor Yellow
    Write-Host "Relaunching elevated PowerShell prompt..." -ForegroundColor Cyan
    Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

$currentContent = Get-Content $hostsPath -Raw -ErrorAction Stop

if ($currentContent -match "www\.nginxflix\.local") {
    Write-Host "✅ NginxFlix host entries are already present in $hostsPath" -ForegroundColor Green
} else {
    Write-Host "Writing NginxFlix host entries to $hostsPath..." -ForegroundColor Cyan
    Add-Content -Path $hostsPath -Value $entries -ErrorAction Stop
    Write-Host "✅ Successfully added NginxFlix entries to hosts file!" -ForegroundColor Green
}

Write-Host "`nTesting resolution:" -ForegroundColor Cyan
Resolve-DnsName -Name "www.nginxflix.local" -ErrorAction SilentlyContinue | Format-Table Name, IPAddress
