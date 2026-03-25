import { Link, useLocation } from "react-router";
import { Zap, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mocked auth state - in a real app, this would come from a context/store
  const isLoggedIn = !!localStorage.getItem("token");
  const userRole = localStorage.getItem("role") || "user"; // 'user', 'owner', or 'admin'

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-green-600">
            <img src="/logo.png" alt="Ilaitrick Logo" className="h-14 w-auto object-contain" />
            <span className="text-xl font-bold">Ilaitrick Portal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-gray-700 hover:text-green-600 transition-colors ${
                isActive("/") ? "text-green-600 font-semibold" : ""
              }`}
            >
              Home
            </Link>
            <Link
              to="/stations"
              className={`text-gray-700 hover:text-green-600 transition-colors ${
                isActive("/stations") ? "text-green-600 font-semibold" : ""
              }`}
            >
              Stations
            </Link>
            <Link
              to="/about"
              className={`text-gray-700 hover:text-green-600 transition-colors ${
                isActive("/about") ? "text-green-600 font-semibold" : ""
              }`}
            >
              About
            </Link>

            {isLoggedIn && userRole === "user" && (
              <Link
                to="/my-bookings"
                className={`text-gray-700 hover:text-green-600 transition-colors ${
                  isActive("/my-bookings") ? "text-green-600 font-semibold" : ""
                }`}
              >
                My Bookings
              </Link>
            )}

            {isLoggedIn && userRole === "owner" && (
              <Link
                to="/owner"
                className={`text-gray-700 hover:text-green-600 transition-colors ${
                  isActive("/owner") ? "text-green-600 font-semibold" : ""
                }`}
              >
                Owner Dashboard
              </Link>
            )}

            {isLoggedIn && userRole === "admin" && (
              <Link
                to="/admin"
                className={`text-gray-700 hover:text-green-600 transition-colors ${
                  isActive("/admin") ? "text-green-600 font-semibold" : ""
                }`}
              >
                Admin Panel
              </Link>
            )}

            {isLoggedIn ? (
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                Logout
              </Button>
            ) : (
              <Link to="/login">
                <Button className="bg-green-600 hover:bg-green-700">
                  Login / Register
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className={`text-gray-700 hover:text-green-600 transition-colors ${
                  isActive("/") ? "text-green-600 font-semibold" : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/stations"
                className={`text-gray-700 hover:text-green-600 transition-colors ${
                  isActive("/stations") ? "text-green-600 font-semibold" : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Stations
              </Link>

              {isLoggedIn && userRole === "user" && (
                <Link
                  to="/my-bookings"
                  className={`text-gray-700 hover:text-green-600 transition-colors ${
                    isActive("/my-bookings") ? "text-green-600 font-semibold" : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Bookings
                </Link>
              )}

              {isLoggedIn && userRole === "owner" && (
                <Link
                  to="/owner"
                  className={`text-gray-700 hover:text-green-600 transition-colors ${
                    isActive("/owner") ? "text-green-600 font-semibold" : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Owner Dashboard
                </Link>
              )}

              {isLoggedIn && userRole === "admin" && (
                <Link
                  to="/admin"
                  className={`text-gray-700 hover:text-green-600 transition-colors ${
                    isActive("/admin") ? "text-green-600 font-semibold" : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}

              {isLoggedIn ? (
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="w-full border-green-600 text-green-600"
                >
                  Logout
                </Button>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="bg-green-600 hover:bg-green-700 w-full">
                    Login / Register
                  </Button>
                </Link>
              )}
              <Link
                to="/about"
                className={`text-gray-700 hover:text-green-600 transition-colors ${
                  isActive("/about") ? "text-green-600 font-semibold" : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
