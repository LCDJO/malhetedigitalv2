import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const SUBDOMAIN_ROUTES: Record<string, string> = {
  business: "/anunciante/auth",
  irmao: "/portal/auth",
  painel: "/auth",
};

export function SubdomainRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hostname = window.location.hostname;
    // Extract subdomain: e.g. "business.malhetedigital.com.br" → "business"
    const parts = hostname.split(".");
    if (parts.length >= 3) {
      const subdomain = parts[0].toLowerCase();
      const targetRoute = SUBDOMAIN_ROUTES[subdomain];
      if (targetRoute && location.pathname === "/") {
        navigate(targetRoute, { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  return null;
}
