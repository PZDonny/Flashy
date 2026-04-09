import React from "react";
import { Navigate, Outlet} from "react-router-dom";
import { getAuth } from "../contexts/AuthContext";

function AuthRoute() {
  const { user } = getAuth();
  if (!user) {
    return <Navigate to="/login" />
  }
  return <Outlet />;
}

export default AuthRoute;
