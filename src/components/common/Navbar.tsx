import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, User, Dumbbell, PhoneCall } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Training', href: '/training' },
    { name: 'Memberships', href: '/memberships' },
    { name: 'Nutrition', href: '/nutrition' },
    { name: 'Our Coaches', href: '/coaches' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-gym-dark/95 backdrop-blur-md border-b border-gym-border/80 shadow-2xl py-3.5'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded bg-gym-red flex items-center justify-center font-display font-bold text-2xl text-white shadow-lg shadow-gym-red/20 group-hover:scale-105 transition">
              G
            </div>
            <div>
              <span className="font-display font-extrabold text-2xl tracking-wider text-white block leading-none">
                GURU FITNESS
              </span>
              <span className="text-[10px] tracking-[0.25em] text-gym-muted uppercase font-medium block">
                &amp; NUTRITIONS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`text-sm font-medium tracking-wide transition-colors duration-200 relative py-1 ${
                  isActive(link.href)
                    ? 'text-gym-red font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.name}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gym-red rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Customer Action Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <a
              href="tel:9828482505"
              className="text-gray-300 hover:text-white flex items-center space-x-1.5 text-xs font-semibold mr-2"
              title="Call Guru Fitness Front Desk"
            >
              <PhoneCall className="w-3.5 h-3.5 text-gym-red" />
              <span>9828482505</span>
            </a>

            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 bg-gym-card border border-gym-border hover:border-gym-red px-3.5 py-2 rounded text-xs font-semibold text-white transition"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>My Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-xs font-semibold uppercase tracking-wider text-gray-300 hover:text-white px-3 py-2 transition"
              >
                Member Login
              </Link>
            )}

            <Link
              to="/register"
              className="inline-flex items-center space-x-1.5 bg-gym-red hover:bg-gym-red-hover text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded shadow-lg shadow-gym-red/20 transition-all hover:translate-y-[-1px]"
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Join Now</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded text-gray-300 hover:text-white hover:bg-gym-surface focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Customer Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-gym-card border-b border-gym-border px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded text-base font-medium ${
                  isActive(link.href)
                    ? 'bg-gym-surface text-gym-red font-semibold'
                    : 'text-gray-300 hover:bg-gym-surface/50 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t border-gym-border/60 flex flex-col space-y-3">
            <a
              href="tel:9828482505"
              className="text-gray-300 flex items-center space-x-2 text-sm px-3"
            >
              <PhoneCall className="w-4 h-4 text-gym-red" />
              <span>Helpline: 9828482505 / 7014838282</span>
            </a>

            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-gym-surface border border-gym-border py-2.5 rounded font-semibold text-sm text-white"
              >
                Open Member Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center border border-gym-border py-2.5 rounded font-semibold text-sm text-gray-300 hover:text-white"
              >
                Member Login
              </Link>
            )}

            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-gym-red hover:bg-gym-red-hover py-2.5 rounded font-bold text-sm uppercase tracking-wider text-white shadow-lg shadow-gym-red/25"
            >
              Join the Gym
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
