import React, { createContext, useState, useEffect, useContext } from "react";
import { api } from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const data = await api.get("/me");
        setUser(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };
    verifyUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
