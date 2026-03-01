import React from "react";

const HeroSection = () => {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-no-repeat bg-cover bg-left font-sans"
      style={{
        backgroundImage: "url('/new-background.jpg')", // ✅ Make sure this path is correct
      }}
    >
      {/* Hero Text Section */}
      <div className="relative z-10 flex items-center justify-start h-full px-10 pt-24">
        <div className="max-w-2xl">
          {/* Heading */}
          <h1
            className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-[#1f4e79]"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            Manage Your Entire<br />
            Tabular Data at One Place
          </h1>

          {/* Subheading */}
          <p className="text-2xl md:text-3xl font-medium text-[#4a4a4a]">
            One platform to clean and unify<br />
            your tabular data — smarter than ever
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
