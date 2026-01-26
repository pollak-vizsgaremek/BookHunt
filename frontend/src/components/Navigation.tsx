import { NavLink } from "react-router"; // Ensure 'react-router-dom' is used
const Navigation = () => {
  const routes = [
    {
      name: "Home",
      route: "/",
    },
    // Add more routes here 
  ];

  return (
    <div className="w-full absolute top-0 left-0 bg-[#333446] z-50 shadow-md">
      <img src="../../public/images/BookHuntNavbar.png" className="m-0 p-0 absolute " alt="BookHunt logo" />
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
    </div>
  );
};

export default Navigation;