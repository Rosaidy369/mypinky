import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Analytics from "../Analytics";
import CookieConsent from "../CookieConsent";

function AppLayout() {
  return (
    <>
      <Analytics />
      <Navbar />
      <Outlet />
      <CookieConsent />
    </>
  );
}

export default AppLayout;