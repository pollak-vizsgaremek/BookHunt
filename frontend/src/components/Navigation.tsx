import { NavLink } from "react-router"; // Ensure 'react-router-dom' is used
import { useState, useEffect } from "react";
import ProfileModal from "./ProfileModal";
import ThemeToggler from "./ThemeToggler";

const Navigation = () => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.filter((n: { olvasott: boolean }) => !n.olvasott).length);
        }
      } catch (e) { console.error(e); }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000); 
    return () => clearInterval(interval);
  }, [user]);

  const routes = [
    { name: "Home", route: "/" },
    ...(user ? [{ name: "Wishlist", route: "/wishlist" }] : [{ name: "Login", route: "/login" }]),
  ];
  {/* I'll merge these two later with a profile page */ }
  return (
    <div className="w-full absolute top-6 left-0 z-50 px-4 flex justify-center">
      <div className="w-full max-w-7xl flex flex-wrap items-center justify-between bg-white/20 dark:bg-black/40 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-full px-6 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500">
        
        {/* Left Side: Logo */}
        <NavLink to="/" className="flex items-center gap-3 group transition-transform duration-300 hover:scale-105">
          <img
            src="/images/LogoHappy.png"
            className="w-10 h-10 md:w-11 md:h-11 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
            alt="BookHunt logo"
          />
          <span 
            className="text-2xl md:text-3xl tracking-widest text-emerald-500 animate-pulse hidden sm:block"
            style={{ 
              textShadow: "0 0 10px rgba(52,211,153,0.8), 0 0 20px rgba(52,211,153,0.5), 0 0 30px rgba(52,211,153,0.3)",
              WebkitTextStroke: "1px rgba(255,255,255,0.2)"
            }}
          >
            BookHunt
          </span>
        </NavLink>

        {/* Right Side: Links & Profile */}
        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="hidden md:flex items-center gap-6 text-xl">
            {routes.map((r) => (
              <NavLink
                key={r.route}
                to={r.route}
                className={({ isActive }) =>
                  isActive
                    ? "text-gray-900 dark:text-white font-bold tracking-wide"
                    : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                }
              >
                {r.name}
              </NavLink>
            ))}
          </nav>

          {/* Divider */}
          <div className="hidden md:block w-px h-6 bg-black/20 dark:bg-white/20"></div>

          {user ? (
            <div className="flex items-center gap-4">
              <ThemeToggler />
              <NavLink to="/notifications" className="relative text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C8.67 6.165 8 7.388 8 8.828v5.33c0 .381-.146.747-.41 1.012L6 17h5m4 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-3 cursor-pointer outline-none group"
              >
                <span className="text-gray-900 dark:text-white font-medium text-lg hidden lg:block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{user.username}</span>
                <img src="/images/profile_icon.png" alt="Profile" className="w-10 h-10 md:w-11 md:h-11 rounded-full group-hover:opacity-80 transition-opacity drop-shadow-sm border border-black/10 dark:border-white/10" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ThemeToggler />
              <NavLink to="/login" className="flex items-center gap-3 group">
                <span className="text-gray-900 dark:text-white font-medium text-lg hidden md:block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Sign In</span>
                <img src="/images/profile_icon.png" alt="Profile" className="w-10 h-10 md:w-11 md:h-11 rounded-full group-hover:opacity-80 transition-opacity drop-shadow-sm border border-black/10 dark:border-white/10" />
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Render Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
      />
    </div>
  );
};

export default Navigation;
