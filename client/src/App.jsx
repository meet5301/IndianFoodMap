import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./layout/Navbar";
import HomePage from "./pages/HomePage";
import VendorDetailPage from "./pages/VendorDetailPage";
import AddVendorPage from "./pages/AddVendorPage";
import AuthPage from "./pages/AuthPage";
import FindStallPage from "./pages/FindStallPage";
import ProfilePage from "./pages/ProfilePage";
import OwnerPortalPage from "./pages/OwnerPortalPage";
import AdminPage from "./pages/AdminPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import RequireAuthRoute from "./routes/RequireAuthRoute";
import AdminRoute from "./routes/AdminRoute";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";

const App = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <div className="min-h-screen bg-appBg text-slate-100">
            <div className="app-photo pointer-events-none fixed inset-0" />
            <div className="app-grid pointer-events-none fixed inset-0" />
            <div className="app-content-mask pointer-events-none fixed inset-0" />
            <div className="relative z-10">
              <Navbar />
              <Routes>
                <Route path="/" element={<Navigate to="/auth" replace />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/find-stall" element={<FindStallPage />} />
                <Route path="/explore" element={<Navigate to="/find-stall" replace />} />
                <Route path="/vendor/:slugOrId" element={<VendorDetailPage />} />
                <Route
                  path="/profile"
                  element={
                    <RequireAuthRoute>
                      <ProfilePage />
                    </RequireAuthRoute>
                  }
                />
                <Route
                  path="/vendor-profile"
                  element={
                    <RequireAuthRoute>
                      <OwnerPortalPage />
                    </RequireAuthRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  }
                />
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/add-vendor"
                  element={
                    <ProtectedRoute>
                      <AddVendorPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/auth" replace />} />
              </Routes>
            </div>
          </div>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
