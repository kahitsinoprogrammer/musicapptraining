import React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export default function AuthProvider({ children }) {
  // Teaching: load a previous login once so refreshing the browser keeps the session state.
  const storedToken = localStorage.getItem("token");
  const [token, setToken] = useState(storedToken);
  const [user, setUser] = useState(() => {
    if (storedToken) {
      try {
        return jwtDecode(storedToken);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    // Teaching: decode for display/routing only; the server verifies the JWT signature.
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (err) {
        logout();
      }
    }
  }, [token]);

  const login = (newToken) => {
    // Teaching: save the same token in persistent storage and React state.
    localStorage.setItem("token", newToken);
    setToken(newToken);
    const decoded = jwtDecode(newToken);
    setUser(decoded);
  };

  const logout = () => {
    // Teaching: clearing both values removes the session from the UI and the next request.
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // Teaching: this wrapper adds the bearer token and logs out after backend authorization failure.
  const secureFetch = async (url, options = {}) => {
    const isFormData = options.body instanceof FormData;

    const headers = {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    };

    if (!isFormData) {
      // Teaching: FormData needs the browser-generated multipart boundary, so do not set this header for it.
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok && [401, 403].includes(response.status)) {
      logout();
      throw new Error("Unauthorized. You have been logged out.");
    }

    return response;
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, secureFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
