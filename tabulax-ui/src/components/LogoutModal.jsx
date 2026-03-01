// src/components/LogoutModal.js
import React from "react";

export default function LogoutModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-xl">
        <h2 className="text-xl font-bold text-[#1f4e79] mb-4">Confirm Logout</h2>
        <p className="text-gray-700 mb-6">Are you sure you want to logout?</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-[#1f4e79] text-white hover:bg-[#163a5a] transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
