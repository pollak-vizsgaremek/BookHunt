import { Outlet } from "react-router";
import Navigation from "./Navigation";

const ProtectedRoute = () => {
  const isAuth = true; // Replace with real authentication logic later

  if (!isAuth) {
    return (
      <div className="flex justify-center text-2xl">
        Access denied, please login to continue.
      </div>
    );
  }

  return (
    <div>
      <div>
        <Navigation />
      </div>

      <Outlet />
    </div>
  );
};

export default ProtectedRoute;
