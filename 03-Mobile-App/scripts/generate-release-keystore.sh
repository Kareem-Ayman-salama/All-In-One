#!/usr/bin/env bash
# ==============================================================================
# Script: generate-release-keystore.sh
# Purpose: Generate production Android signing keystore and output GitHub Secrets
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
KEYSTORE_PATH="${MOBILE_DIR}/android/upload-keystore.jks"
KEY_PROPS_PATH="${MOBILE_DIR}/android/key.properties"

echo "=========================================================="
echo "    AIN PLATFORM - ANDROID RELEASE KEYSTORE GENERATOR     "
echo "=========================================================="

if [ -f "${KEYSTORE_PATH}" ]; then
  echo "Warning: Keystore already exists at: ${KEYSTORE_PATH}"
  read -p "Do you want to overwrite it? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted without modifying keystore."
    exit 0
  fi
fi

echo "Enter details for the release signing keystore:"
read -p "Key Alias [default: upload]: " KEY_ALIAS
KEY_ALIAS=${KEY_ALIAS:-upload}

read -s -p "Store Password (min 8 chars): " STORE_PASS
echo
read -s -p "Key Password (press enter to use same as store password): " KEY_PASS
echo
KEY_PASS=${KEY_PASS:-$STORE_PASS}

read -p "Common Name (CN / Academy / Company Name) [AIN Platform]: " DNAME_CN
DNAME_CN=${DNAME_CN:-AIN Platform}

echo "Generating 4096-bit RSA keystore..."
keytool -genkeypair -v \
  -keystore "${KEYSTORE_PATH}" \
  -alias "${KEY_ALIAS}" \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000 \
  -storepass "${STORE_PASS}" \
  -keypass "${KEY_PASS}" \
  -dname "CN=${DNAME_CN}, OU=Mobile, O=AIN, L=Cairo, ST=Cairo, C=EG"

echo "Creating local android/key.properties..."
cat <<EOF > "${KEY_PROPS_PATH}"
keyAlias=${KEY_ALIAS}
keyPassword=${KEY_PASS}
storeFile=../upload-keystore.jks
storePassword=${STORE_PASS}
EOF

echo "✓ Keystore generated at: ${KEYSTORE_PATH}"
echo "✓ Local configuration saved to: ${KEY_PROPS_PATH}"

echo ""
echo "=========================================================="
echo "         GITHUB REPOSITORY SECRETS CONFIGURATION          "
echo "=========================================================="
echo "Add the following 4 secrets in GitHub (Settings -> Secrets -> Actions):"
echo ""
echo "1. ANDROID_KEY_ALIAS:"
echo "   ${KEY_ALIAS}"
echo ""
echo "2. ANDROID_KEY_PASSWORD:"
echo "   [hidden]"
echo ""
echo "3. ANDROID_STORE_PASSWORD:"
echo "   [hidden]"
echo ""
echo "4. ANDROID_KEYSTORE_BASE64:"
if command -v base64 >/dev/null 2>&1; then
  base64 -w 0 "${KEYSTORE_PATH}" > "${KEYSTORE_PATH}.base64"
  echo "   (Saved to ${KEYSTORE_PATH}.base64 — copy its content to GitHub Secret)"
fi
echo ""
echo "IMPORTANT: Never commit upload-keystore.jks or key.properties to Git!"
