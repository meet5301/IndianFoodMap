import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("ifm_token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("ifm_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const syncUser = async () => {
      if (!token) {
        return;
      }

      try {
        const data = await api.me();
        setUser(data.user);
        localStorage.setItem("ifm_user", JSON.stringify(data.user));
      } catch (error) {
        // Only clear session when token is actually invalid/expired.
        if (error?.status === 401 || error?.status === 403) {
          localStorage.removeItem("ifm_token");
          localStorage.removeItem("ifm_user");
          setToken("");
          setUser(null);
        }
      }
    };

    syncUser();
  }, [token]);

  const onAuthSuccess = (payload) => {
    localStorage.setItem("ifm_token", payload.token);
    localStorage.setItem("ifm_user", JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const payload = await api.login(credentials);
      onAuthSuccess(payload);
      return payload;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const result = await api.register(payload);
      onAuthSuccess(result);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("ifm_token");
    localStorage.removeItem("ifm_user");
    localStorage.setItem("ifm_access_mode", "customer");
    setToken("");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      loading,
      login,
      register,
      logout
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
