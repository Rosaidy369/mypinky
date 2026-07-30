import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { NotificationsProvider } from "./hooks/useNotifications";
import { SwipeFiltersProvider } from "./hooks/useSwipeFilters";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Swipe from "./pages/Swipe";
import Favorites from "./pages/Favorites";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Premium from "./pages/Premium";
import Onboarding from "./pages/Onboarding";
import Matches from "./pages/Matches";
import Chats from "./pages/Chats";
import ChatRoom from "./pages/ChatRoom";
import MyProfile from "./pages/MyProfile";
import Settings from "./pages/Settings";
import Checkout from "./pages/Checkout";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Support from "./pages/Support";
import Contact from "./pages/Contact";
import PremiumMessageCheckout from "./pages/PremiumMessageCheckout";
import WhoLikedMe from "./pages/WhoLikedMe";

function App() {
  return (
    <AuthProvider>
    <NotificationsProvider>
    <SwipeFiltersProvider>
      <BrowserRouter>
        <Routes>

          <Route element={<AppLayout />}>

            <Route path="/" element={<Home />} />

            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />

            <Route path="/olvide-contrasena" element={<ForgotPassword />} />

            <Route path="/restablecer-contrasena" element={<ResetPassword />} />

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
              path="/checkout/:plan"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />

           <Route
              path="/mensaje-premium/:profileId"
              element={
                <ProtectedRoute>
                  <PremiumMessageCheckout />
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
      </BrowserRouter>
    </SwipeFiltersProvider>
    </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;