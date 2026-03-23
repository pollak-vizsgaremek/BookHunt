import { NavLink } from "react-router"; // Ensure 'react-router-dom' is used
import { useState } from "react";
import ProfileModal from "./ProfileModal";
import ThemeToggler from "./ThemeToggler";

const Navigation = () => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

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
        <div className="absolute top-1/2 right-6 transform -translate-y-1/2 flex items-center gap-4">
          <ThemeToggler />
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
