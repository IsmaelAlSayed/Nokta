import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/LoadingSpinner.css";

const roleToDashboard = {
  admin: "/admin-dashboard",
  manager: "/manager-dashboard",
  customer: "/home",
};

const ProtectedRoute = ({ role, children }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;

  if (userRole !== role) {
    return <Navigate to={roleToDashboard[userRole] || "/login"} replace />;
  }

  return children;
};

export default ProtectedRoute;
