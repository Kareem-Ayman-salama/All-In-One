import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.currentUser());

  useEffect(() => {
    const clearExpiredSession = () => setUser(null);
    window.addEventListener("aio:session-expired", clearExpiredSession);
    return () => window.removeEventListener("aio:session-expired", clearExpiredSession);
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    async login(payload) {
      const nextUser = await authService.login(payload);
      if (nextUser?.mfaRequired) return nextUser;
      setUser(nextUser);
      return nextUser;
    },
    async createPersonalAccount(payload) {
      return authService.createPersonalAccount(payload);
    },
    async verifyRegistrationOtp(payload) {
      const nextUser = await authService.verifyRegistrationOtp(payload);
      setUser(nextUser);
      return nextUser;
    },
    async resendRegistrationOtp(payload) {
      return authService.resendRegistrationOtp(payload);
    },
    async requestPasswordReset(payload) {
      return authService.requestPasswordReset(payload);
    },
    async resetPassword(payload) {
      return authService.resetPassword(payload);
    },
    async updateProfile(payload) {
      const nextUser = await authService.updateProfile(payload);
      setUser(nextUser);
      return nextUser;
    },
    async changePassword(payload) {
      return authService.changePassword(payload);
    },
    async acceptInvitation(payload) {
      const nextUser = await authService.acceptInvitation(payload);
      setUser(nextUser);
      return nextUser;
    },
    logout() {
      authService.logout();
      setUser(null);
    }
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
