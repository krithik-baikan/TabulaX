import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  const location = useLocation();

  // Check if current route is home
  const isHomePage = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`${isHomePage ? "" : "mt-24"} flex-1 px-4`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
