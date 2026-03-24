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
    <div className="w-full absolute top-0 left-0 bg-[#d9d0c1] dark:bg-[#333446] z-50 shadow-md transition-colors duration-500">
      <img
        src="../../public/images/BookHuntNavbar.png"
        className="m-0 p-0 absolute "
        alt="BookHunt logo"
      />
      <nav className="flex flex-wrap justify-center gap-8 text-2xl p-4 max-w-6xl mx-auto">
        {routes.map((r) => (
          <NavLink
            key={r.route}
            to={r.route}
            className={({ isActive }) =>
              isActive
                ? "text-gray-900 dark:text-white font-semibold border-b-2 border-gray-900 dark:border-white"
                : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            }
          >
            {r.name}
          </NavLink>
        ))}
      </nav>

      {user ? (
        <div className="absolute top-1/2 right-6 transform -translate-y-1/2 flex items-center gap-5">
          <ThemeToggler />
          <NavLink to="/notifications" className="relative text-gray-700 dark:text-gray-300 hover:text-emerald-500 transition-colors">
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
            className="flex items-center gap-3 cursor-pointer outline-none"
          >
            <span className="text-gray-900 dark:text-white font-medium text-lg hidden sm:block">{user.username}</span>
            <img src="/images/profile_icon.png" alt="Profile" className="w-12 h-12 rounded-full hover:opacity-80 transition-opacity" />
          </button>
        </div>
      ) : (
        <div className="absolute top-1/2 right-6 transform -translate-y-1/2 flex items-center gap-4">
          <ThemeToggler />
          <NavLink to="/login" className="flex items-center gap-3">
            <img src="/images/profile_icon.png" alt="Profile" className="w-12 h-12 rounded-full hover:opacity-80 transition-opacity" />
          </NavLink>
        </div>
      )}

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
