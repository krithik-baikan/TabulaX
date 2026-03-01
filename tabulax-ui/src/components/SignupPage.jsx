import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { data } = await axios.post("http://localhost:4000/api/signup", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      alert("Account created successfully ✅");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div
      className="relative min-h-screen w-full bg-no-repeat bg-cover bg-left bg-fixed"
      style={{
        backgroundImage: "url('/login-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "left center",
      }}
    >
      {/* ✅ Navbar */}
      <Navbar />

      {/* ✅ Signup Form Positioned Right but Moved Slightly Left */}
      <div className="relative z-10 flex items-center justify-end min-h-screen pt-24 px-6 pr-36">
        <div className="w-full max-w-md bg-white bg-opacity-100 rounded-2xl shadow-2xl p-8 animate-fadeIn">
          <div className="text-right text-sm mb-4">
            Already have an account?{" "}
            <span
              className="text-blue-600 hover:underline cursor-pointer font-semibold"
              onClick={() => navigate("/login")}
            >
              LOGIN
            </span>
          </div>

          <h2 className="text-2xl font-bold text-[#1f4e79] mb-2">
            Create your account
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Start your Smart Table Integration journey
          </p>

          {error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                placeholder="ngit@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <input
                type="password"
                placeholder="8+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#1f4e79] text-white py-2 rounded-md hover:bg-[#163b5b] transition"
            >
              Create Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
