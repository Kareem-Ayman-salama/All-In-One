# ==============================================================================
# Script: generate-release-keystore.ps1
# Purpose: Generate production Android signing keystore and output GitHub Secrets on Windows
# ==============================================================================
[CmdletBinding()]
param()

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$MobileDir = Resolve-Path "$ScriptDir\.."
$KeystorePath = "$MobileDir\android\upload-keystore.jks"
$KeyPropsPath = "$MobileDir\android\key.properties"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    AIN PLATFORM - ANDROID RELEASE KEYSTORE GENERATOR     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (Test-Path $KeystorePath) {
    Write-Warning "Keystore already exists at: $KeystorePath"
    $confirm = Read-Host "Do you want to overwrite it? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "Aborted without modifying keystore."
        exit 0
    }
}

$KeyAlias = Read-Host "Key Alias [default: upload]"
if ([string]::IsNullOrWhiteSpace($KeyAlias)) { $KeyAlias = "upload" }

$StorePass = Read-Host -AsSecureString "Store Password (min 8 chars)"
$StorePassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($StorePass))

$KeyPass = Read-Host -AsSecureString "Key Password (press enter to use same as store password)"
$KeyPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($KeyPass))
if ([string]::IsNullOrWhiteSpace($KeyPassPlain)) { $KeyPassPlain = $StorePassPlain }

$DnameCN = Read-Host "Common Name (CN / Company) [AIN Platform]"
if ([string]::IsNullOrWhiteSpace($DnameCN)) { $DnameCN = "AIN Platform" }

Write-Host "Generating 4096-bit RSA keystore..." -ForegroundColor Green
$dname = "CN=$DnameCN, OU=Mobile, O=AIN, L=Cairo, ST=Cairo, C=EG"

keytool -genkeypair -v `
  -keystore "$KeystorePath" `
  -alias "$KeyAlias" `
  -keyalg RSA `
  -keysize 4096 `
  -validity 10000 `
  -storepass "$StorePassPlain" `
  -keypass "$KeyPassPlain" `
  -dname "$dname"

Write-Host "Creating local android\key.properties..." -ForegroundColor Green
@"
keyAlias=$KeyAlias
keyPassword=$KeyPassPlain
storeFile=../upload-keystore.jks
storePassword=$StorePassPlain
"@ | Out-File -FilePath $KeyPropsPath -Encoding utf8

Write-Host "✓ Keystore generated at: $KeystorePath" -ForegroundColor Green
Write-Host "✓ Local configuration saved to: $KeyPropsPath" -ForegroundColor Green

# Base64 encode keystore for GitHub Secrets
$Bytes = [System.IO.File]::ReadAllBytes($KeystorePath)
$Base64 = [System.Convert]::ToBase64String($Bytes)
$Base64Path = "$KeystorePath.base64"
$Base64 | Out-File -FilePath $Base64Path -Encoding utf8

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         GITHUB REPOSITORY SECRETS CONFIGURATION          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Add the following 4 secrets in GitHub (Settings -> Secrets -> Actions):"
Write-Host ""
Write-Host "1. ANDROID_KEY_ALIAS:"
Write-Host "   $KeyAlias" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. ANDROID_KEY_PASSWORD:"
Write-Host "   [Your configured key password]" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. ANDROID_STORE_PASSWORD:"
Write-Host "   [Your configured store password]" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. ANDROID_KEYSTORE_BASE64:"
Write-Host "   (Saved to $Base64Path — copy its full content to GitHub Secret)" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Never commit upload-keystore.jks or key.properties to Git!" -ForegroundColor Red
