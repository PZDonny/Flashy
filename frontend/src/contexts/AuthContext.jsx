import React, { createContext, useState, useEffect, useContext } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  api.logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    <Navigate to='/' />
  };

  useEffect(() => {
    const verifyUser = async () => {
      try {
        if (!api.hasToken()) {
          api.logout();
          return;
        }

        const data = await api.get("/me");
        setUser(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        api.logout();
      } finally {
        setLoading(false);
      }
    };
    verifyUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
