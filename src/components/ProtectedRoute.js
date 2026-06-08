import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleToDashboard = {
  admin: "/admin-dashboard",
  manager: "/manager-dashboard",
  customer: "/customer-dashboard",
};

const ProtectedRoute = ({ role, children }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while role is being fetched
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== role) {
    // Redirect the user to their appropriate dashboard if they have a different role
    const redirectPath = roleToDashboard[userRole] || "/login";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
