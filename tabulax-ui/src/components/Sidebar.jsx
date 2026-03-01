// src/components/Sidebar.js

import React from "react";
import { FaHome, FaFileUpload, FaBroom, FaSearch, FaCog, FaSignOutAlt } from "react-icons/fa";

export default function Sidebar({ tab, setTab, onLogoutClick, integrationRunning }) {
  return (
    <div
      className="min-h-screen w-64 shadow-2xl
      bg-gradient-to-b from-[#1f4e79] via-[#163a5a] to-[#0a2a43]
      text-white rounded-tr-3xl rounded-br-3xl flex flex-col justify-between overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(
            to bottom,
            #1f4e79 0%,
            #1b456d 25%,
            #163a5a 50%,
            #112f4c 75%,
            #0a2a43 100%
          )
        `,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      {/* 🔷 Top Brand + Navigation */}
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-10 tracking-wide text-white drop-shadow-xl">
          Smart Table Integration
        </h2>

        {/* 🔘 Navigation Links */}
        <nav className="space-y-3">
          {[
            { key: "home", icon: <FaHome />, label: "Home" },
            { key: "uploaded", icon: <FaFileUpload />, label: "Uploaded Files" },
            { key: "clean", icon: <FaBroom />, label: "Clean Files" },
            { key: "features", icon: <FaSearch />, label: "Feature Extracted Files" },
            { key: "settings", icon: <FaCog />, label: "Settings" },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              // Example edit inside onClick handler of each button:
              onClick={() => {
                if (!integrationRunning) setTab(key);
              }}

              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300
                ${tab === key
                  ? "bg-white text-[#0a2a43] font-bold shadow-lg scale-[1.05]"
                  : "hover:bg-white hover:bg-opacity-10 text-white"
                }`}
            >
              <span className="text-xl">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 🔻 Logout at Bottom */}
      <div className="p-6 border-t border-white/20">
        <button
          onClick={onLogoutClick}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-white hover:bg-opacity-10 text-white"
        >
          <FaSignOutAlt className="text-xl" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
