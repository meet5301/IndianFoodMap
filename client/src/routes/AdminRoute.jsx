import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const nextPath = `${location.pathname}${location.search || ""}`;
    return <Navigate to={`/auth?next=${encodeURIComponent(nextPath)}`} replace state={{ from: location }} />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default AdminRoute;
