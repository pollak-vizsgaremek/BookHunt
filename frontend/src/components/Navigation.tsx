import { NavLink, useNavigate } from "react-router"; 
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ProfileModal from "./ProfileModal";
import PasscodeModal from "./PasscodeModal";
import ThemeToggler from "./ThemeToggler";

const Navigation = () => {
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [unreadCount, setUnreadCount] = useState(0);

  // Scroll handler for Smart-Hide
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  useEffect(() => {
    if (!user) return;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let initialDelayId: ReturnType<typeof setTimeout> | null = null;
    let consecutiveFailures = 0;
    const controller = new AbortController();

    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.filter((n: { olvasott: boolean }) => !n.olvasott).length);
          consecutiveFailures = 0;
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;
        consecutiveFailures += 1;
        if (consecutiveFailures >= 3 && intervalId) {
          clearInterval(intervalId);
          intervalId = setInterval(fetchUnread, 5 * 60 * 1000);
        }
      }
    };

    initialDelayId = setTimeout(() => {
      fetchUnread();
      intervalId = setInterval(fetchUnread, 60_000);
    }, 2000);

    return () => {
      controller.abort();
      if (initialDelayId) clearTimeout(initialDelayId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  const routes = [
    { name: "Home", route: "/" },
    { name: "Forums", route: "/forums" },
    ...(user ? [
      { name: "Wishlist", route: "/wishlist" },
      { name: "Bookmarks", route: "/bookmarks" }
    ] : [{ name: "Login", route: "/login" }]),
  ];

  return (
    <>
      <motion.div 
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -120 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-full fixed top-0 sm:top-6 left-0 z-50 px-0 sm:px-4 flex justify-center"
      >
        <div className="w-full max-w-7xl flex items-center justify-between bg-white/60 dark:bg-black/40 backdrop-blur-2xl border-b sm:border border-white/30 dark:border-white/10 rounded-none sm:rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg transition-all duration-500">
          
          <NavLink to="/" className="flex items-center gap-2 sm:gap-3 group transition-transform duration-300 hover:scale-105 shrink-0">
            <img
              src="/images/LogoHappy.png"
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 drop-shadow-md"
              alt="BookHunt logo"
            />
            <span 
              className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-emerald-500 hidden xs:block"
              style={{ textShadow: "0 0 10px rgba(52,211,153,0.3)" }}
            >
              BookHunt
            </span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-6">
            {routes.map((r) => (
              <NavLink
                key={r.route}
                to={r.route}
                className={({ isActive }) =>
                  `text-base font-semibold tracking-wide transition-all ${
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`
                }
              >
                {r.name}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
            <div className="flex items-center gap-1 sm:gap-3">
              <ThemeToggler />
              
              {user && (
                <NavLink 
                  to="/notifications" 
                  className={({ isActive }) => 
                    `relative p-2 transition-colors ${
                      isActive 
                        ? "text-emerald-600 dark:text-emerald-400" 
                        : "text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                    }`
                  }
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C8.67 6.165 8 7.388 8 8.828v5.33c0 .381-.146.747-.41 1.012L6 17h5m4 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] rounded-full h-3.5 w-3.5 flex items-center justify-center animate-pulse font-bold">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              )}
            </div>

            <div className="w-px h-6 bg-black/10 dark:bg-white/10 hidden sm:block"></div>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                {user.szerepkor === 'ADMIN' && (
                  <button
                    onClick={() => setIsPasscodeModalOpen(true)}
                    className="p-2 rounded-full bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-500 transition-all hover:scale-110 active:scale-90 shadow-lg shadow-yellow-500/10 border border-yellow-500/20"
                    title="Admin Panel"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 00-.553.894l1 5a1 1 0 00.998.807L5 11.78l.051-.001.076-.015a1.008 1.008 0 00.183-.039l3.69-1.23 3.69 1.23a1.013 1.013 0 00.183.039l.076.015.051.001 1-.001a1 1 0 00.998-.807l1-5a1 1 0 00-.553-.894l-7-3zM5 14a1 1 0 00-1 1v1a2 2 0 002 2h8a2 2 0 002-2v-1a1 1 0 00-1-1H5z" />
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 sm:gap-3 cursor-pointer outline-none group shrink-0"
                >
                  <span className="text-gray-900 dark:text-white font-bold text-sm hidden lg:block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercase tracking-wider">{user.felhasznalonev || user.username}</span>
                  <div className="relative p-0.5 rounded-full ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/50 transition-all">
                    <img 
                      src={user.profilkep || "/images/profile_icon.png"} 
                      alt="Profile" 
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </button>
              </div>
            ) : (
              <NavLink to="/login" className="flex items-center gap-2 group shrink-0">
                 <span className="text-gray-900 dark:text-white font-bold text-sm hidden sm:block group-hover:text-emerald-600 transition-colors uppercase tracking-widest">Sign In</span>
                 <div className="p-1 rounded-full ring-2 ring-black/5 dark:ring-white/5 group-hover:ring-emerald-500/30 transition-all">
                  <img src="/images/profile_icon.png" alt="Profile" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full" />
                 </div>
              </NavLink>
            )}
          </div>
        </div>

        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
        />

        <PasscodeModal
          isOpen={isPasscodeModalOpen}
          onClose={() => setIsPasscodeModalOpen(false)}
          onSuccess={() => navigate("/admin")}
        />
      </motion.div>
    </>
  );
};

export default Navigation;
