import { NavLink } from "react-router"; // Ensure 'react-router-dom' is used
const Navigation = () => {
  const routes = [
    {
      name: "Home",
      route: "/",
    },
    {
      name: "Login",
<<<<<<< Updated upstream
      route: "/login",
    },
    {
      name: "Register",
      route: "/register",
    },
=======
      route: "/Login",
    },
    // Add more routes here
>>>>>>> Stashed changes
  ];
  {/* I'll merge these two later with a profile page */ }
  return (
    <div className="w-full absolute top-0 left-0 bg-[#333446] z-50 shadow-md">
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
                ? "text-white font-semibold border-b-2 border-white"
                : "text-gray-300 hover:text-white transition-colors duration-200"
            }
          >
            {r.name}
          </NavLink>
        ))}
      </nav>
      <NavLink to="/profile" className="absolute top-1/2 right-6 transform -translate-y-1/2">
        <img src="/images/profile_icon.png" alt="Profile" className="w-12 h-12 rounded-full hover:opacity-80 transition-opacity" />
      </NavLink>
    </div>
  );
};

export default Navigation;
