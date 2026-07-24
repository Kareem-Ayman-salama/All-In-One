import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { organizationRepository } from "../services/organizationRepository";

const OrganizationContext = createContext(null);

function selectionKey(user) {
  return `ain-active-organization:${user?.id || user?.email || "anonymous"}`;
}

export function OrganizationProvider({ children }) {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState(null);
  const [loading, setLoading] = useState(Boolean(user && user.role !== "super-admin"));

  useEffect(() => {
    let current = true;
    if (!user || user.role === "super-admin") {
      setMemberships([]);
      setActiveOrganizationId(null);
      setLoading(false);
      return () => { current = false; };
    }
    setLoading(true);
    organizationRepository.listMemberships(user).then((items) => {
      if (!current) return;
      setMemberships(items);
      const saved = window.localStorage.getItem(selectionKey(user));
      const validSaved = items.some((item) => item.organizationId === saved);
      setActiveOrganizationId(validSaved ? saved : items.length === 1 ? items[0].organizationId : null);
      setLoading(false);
    });
    return () => { current = false; };
  }, [user]);

  const activeMembership = memberships.find((item) => item.organizationId === activeOrganizationId) || null;
  const activeOrganization = activeMembership?.organization || null;

  const selectOrganization = useCallback((organizationId) => {
    const membership = memberships.find((item) => item.organizationId === organizationId && item.status === "active");
    if (!membership) return null;
    window.localStorage.setItem(selectionKey(user), organizationId);
    setActiveOrganizationId(organizationId);
    return membership;
  }, [memberships, user]);

  const value = useMemo(() => ({
    loading,
    memberships,
    activeMembership,
    activeOrganization,
    selectOrganization,
    clearOrganization() {
      window.localStorage.removeItem(selectionKey(user));
      setActiveOrganizationId(null);
    },
    can(permission) {
      if (user?.role === "super-admin") return true;
      return Boolean(activeMembership?.permissions.includes(permission));
    },
    hasOrganizationRole(role) {
      return activeMembership?.role === role;
    },
    hasPlatformRole(role) {
      return user?.role === role;
    },
    isModuleEnabled(module) {
      return Boolean(activeMembership?.modules.includes(module));
    },
    isFeatureAvailable(feature) {
      return Boolean(activeMembership?.modules.includes(feature));
    },
    getPlanLimit(limit) {
      return activeMembership?.limits?.[limit] ?? null;
    }
  }), [activeMembership, activeOrganization, loading, memberships, selectOrganization, user]);

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const value = useContext(OrganizationContext);
  if (!value) throw new Error("useOrganization must be used inside OrganizationProvider");
  return value;
}
