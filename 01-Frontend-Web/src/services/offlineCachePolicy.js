export const OFFLINE_CACHE_POLICY = {
  version: "2026-07-24",
  defaultWritePolicy: "server_confirmation_required",
  datasets: {
    "auth.profile": { ttlSeconds: 900, storage: "secure_or_encrypted", offlineReadable: true, purgeOnLogout: true },
    "workspaces.list": { ttlSeconds: 900, storage: "encrypted_database", offlineReadable: true, purgeOnLogout: true },
    "marketplace.courses": { ttlSeconds: 1800, storage: "database", offlineReadable: true, purgeOnLogout: false },
    "marketplace.course_detail": { ttlSeconds: 1800, storage: "database", offlineReadable: true, purgeOnLogout: false },
    "marketplace.academies": { ttlSeconds: 1800, storage: "database", offlineReadable: true, purgeOnLogout: false },
    "student.enrollments": { ttlSeconds: 600, storage: "encrypted_database", offlineReadable: true, purgeOnLogout: true },
    "organization.announcements": { ttlSeconds: 600, storage: "encrypted_database", offlineReadable: true, purgeOnLogout: true },
    "organization.schedule": { ttlSeconds: 600, storage: "encrypted_database", offlineReadable: true, purgeOnLogout: true },
    "notifications.inbox": { ttlSeconds: 300, storage: "encrypted_database", offlineReadable: true, purgeOnLogout: true, optimisticActions: ["mark_read"] },
    "content.metadata": { ttlSeconds: 300, storage: "encrypted_database", offlineReadable: true, purgeOnLogout: true, neverCacheFields: ["viewSession.url", "fileAsset.path"] },
    "content.view_session": { ttlSeconds: 0, storage: "memory_only", offlineReadable: false, purgeOnLogout: true, neverPersist: true }
  },
  writeOperations: {
    "bookings.reserve": { offlineBehavior: "block_with_retry", requiresServerConfirmation: true },
    "bookings.confirm": { offlineBehavior: "block_with_retry", requiresServerConfirmation: true },
    "content.upload": { offlineBehavior: "block_with_retry", requiresServerConfirmation: true },
    "notifications.mark_read": { offlineBehavior: "optimistic_reversible", requiresServerConfirmation: false }
  }
};

export function canReadOffline(datasetKey, policy = OFFLINE_CACHE_POLICY) {
  return Boolean(policy.datasets?.[datasetKey]?.offlineReadable);
}

export function shouldPersistDataset(datasetKey, policy = OFFLINE_CACHE_POLICY) {
  const rule = policy.datasets?.[datasetKey];
  return Boolean(rule && !rule.neverPersist && rule.storage !== "memory_only" && rule.ttlSeconds > 0);
}

export function requiresServerConfirmation(operationKey, policy = OFFLINE_CACHE_POLICY) {
  const rule = policy.writeOperations?.[operationKey];
  return rule ? Boolean(rule.requiresServerConfirmation) : policy.defaultWritePolicy === "server_confirmation_required";
}

export function cacheExpiresAt(datasetKey, fetchedAt = new Date(), policy = OFFLINE_CACHE_POLICY) {
  const ttlSeconds = Number(policy.datasets?.[datasetKey]?.ttlSeconds || 0);
  if (ttlSeconds <= 0) return null;
  return new Date(new Date(fetchedAt).getTime() + ttlSeconds * 1000).toISOString();
}
