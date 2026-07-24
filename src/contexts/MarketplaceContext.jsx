import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { marketplaceSeed } from "../data/marketplaceData";
import { marketplaceRepository } from "../services/marketplaceRepository";
import { shouldUseMockApi } from "../services/httpClient";
import { useAuth } from "./AuthContext";
import { useOrganization } from "./OrganizationContext";

const MarketplaceContext = createContext(null);
const EMPTY = {
  academies: [], instructors: [], categories: [], courses: [], batches: [],
  bookings: [], enrollments: [], subscriptions: [], roomMemberships: [],
  promotions: [], invitations: [], notifications: []
};
const STORAGE_KEY = "ain_marketplace_v1";

function createId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
}

function loadMockData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...marketplaceSeed, ...JSON.parse(saved) } : marketplaceSeed;
  } catch {
    return marketplaceSeed;
  }
}

export function MarketplaceProvider({ children }) {
  const { user } = useAuth();
  const { activeOrganization } = useOrganization();
  const mock = shouldUseMockApi();
  const [data, setData] = useState(mock ? loadMockData : EMPTY);
  const [loading, setLoading] = useState(!mock);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (mock) return null;
    setLoading(true);
    setError(null);
    try {
      const result = await marketplaceRepository.load({
        organizationId: activeOrganization?.id,
        platformAdmin: user?.role === "super-admin",
        authenticated: Boolean(user)
      });
      setData({ ...EMPTY, ...result });
      return result;
    } catch (nextError) {
      setError(nextError);
      return EMPTY;
    } finally {
      setLoading(false);
    }
  }, [activeOrganization?.id, mock, user]);

  useEffect(() => {
    if (!mock) reload();
  }, [mock, reload]);

  const commitMock = useCallback((next) => {
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const add = useCallback(async (key, prefix, payload) => {
    if (mock) {
      const entity = { id: createId(prefix), createdAt: new Date().toISOString(), ...payload };
      commitMock({ ...data, [key]: [entity, ...data[key]] });
      return entity;
    }
    const entity = await marketplaceRepository.create(
      activeOrganization?.id,
      key,
      payload,
      user?.role === "super-admin"
    );
    await reload();
    return entity;
  }, [activeOrganization?.id, commitMock, data, mock, reload, user?.role]);

  const update = useCallback(async (key, id, changes) => {
    if (mock) {
      commitMock({ ...data, [key]: data[key].map((item) => item.id === id ? { ...item, ...changes } : item) });
      return { ok: true };
    }
    const result = await marketplaceRepository.update(
      activeOrganization?.id,
      key,
      id,
      changes,
      user?.role === "super-admin"
    );
    await reload();
    return result;
  }, [activeOrganization?.id, commitMock, data, mock, reload, user?.role]);

  const createBooking = useCallback(async (payload) => {
    if (mock) {
      const duplicate = data.bookings.find((item) => item.courseId === payload.courseId && item.email === payload.email && !["cancelled", "rejected", "expired"].includes(item.status));
      if (duplicate) return { ok: false, reason: "duplicate", booking: duplicate };
      const batch = data.batches.find((item) => item.id === payload.batchId);
      if (!batch || batch.status !== "open" || batch.confirmedSeats + batch.reservedSeats >= batch.capacity) return { ok: false, reason: "capacity_full" };
      const booking = { id: createId("booking"), status: "pending_confirmation", paymentStatus: "unpaid", createdAt: new Date().toISOString(), ...payload };
      commitMock({ ...data, bookings: [booking, ...data.bookings] });
      return { ok: true, booking };
    }
    try {
      const result = await marketplaceRepository.reserve(payload);
      await reload();
      return { ok: true, booking: result.booking, next: result.next };
    } catch (nextError) {
      return { ok: false, reason: nextError.code?.toLowerCase(), error: nextError };
    }
  }, [commitMock, data, mock, reload]);

  const bookingAction = useCallback(async (id, action, payload = {}) => {
    const booking = data.bookings.find((item) => item.id === id);
    if (!booking) return { ok: false, reason: "not_found" };
    if (mock) {
      commitMock({ ...data, bookings: data.bookings.map((item) => item.id === id ? { ...item, status: action === "confirm" ? "confirmed" : `${action}ed` } : item) });
      return { ok: true };
    }
    try {
      await marketplaceRepository.bookingAction(booking.organizationId, id, action, payload);
      await reload();
      return { ok: true };
    } catch (nextError) {
      return { ok: false, reason: nextError.code?.toLowerCase(), error: nextError };
    }
  }, [commitMock, data, mock, reload]);

  const value = useMemo(() => ({
    ...data,
    loading,
    error,
    reload,
    add,
    update,
    createBooking,
    confirmBooking: (id, payload) => bookingAction(id, "confirm", payload),
    rejectBooking: (id, payload) => bookingAction(id, "reject", payload),
    cancelBooking: (id, payload) => bookingAction(id, "cancel", payload)
  }), [add, bookingAction, createBooking, data, error, loading, reload, update]);

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export function useMarketplace() {
  const value = useContext(MarketplaceContext);
  if (!value) throw new Error("useMarketplace must be used inside MarketplaceProvider");
  return value;
}
