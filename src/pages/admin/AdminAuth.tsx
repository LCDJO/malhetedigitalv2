import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * AdminAuth — redirects to unified login at /auth.
 * SuperAdmin role detection and redirect is handled there.
 */
export default function AdminAuth() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/auth", { replace: true });
  }, [navigate]);
  return null;
}
