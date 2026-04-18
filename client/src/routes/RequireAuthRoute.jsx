import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RequireAuthRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const nextPath = `${location.pathname}${location.search || ""}`;
    return <Navigate to={`/auth?next=${encodeURIComponent(nextPath)}`} replace state={{ from: location }} />;
  }

  return children;
};

export default RequireAuthRoute;