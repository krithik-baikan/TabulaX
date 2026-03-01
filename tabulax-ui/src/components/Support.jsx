import React from "react";
import { FaEnvelope, FaPhoneAlt } from "react-icons/fa";

const Support = () => {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-gradient-to-br from-white via-blue-50 to-white overflow-hidden z-0">
      
      {/* 🎨 Decorative SVGs */}
      <img
        src="/support3.svg"
        alt="Decorative 3"
        className="absolute bottom-16 right-0 w-40 opacity-80 z-0 pointer-events-none"
      />
      <img
        src="/support4.svg"
        alt="Decorative 4"
        className="absolute top-40 left-48 w-56 opacity-100 z-0 pointer-events-none transform -scale-x-100"
      />

      {/* 🎖 Heading */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full pt-24 px-4">
        <div className="bg-gradient-to-r from-[#1f4e79] to-[#0a2a43] text-white px-6 py-2 rounded-full shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300 mb-10">
          <h1 className="text-white text-4xl font-bold tracking-wide">SUPPORT</h1>
        </div>

        {/* ✨ Info Line */}
        <p className="text-2xl font-semibold text-[#1f4e79] mb-8 text-center max-w-3xl">
          If you need help, we’re here for you 24/7.
        </p>

        {/* 🧊 Card Container */}
        <div className="w-full max-w-6xl border-2 border-[#1f4e79] rounded-3xl shadow-2xl bg-white bg-opacity-95 backdrop-blur-md p-10 md:p-10 flex flex-col md:flex-row gap-10 justify-center items-center animate-fadeIn">

          
          {/* 📧 Email Support */}
          <div className="bg-[#f0f4f8] p-6 rounded-xl shadow-md w-full md:w-1/2 text-center transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl">
            <FaEnvelope className="text-4xl text-[#1f4e79] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#0a2a43] mb-2">Email Support</h2>
            <p className="text-[#4a4a4a]">
              Reach out anytime at <br />
              <strong>support@smarttableintegration.com</strong>
            </p>
          </div>

          {/* 📞 Phone Support */}
          <div className="bg-[#f0f4f8] p-6 rounded-xl shadow-md w-full md:w-1/2 text-center transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl">
            <FaPhoneAlt className="text-4xl text-[#1f4e79] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#0a2a43] mb-2">Call Us</h2>
            <p className="text-[#4a4a4a]">
              Monday to Friday (10 AM – 6 PM) <br />
              <strong>+91 98765 43210</strong>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Support;
