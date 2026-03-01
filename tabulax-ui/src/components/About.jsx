import React from "react";

const features = [
  {
    title: "Data Difference Detection",
    description: "Spot inconsistencies between clean and noisy datasets with ease.",
  },
  {
    title: "Auto Cleanup",
    description: "Automatically fix formatting, spelling, and structural errors.",
  },
  {
    title: "Feature Extraction",
    description: "Extract numbers, patterns, and important content instantly.",
  },
  {
    title: "Format Conversion",
    description: "Convert PDF, Excel, and JSON into clean CSV effortlessly.",
  },
  {
    title: "File History Tracking",
    description: "Access uploaded and cleaned files anytime in one place.",
  },
  {
    title: "Multiple Export Options",
    description: "Download final data in CSV, Excel, or JSON formats.",
  },
];

const About = () => {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-gradient-to-br from-white via-blue-50 to-white overflow-hidden z-0">
      {/* 🔮 Glow Circles */}
      <div className="absolute top-10 left-[-50px] w-72 h-72 bg-[#1f4e79] opacity-10 blur-3xl rounded-full"></div>
      <div className="absolute bottom-10 right-[-50px] w-72 h-72 bg-[#1f4e79] opacity-10 blur-3xl rounded-full"></div>

      {/* 🖼️ SVG Image */}
      <img
        src="/data-ai.svg"
        alt="Decorative"
        className="absolute top-24 left-64 w-56 opacity-80 drop-shadow-xl pointer-events-none"
      />

      {/* Content Section */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-4 pt-24">
        {/* Heading */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-[#1f4e79] to-[#0a2a43] text-white px-6 py-2 rounded-full shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300">
            <h1 className="text-white text-4xl font-bold tracking-wide">ABOUT</h1>
          </div>
        </div>

        {/* Feature Cards */}
<div className="w-full max-w-5xl bg-white bg-opacity-95 border-2 border-[#1f4e79] backdrop-blur-md rounded-3xl shadow-xl p-6 sm:p-8 md:p-10 animate-fadeIn overflow-hidden mt-8 sm:mt-12 md:mt-16">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {features.map((feature, index) => {
      const specialTitles = [
        "Auto Cleanup",
        "Format Conversion",
        "Multiple Export Options"
      ];
      const isSpecial = specialTitles.includes(feature.title);
      const boxBg = isSpecial ? "#d8e3ec" : "#f7f5ff";

      return (
        <div
          key={index}
          className="p-4 sm:p-5 rounded-2xl shadow-md hover:shadow-xl transition duration-300 transform hover:scale-105"
          style={{ backgroundColor: boxBg }}
        >
          <h3 className="text-lg font-bold text-[#1f4e79] mb-2">{feature.title}</h3>
          <p className="text-gray-700 text-sm">{feature.description}</p>
        </div>
      );
    })}
  </div>
</div>
      </div>
    </div>
  );
};

export default About;
