import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SuspendedScreen from "./SuspendedScreen";

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading, suspension, suspensionLoading } = useAuth();
  const location = useLocation();

  if (loading || (isLoggedIn && suspensionLoading)) {
    return <div style={{ padding: "140px", textAlign: "center" }}>Cargando...</div>;
  }

  if (!isLoggedIn) {
    sessionStorage.setItem("mypinky_redirect_after_login", location.pathname);
    return <Navigate to="/login" replace />;
  }

  if (suspension) {
    return <SuspendedScreen suspension={suspension} />;
  }

  return children;
}

export default ProtectedRoute;