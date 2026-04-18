import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import BrandMark from "../components/BrandMark";
import { useAuth } from "../context/AuthContext";

const NavItem = ({ to, children, onNavigate }) => {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `rounded-full px-3 py-2 text-xs transition md:text-sm ${isActive ? "bg-accent text-white" : "text-slate-300 hover:text-amber-300"}`
      }
    >
      {children}
    </NavLink>
  );
};

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const accessMode = localStorage.getItem("ifm_access_mode") || "customer";
  const isVendorMode = accessMode === "vendor";
  const profilePath = isVendorMode ? "/vendor-profile" : "/profile";
  const closeMobileMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-20 border-b border-line/60 bg-[#060708]/95 backdrop-blur-xl">
      <div className="page-wrap py-2">
        <div className="frame-shell px-3 py-3 md:px-4">
          <div className="flex items-center justify-between gap-3">
            <Link to="/auth" className="flex items-center gap-2 font-display text-[1.2rem] font-bold tracking-tight text-white sm:text-[1.45rem] md:text-[1.8rem]">
              <BrandMark className="h-7 w-7 shrink-0 text-accent" />
              <span>India</span>
              <span className="text-accent">FoodMap</span>
            </Link>

            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="btn-ghost px-2 py-1 text-xs"
                aria-label="Toggle navigation menu"
              >
                {menuOpen ? "Close" : "Menu"}
              </button>
            </div>

            <nav className="hidden items-center gap-1 text-[13px] lg:flex">
              <NavItem to="/home">Home</NavItem>
              <NavItem to="/find-stall">Find Stall</NavItem>
              {isVendorMode ? <NavItem to="/add-vendor">Add Vendor</NavItem> : null}
              {isAuthenticated ? <NavItem to={profilePath}>Profile</NavItem> : null}
              {isAuthenticated ? null : <NavItem to="/auth">Login</NavItem>}
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
              {isAuthenticated ? (
                <button type="button" onClick={logout} className="btn-ghost px-3 py-1.5 text-xs">
                  Logout
                </button>
              ) : null}
            </div>
        </div>

          {menuOpen ? (
            <div className="mt-3 border-t border-line/60 pt-3 lg:hidden">
              <nav className="flex flex-col gap-2 rounded-2xl border border-line bg-panelSoft p-3 text-[13px] shadow-lg shadow-black/20">
                <NavItem to="/home" onNavigate={closeMobileMenu}>Home</NavItem>
                <NavItem to="/find-stall" onNavigate={closeMobileMenu}>Find Stall</NavItem>
                {isVendorMode ? (
                  <NavItem to="/add-vendor" onNavigate={closeMobileMenu}>
                    Add Vendor
                  </NavItem>
                ) : null}
                {isAuthenticated ? (
                  <NavItem to={profilePath} onNavigate={closeMobileMenu}>
                    Profile
                  </NavItem>
                ) : null}
                {isAuthenticated ? null : (
                  <NavItem to="/auth" onNavigate={closeMobileMenu}>
                    Login
                  </NavItem>
                )}
              </nav>
              {isAuthenticated ? (
                <button type="button" onClick={logout} className="btn-ghost mt-3 w-full px-3 py-2 text-xs">
                  Logout
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
