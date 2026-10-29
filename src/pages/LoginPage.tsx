import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle, AlertTriangle } from 'lucide-react';
import { RoleType } from '../types/database';
import { SUPABASE_PROJECT_URL } from '../lib/supabase';

/**
 * Validates and resolves a safe internal relative redirect path.
 * Prevents open redirect attacks (e.g. //evil.com or https://evil.com)
 * and enforces role-based destination permissions.
 */
function getSafeDestination(rawTarget: string | null, userRole: RoleType | null): string {
  const fallback = userRole === 'admin' ? '/admin' : '/dashboard';
  if (!rawTarget) return fallback;

  try {
    const decoded = decodeURIComponent(rawTarget).trim();
    // Must begin with a single slash, not double slash or backslash
    if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.startsWith('/\\')) {
      return fallback;
    }
    // Must not contain a protocol or host indicator
    if (decoded.includes(':') || decoded.includes('@')) {
      return fallback;
    }
    // Prevent redirect loops to login
    if (decoded.startsWith('/login')) {
      return fallback;
    }
    // Non-admin users cannot be redirected to /admin
    if (decoded.startsWith('/admin') && userRole !== 'admin') {
      return '/dashboard';
    }
    // Admins should not be redirected to member dashboard
    if (userRole === 'admin' && decoded.startsWith('/dashboard')) {
      return '/admin';
    }
    return decoded;
  } catch {
    return fallback;
  }
}

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, role, isLoading, configError, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract redirect query parameter if present
  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = searchParams.get('redirect');

  // If already authenticated with a verified role on page load, redirect to the appropriate dashboard
  useEffect(() => {
    // Do not trigger background redirect while actively submitting the login form
    if (!isSubmitting && !isLoading && user && role) {
      const destination = getSafeDestination(redirectTarget, role);
      console.log('[Guru Fitness Auth] Active session detected. Redirect decision:', {
        destination,
        role,
        userId: user.id,
        redirectTarget: redirectTarget || '(none)'
      });
      navigate(destination, { replace: true });
    }
  }, [user, role, isLoading, isSubmitting, redirectTarget, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both your registered email address and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);

    if (result.success && result.role) {
      const destination = getSafeDestination(redirectTarget, result.role);
      console.log('[Guru Fitness Auth] Login successful. Redirect decision:', {
        destination,
        resolvedRole: result.role,
        redirectTarget: redirectTarget || '(none)'
      });
      navigate(destination, { replace: true });
    } else {
      setIsSubmitting(false);
      setError(result.error || 'Authentication failed. Please verify your email and password.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded bg-gym-red flex items-center justify-center font-display font-bold text-2xl text-white shadow-lg shadow-gym-red/20">
              G
            </div>
          </Link>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white uppercase tracking-tight">
            Account Sign In
          </h2>
          <p className="text-xs text-gym-muted">
            Sign in with your verified credentials to access your dashboard.
          </p>
        </div>

        {/* Backend Configuration Notice (If publishable key is missing) */}
        {configError && (
          <div className="bg-amber-950/60 border border-amber-500/50 rounded-lg p-4 text-xs text-amber-200 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-amber-300 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Supabase Project Notice</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              Target Project URL: <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">{SUPABASE_PROJECT_URL}</code>
            </p>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              Live authentication requires your project's publishable API key. Please set{' '}
              <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_PUBLISHABLE_KEY</code>{' '}
              in your <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">.env.local</code> file.
            </p>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-gym-card border border-gym-border rounded-xl p-8 shadow-2xl">
          {error && (
            <div className="mb-5 bg-red-950/60 border border-red-500/60 p-3.5 rounded text-xs text-red-200 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gym-muted absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="w-full bg-gym-surface border border-gym-border rounded pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gym-red transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-gym-muted hover:text-gym-red transition"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gym-muted absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-gym-surface border border-gym-border rounded pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gym-red transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded bg-gym-red hover:bg-gym-red-hover text-white font-display font-bold text-sm uppercase tracking-wider shadow-lg shadow-gym-red/25 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              <span>{isSubmitting ? 'Signing In...' : 'Sign In To Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gym-border/70 text-center text-xs text-gym-muted">
            New to GURU FITNESS?{' '}
            <Link to="/register" className="text-white hover:text-gym-red font-semibold transition ml-1">
              Join Now &amp; Register
            </Link>
          </div>
        </div>

        {/* Security & Access Information */}
        <div className="text-center text-[11px] text-gym-muted/80 space-y-1">
          <p>Gym Owner / Admin access is strictly restricted to verified staff credentials.</p>
          <p>All sessions and member data are encrypted and authorized via PostgreSQL Row-Level Security.</p>
        </div>
      </div>
    </div>
  );
};

