# auth-smoke-test.ps1
# Deterministic DeafAUTH smoke test (no secrets)

$ErrorActionPreference = "Stop"

$BASE_URL = $env:DEAFAUTH_URL
if (-not $BASE_URL) { $BASE_URL = "http://localhost:3001" }

# Deterministic test identity (unique each run)
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$email = "smoketest+$stamp@mbtq.dev"
$password = "TempPass!123456"
$name = "Smoke Test"

function Assert-Ok($label, $resp) {
  if (-not $resp) { throw "FAIL: $label (no response)" }
  Write-Host "PASS: $label" -ForegroundColor Green
}

Write-Host "== DeafAUTH Smoke Test ==" -ForegroundColor Cyan
Write-Host "BASE_URL: $BASE_URL"
Write-Host "EMAIL: $email"

# 1) Health
try {
  $health = Invoke-RestMethod -Method GET -Uri "$BASE_URL/health"
  Assert-Ok "GET /health" $health
} catch {
  throw "FAIL: GET /health - $($_.Exception.Message)"
}

# 2) Register
$registerBody = @{
  email    = $email
  password = $password
  name     = $name
} | ConvertTo-Json

try {
  $register = Invoke-RestMethod -Method POST -Uri "$BASE_URL/auth/register" -ContentType "application/json" -Body $registerBody
  Assert-Ok "POST /auth/register" $register
} catch {
  Write-Host "WARN: POST /auth/register failed (may already exist or endpoint differs): $($_.Exception.Message)" -ForegroundColor Yellow
}

# 3) Login
$loginBody = @{
  email    = $email
  password = $password
} | ConvertTo-Json

try {
  $login = Invoke-RestMethod -Method POST -Uri "$BASE_URL/auth/login" -ContentType "application/json" -Body $loginBody
  Assert-Ok "POST /auth/login" $login
} catch {
  throw "FAIL: POST /auth/login - $($_.Exception.Message)"
}

# Extract token from common shapes
$token = $null
if ($login.access_token) { $token = $login.access_token }
elseif ($login.token) { $token = $login.token }
elseif ($login.data -and $login.data.access_token) { $token = $login.data.access_token }

if (-not $token) {
  throw "FAIL: Could not find token in login response. Expected access_token/token."
}

Write-Host "Token acquired (length=$($token.Length))" -ForegroundColor Cyan

# 4) Me
try {
  $headers = @{ Authorization = "Bearer $token" }
  $me = Invoke-RestMethod -Method GET -Uri "$BASE_URL/auth/me" -Headers $headers
  Assert-Ok "GET /auth/me (Bearer token)" $me
} catch {
  throw "FAIL: GET /auth/me - $($_.Exception.Message)"
}

Write-Host "== RESULT: DeafAUTH smoke test PASSED ==" -ForegroundColor Green
