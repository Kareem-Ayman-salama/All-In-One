const installationKey = "aio_installation_id";

export const DEVICE_POLICY = {
  version: "2026-07-24",
  maxActiveSessionsPerUser: 8,
  allowSameInstallationReplacement: true,
  allowedPlatforms: ["web", "android", "ios"],
  installationId: {
    source: "application_generated",
    storage: "secure_storage",
    minLength: 8,
    maxLength: 120
  }
};

export function getOrCreateInstallationId(storage = window.localStorage) {
  const existing = storage.getItem(installationKey);
  if (existing) return existing;

  const id = globalThis.crypto?.randomUUID?.() || `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  storage.setItem(installationKey, id);
  return id;
}

export function detectClientPlatform() {
  return "web";
}

export function buildDeviceLoginPayload() {
  return {
    installationId: getOrCreateInstallationId(),
    platform: detectClientPlatform(),
    appVersion: import.meta.env.VITE_APP_VERSION || "web",
    deviceName: navigator.userAgent.slice(0, 120)
  };
}

export function clearInstallationId(storage = window.localStorage) {
  storage.removeItem(installationKey);
}
