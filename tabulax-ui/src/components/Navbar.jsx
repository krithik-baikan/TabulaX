import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-br from-white via-blue-50 to-white backdrop-blur-sm shadow-md">
      <div className="w-full px-6 py-5 flex justify-between items-center">
        
        {/* 🔵 Small Logo + Slightly Bigger Brand Name */}
        <div className="flex items-center gap-3 ml-4">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#1f4e79] shadow-md">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-[1.3rem] sm:text-[1.5rem] font-semibold text-[#1f4e79] leading-tight">
            <span className="text-[#0a2a43]">S</span>mart Table Integration
          </h1>
        </div>

        {/* 🔗 Nav Links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="text-[#1f4e79] hover:text-[#0a2a43] font-medium">Home</Link>
          <Link to="/about" className="text-[#1f4e79] hover:text-[#0a2a43] font-medium">About</Link>
          <Link to="/support" className="text-[#1f4e79] hover:text-[#0a2a43] font-medium">Support</Link>
          <Link to="/dashboard" className="text-[#1f4e79] hover:text-[#0a2a43] font-medium">Dashboard</Link>

          {/* 🔒 Login Button */}
          <Link
            to="/login"
            className="bg-gradient-to-r from-[#1f4e79] to-[#0a2a43] text-white px-5 py-1.5 rounded-full shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300 text-sm"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
