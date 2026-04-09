import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function ProtectedAuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return user ? <Outlet /> : <Navigate to="/" replace/>;
}

export default ProtectedAuthRoute;
