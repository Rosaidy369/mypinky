import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/layout/Navbar";
import Hero from "../components/sections/Hero";
import FeaturedProfiles from "../components/sections/FeaturedProfiles";
import Benefits from "../components/sections/Benefits";
import Testimonials from "../components/sections/Testimonials";
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
      <Testimonials />
      <Footer />
    </>
  );
}

export default Home;