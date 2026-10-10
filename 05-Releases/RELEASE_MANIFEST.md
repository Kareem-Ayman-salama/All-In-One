# AIN Platform Release Manifest & Artifact Checksums

This manifest documents all official production and development build artifacts for the AIN Platform. In compliance with repository hygiene and version-control best practices, all compiled binary assets (`.apk`, `.aab`, `.zip`) are excluded from Git history via `.gitignore` and distributed via secure CDN / GitHub Releases / S3 object storage.

---

## 1. Android Mobile Binaries (Release v1.0.0)

| Artifact Name | Target / Flavor | Architecture | Exact Size (Bytes) | SHA-256 Checksum |
| :--- | :--- | :--- | :--- | :--- |
| `AIN_Platform_v1.0.apk` | Production (Universal) | Multi-ABI (Fat APK) | 64,597,984 B | `C7EBBE12BA936B8246FA6EC3FFAF44F78D2DEA2FD11B59F4805DCC1AC6DB479F` |
| `app-production-release.apk` | Production (Universal) | Multi-ABI (Fat APK) | 64,597,984 B | `C7EBBE12BA936B8246FA6EC3FFAF44F78D2DEA2FD11B59F4805DCC1AC6DB479F` |
| `app-production-arm64-v8a-release.apk` | Production (Split ABI) | ARM64-v8a | 23,654,110 B | `48E2F024B99B185612F11BAAA2C80206CA771F1F62C3E0059C07D94D6FF1744C` |
| `app-development-debug.apk` | Development Debug | Universal (Debug ABI) | 82,604,132 B | `615D2E896648404DB77AC41DA0ECB09D009AF0B5DA3E4DC12F72918FB57D65ED` |
| `app-development-arm64-v8a-release.apk` | Development Release | ARM64-v8a | 24,347,885 B | `E34115630F2FFDD917559696BFA04200860C52C1B3490BBF7DBA93402AEC334A` |
| `app-arm64-v8a-development-release.apk` | Development Release (Alias) | ARM64-v8a | 24,347,885 B | `E34115630F2FFDD917559696BFA04200860C52C1B3490BBF7DBA93402AEC334A` |
| `app-development-armeabi-v7a-release.apk` | Development Release | ARMv7 | 22,101,595 B | `D4C97F08B85670060B9A42146DCB0946E5F8998ECCCDFF7AB2A5D5256EC4C97D` |
| `app-armeabi-v7a-development-release.apk` | Development Release (Alias) | ARMv7 | 22,101,595 B | `D4C97F08B85670060B9A42146DCB0946E5F8998ECCCDFF7AB2A5D5256EC4C97D` |
| `app-development-x86_64-release.apk` | Development Release | x86_64 | 25,829,550 B | `AE04F92BC057621C9359B104B6977A64A9448934F668520F3AFE6294313F67A9` |
| `app-x86_64-development-release.apk` | Development Release (Alias) | x86_64 | 25,829,550 B | `AE04F92BC057621C9359B104B6977A64A9448934F668520F3AFE6294313F67A9` |

---

## 2. Web Frontend Distribution Archives

| Package Name | Type | Target Environment | Exact Size (Bytes) | SHA-256 Checksum |
| :--- | :--- | :--- | :--- | :--- |
| `AIOFRONT_AIO_PRODUCTION_FRONTEND_FINAL.zip` | Standalone ZIP Bundle | Production Web CDN | 10,222,887 B | `2FF139A1607B3EDC33A49D05E5B25545A73123B6DDDE301EC3B1C15AF6089E8B` |

---

## 3. Verification Protocol

To verify the integrity of any downloaded binary artifact on Windows (PowerShell):
```powershell
Get-FileHash -Path .\app-production-arm64-v8a-release.apk -Algorithm SHA256
```

On Linux / macOS (bash):
```bash
sha256sum app-production-arm64-v8a-release.apk
```
Confirm the resulting output hash matches the checksum recorded in the table above before signing or distributing to academies.
