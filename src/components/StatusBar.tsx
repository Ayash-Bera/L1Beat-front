import { CheckCircle, AlertTriangle, Menu, X, ExternalLink } from 'lucide-react';
import { HealthStatus } from '../types';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

interface StatusBarProps {
  health: HealthStatus | null;
}

export function StatusBar({ health }: StatusBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  const handleLogoClick = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className={`sticky top-0 z-50 transform transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
      {/* Alpha Warning Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              L1Beat is currently in alpha. Data shown may be incomplete or inaccurate.
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Health Status */}
            <div className="flex items-center gap-6">
              <Link
                to="/"
                onClick={handleLogoClick}
                className="relative transform transition-all duration-300 hover:scale-105 focus:outline-none group"
              >
                <div
                  className={`absolute inset-0 bg-red-500/20 dark:bg-red-500/30 rounded-lg filter blur-xl transition-opacity duration-500 ${isAnimating ? 'animate-heartbeat-glow' : 'opacity-0'
                    }`}
                />
                <img
                  src="https://raw.githubusercontent.com/muhammetselimfe/L1Beat/refs/heads/main/public/l1_logo_main_2.png"
                  alt="L1Beat"
                  className={`h-8 w-auto relative ${isAnimating ? 'animate-heartbeat' : ''
                    } transition-transform duration-300`}
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-4">
                <Link
                  to="/blog"
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/blog')
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                >
                  Blog
                </Link>

                <a
                  href="https://docs.avax.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Docs
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <Link
                  to="/acps"
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/acps')
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                >
                  ACPs
                </Link>
              </div>

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
            }`}>
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 dark:border-dark-700">
              <Link
                to="/blog"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive('/blog')
                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
              >
                Blog
              </Link>

              <a
                href="https://docs.avax.network/"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Docs
              </a>

              <Link
                to="/acps"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive('/acps')
                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
              >
                ACPs
              </Link>

              <div className="pt-4 border-t border-gray-200 dark:border-dark-700">
                <div className="flex items-center justify-between px-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}