import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// gtag('config', ..., { send_page_view: false }) in index.html leaves page_view
// entirely to this component, so both the first load and every client-side
// route change (which the GA snippet alone can't see) send exactly one hit.
function Analytics() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;

    window.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
      page_title: document.title,
    });
  }, [location]);

  return null;
}

export default Analytics;
