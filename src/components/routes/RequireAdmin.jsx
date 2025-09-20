import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireAdmin({ children }) {
  const { user } = useAuth();
  const loc = useLocation();

  if (!user) return <Navigate to="/signin" state={{ from: loc }} replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;   // or some “403” page
  return children;
}
