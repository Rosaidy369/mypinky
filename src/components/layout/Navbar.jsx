import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import HeartIcon from "../ui/HeartIcon";
import StarIcon from "../ui/StarIcon";
import GearIcon from "../ui/GearIcon";
import PersonIcon from "../ui/PersonIcon";
import "../../styles/Navbar.css";

function Navbar() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navRef = useRef(null);

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
  }, [isLoggedIn, menuOpen]);

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
  }, [isLoggedIn]);
  
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
            <Link to="/explore">Explorar</Link>
            <Link to="/mensajes">Mensajes</Link>
            <Link to="/matches">Matches</Link>

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

                  <Link to="/favoritos" onClick={() => setMenuOpen(false)}>
                    <span className="menu-icon-slot"><StarIcon size={15} /></span>
                    <span className="menu-item-label">Favoritos</span>
                  </Link>

                  <Link to="/quien-me-dio-like" onClick={() => setMenuOpen(false)}>
                    <span className="menu-icon-slot"><HeartIcon size={15} /></span>
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
            <Link to="/premium">Premium</Link>

            <Link to="/login" className="login">
              Iniciar sesión
            </Link>

            <Link to="/register" className="register">
              Crear cuenta
            </Link>
          </>

        )}

      </div>

    </nav>
  );
}

export default Navbar;