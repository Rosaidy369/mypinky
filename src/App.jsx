import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { NotificationsProvider } from "./hooks/useNotifications";
import { SwipeFiltersProvider } from "./hooks/useSwipeFilters";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import Home from "./pages/Home";

// El resto de las paginas se cargan solo cuando se visitan -- Home es la
// unica que de verdad hace falta en el bundle inicial (landing publica),
// el resto son pantallas detras de login o secundarias.
const Explore = lazy(() => import("./pages/Explore"));
const Swipe = lazy(() => import("./pages/Swipe"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EmailConfirmed = lazy(() => import("./pages/EmailConfirmed"));
const Profile = lazy(() => import("./pages/Profile"));
const Premium = lazy(() => import("./pages/Premium"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Matches = lazy(() => import("./pages/Matches"));
const Chats = lazy(() => import("./pages/Chats"));
const ChatRoom = lazy(() => import("./pages/ChatRoom"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const Checkout = lazy(() => import("./pages/Checkout"));
const VerifyAccount = lazy(() => import("./pages/VerifyAccount"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Support = lazy(() => import("./pages/Support"));
const Contact = lazy(() => import("./pages/Contact"));
const SpecialTouchCheckout = lazy(() => import("./pages/SpecialTouchCheckout"));
const WhoLikedMe = lazy(() => import("./pages/WhoLikedMe"));

// Mismo patron ya usado en el "loading" de Profile.jsx/MyProfile.jsx/etc,
// para que el parpadeo mientras carga el chunk de la ruta se vea igual
// que cualquier otro estado de carga de la app.
function RouteFallback() {
  return <div style={{ padding: "140px", textAlign: "center" }}>Cargando...</div>;
}

function App() {
  return (
    <AuthProvider>
    <NotificationsProvider>
    <SwipeFiltersProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
        <Routes>

          <Route element={<AppLayout />}>

            <Route path="/" element={<Home />} />

            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />

            <Route path="/olvide-contrasena" element={<ForgotPassword />} />

            <Route path="/restablecer-contrasena" element={<ResetPassword />} />

            <Route path="/correo-verificado" element={<EmailConfirmed />} />

            <Route path="/premium" element={<Premium />} />

            <Route path="/privacidad" element={<Privacy />} />
            <Route path="/terminos" element={<Terms />} />
            <Route path="/soporte" element={<Support />} />
            <Route path="/contacto" element={<Contact />} />

            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={<Navigate to="/swipe" replace />}
            />

            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <Explore />
                </ProtectedRoute>
              }
            />

            <Route
              path="/swipe"
              element={
                <ProtectedRoute>
                  <Swipe />
                </ProtectedRoute>
              }
            />

            <Route
              path="/favoritos"
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              }
            />

            <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <Matches />
                </ProtectedRoute>
              }
            />

            <Route
              path="/mensajes"
              element={
                <ProtectedRoute>
                  <Chats />
                </ProtectedRoute>
              }
            />

            <Route
              path="/chat/:id"
              element={
                <ProtectedRoute>
                  <ChatRoom />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/mi-perfil"
              element={
                <ProtectedRoute>
                  <MyProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/configuracion"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/checkout/:plan/:cycle"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />

            <Route
              path="/verificar"
              element={
                <ProtectedRoute>
                  <VerifyAccount />
                </ProtectedRoute>
              }
            />

           <Route
              path="/toque-especial/:profileId"
              element={
                <ProtectedRoute>
                  <SpecialTouchCheckout />
                </ProtectedRoute>
              }
            />

            <Route
              path="/quien-me-dio-like"
              element={
                <ProtectedRoute>
                  <WhoLikedMe />
                </ProtectedRoute>
              }
            />

          </Route>

        </Routes>
        </Suspense>
      </BrowserRouter>
    </SwipeFiltersProvider>
    </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
