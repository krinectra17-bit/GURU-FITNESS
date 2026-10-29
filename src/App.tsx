import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { Home } from './pages/Home';
import { TrainingPage } from './pages/TrainingPage';
import { MembershipsPage } from './pages/MembershipsPage';
import { NutritionPage } from './pages/NutritionPage';
import { CoachesPage } from './pages/CoachesPage';
import { ContactPage } from './pages/ContactPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { MemberDashboard } from './pages/MemberDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

// Scroll to top on route navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// 404 Not Found Page
const NotFoundPage = () => (
  <div className="min-h-[75vh] flex items-center justify-center py-20 px-4 text-center">
    <div className="bg-gym-card border border-gym-border rounded-xl p-8 max-w-md w-full space-y-4 shadow-2xl">
      <div className="w-12 h-12 rounded-full bg-gym-red/20 text-gym-red flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h1 className="font-display font-extrabold text-4xl text-white uppercase">404</h1>
      <h2 className="font-display font-bold text-xl text-white uppercase">Page Not Found</h2>
      <p className="text-xs text-gym-muted">
        The requested training section or page does not exist or has been moved.
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-gym-red hover:bg-gym-red-hover text-white px-5 py-2.5 rounded font-display font-bold text-xs uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return To Homepage</span>
        </Link>
      </div>
    </div>
  </div>
);

// App Layout Controller
const Layout: React.FC = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0D11] text-gym-text">
      <ScrollToTop />

      {/* Public Header on non-admin routes */}
      {!isAdminPath && <Navbar />}

      {/* Main Page Routing */}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/memberships" element={<MembershipsPage />} />
          <Route path="/nutrition" element={<NutritionPage />} />
          <Route path="/coaches" element={<CoachesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Member Dashboard */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute requiredRole="member">
                <MemberDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Owner / Admin Management Panel */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      {/* Public Footer on non-admin routes */}
      {!isAdminPath && <Footer />}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout />
      </Router>
    </AuthProvider>
  );
}

export default App;
