import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { useSwipeFilters } from "../../hooks/useSwipeFilters";
import { supabase } from "../../lib/supabaseClient";
import HeartIcon from "../ui/HeartIcon";
import StarIcon from "../ui/StarIcon";
import GearIcon from "../ui/GearIcon";
import PersonIcon from "../ui/PersonIcon";
import SearchIcon from "../ui/SearchIcon";
import MessageIcon from "../ui/MessageIcon";
import FilterIcon from "../ui/FilterIcon";
import "../../styles/Navbar.css";
import "../../styles/Explore.css";

const GENDER_FILTER_OPTIONS = ["Todos", "Mujer", "Hombre"];

function Navbar() {
  const { isLoggedIn, logout } = useAuth();
  const { badges } = useNotifications();
  const { filters, updateFilter, showFilters, setShowFilters } = useSwipeFilters();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navRef = useRef(null);
  const filterRef = useRef(null);

  // The navbar can wrap into extra rows on narrow screens, so its real
  // height varies. Measure it and expose it as a CSS var instead of
  // hardcoding a fixed top-offset on every page (which would let a
  // taller navbar cover page content).
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const updateNavSpace = () => {
      const rect = nav.getBoundingClientRect();
      document.documentElement.style.setProperty("--navbar-bottom", `${Math.ceil(rect.bottom)}px`);
    };

    updateNavSpace();

    const observer = new ResizeObserver(updateNavSpace);
    observer.observe(nav);
    window.addEventListener("resize", updateNavSpace);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateNavSpace);
    };
  }, [isLoggedIn, menuOpen, showFilters]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    function handleClickOutsideFilters(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    }

    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutsideFilters);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideFilters);
    };
  }, [showFilters, setShowFilters]);

  const [userPhoto, setUserPhoto] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadPhoto = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data } = await supabase
        .from("profiles")
        .select("photos")
        .eq("id", authUser.id)
        .single();

      if (data?.photos?.[0]) {
        setUserPhoto(data.photos[0]);
      }
    };

    loadPhoto();
    // Refetch on every route change too, not just on login — the navbar
    // never remounts between pages, so without this it stays stuck on
    // whatever photos existed the moment the session started (e.g. still
    // empty right after Google sign-in, before Onboarding adds any).
  }, [isLoggedIn, location.pathname]);
  
  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar" ref={navRef}>

      <Link to={isLoggedIn ? "/swipe" : "/"} className="logo">
        <span className="logo-heart"><HeartIcon size={26} /></span>
        <span className="logo-text">
          <span className="my">My</span>
          <span className="pinky">Pinky</span>
        </span>
      </Link>

      <div className="menu">

        {isLoggedIn ? (

          <>
            <Link to="/explore" className="nav-link">
              <SearchIcon size={18} className="nav-link-icon" />
              <span className="nav-link-label">Explorar</span>
            </Link>
            <Link to="/mensajes" className="nav-link">
              <span className="nav-icon-badge-wrap">
                <MessageIcon size={18} className="nav-link-icon" />
                {badges?.messages && <span className="notif-dot"></span>}
              </span>
              <span className="nav-link-label">Mensajes</span>
            </Link>
            <Link to="/matches" className="nav-link matches-desktop-link">
              <span className="nav-icon-badge-wrap">
                <HeartIcon size={17} className="nav-link-icon" />
                {badges?.matches && <span className="notif-dot"></span>}
              </span>
              <span className="nav-link-label">Matches</span>
            </Link>

            {location.pathname === "/swipe" && (
              <div className="navbar-filter-wrapper" ref={filterRef}>

                <button
                  type="button"
                  className={`nav-link navbar-filter-btn ${showFilters ? "active" : ""}`}
                  onClick={() => setShowFilters((prev) => !prev)}
                >
                  <FilterIcon size={18} className="nav-link-icon" />
                  <span className="nav-link-label">Filtros</span>
                </button>

                {showFilters && (
                  <div className="navbar-filter-dropdown">

                    <div className="filter-gender-pills">
                      {GENDER_FILTER_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`filter-gender-pill ${filters.gender === option ? "selected" : ""}`}
                          onClick={() => updateFilter("gender", option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>

                    <div className="distance-filter">
                      <span className="distance-label">
                        {filters.ageMin} - {filters.ageMax} años
                      </span>
                      <input
                        type="range"
                        min="18"
                        max="90"
                        value={filters.ageMin}
                        onChange={(e) => updateFilter("ageMin", Math.min(Number(e.target.value), filters.ageMax))}
                        className="distance-slider"
                      />
                      <input
                        type="range"
                        min="18"
                        max="90"
                        value={filters.ageMax}
                        onChange={(e) => updateFilter("ageMax", Math.max(Number(e.target.value), filters.ageMin))}
                        className="distance-slider"
                      />
                    </div>

                    <div className="distance-filter">
                      <span className="distance-label">📍 Hasta {filters.maxDistance} km</span>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={filters.maxDistance}
                        onChange={(e) => updateFilter("maxDistance", Number(e.target.value))}
                        className="distance-slider"
                      />
                    </div>

                  </div>
                )}

              </div>
            )}

            <div className="hamburger-wrapper" ref={menuRef}>

              <button
                className="hamburger-btn"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                ☰
              </button>

              {menuOpen && (
                <div className="hamburger-dropdown">

                  <Link to="/mi-perfil" onClick={() => setMenuOpen(false)} className="profile-menu-link">
                    <span className="menu-icon-slot">
                      {userPhoto ? (
                        <img src={userPhoto} alt="Mi perfil" className="menu-icon-photo" />
                      ) : (
                        <PersonIcon size={15} />
                      )}
                    </span>
                    <span className="menu-item-label">Mi Perfil</span>
                  </Link>

                  <Link to="/matches" onClick={() => setMenuOpen(false)} className="matches-mobile-link">
                    <span className="menu-icon-badge-wrap">
                      <span className="menu-icon-slot"><HeartIcon size={15} /></span>
                      {badges?.matches && <span className="notif-dot menu-notif-dot"></span>}
                    </span>
                    <span className="menu-item-label">Matches</span>
                  </Link>

                  <Link to="/favoritos" onClick={() => setMenuOpen(false)}>
                    <span className="menu-icon-slot"><StarIcon size={15} /></span>
                    <span className="menu-item-label">Favoritos</span>
                  </Link>

                  <Link to="/quien-me-dio-like" onClick={() => setMenuOpen(false)}>
                    <span className="menu-icon-badge-wrap">
                      <span className="menu-icon-slot"><HeartIcon size={15} /></span>
                      {badges?.likes && <span className="notif-dot menu-notif-dot"></span>}
                    </span>
                    <span className="menu-item-label">A quién le gustas</span>
                  </Link>

                  <Link to="/configuracion" onClick={() => setMenuOpen(false)}>
                    <span className="menu-icon-slot"><GearIcon size={15} /></span>
                    <span className="menu-item-label">Configuración</span>
                  </Link>

                  <button className="dropdown-logout" onClick={handleLogout}>
                    Cerrar sesión
                  </button>

                </div>
              )}

            </div>
          </>

        ) : (

          <>
            <Link to="/premium" className="nav-link premium-link">
              <StarIcon size={18} className="nav-link-icon" />
              <span className="nav-link-label">Premium</span>
            </Link>

            <Link to="/login" className="login">
              <span className="label-full">Iniciar sesión</span>
              <span className="label-short">Entrar</span>
            </Link>

            <Link to="/register" className="register">
              <span className="label-full">Crear cuenta</span>
              <span className="label-short">Registro</span>
            </Link>
          </>

        )}

      </div>

    </nav>
  );
}

export default Navbar;