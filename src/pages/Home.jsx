import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/layout/Navbar";
import Hero from "../components/sections/Hero";
import FeaturedProfiles from "../components/sections/FeaturedProfiles";
import Benefits from "../components/sections/Benefits";
import HowItWorks from "../components/sections/HowItWorks";
import OurMission from "../components/sections/OurMission";
import Footer from "../components/sections/Footer";

function Home() {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Navbar />
      <Hero />
      <FeaturedProfiles />
      <Benefits />
      <HowItWorks />
      <OurMission />
      <Footer />
    </>
  );
}

export default Home;