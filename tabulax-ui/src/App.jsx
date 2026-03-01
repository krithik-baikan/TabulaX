import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HeroSection from "./components/HeroSection";
import About from "./components/About";
import Support from "./components/Support";

// Lazy load components that use firebase to avoid initialization issues
const Login = lazy(() => import("./components/Login"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const TestForm = lazy(() => import("./components/TestForm"));
const SignupPage = lazy(() => import("./components/SignupPage"));

const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
    </div>
);

const App = () => {
    return (
        <Router>
            <div className="w-full min-h-screen overflow-x-hidden m-0 p-0">
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Layout>
                                    <HeroSection />
                                </Layout>
                            }
                        />
                        <Route
                            path="/about"
                            element={
                                <Layout>
                                    <About />
                                </Layout>
                            }
                        />
                        <Route
                            path="/support"
                            element={
                                <Layout>
                                    <Support />
                                </Layout>
                            }
                        />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/test" element={<TestForm />} />
                    </Routes>
                </Suspense>
            </div>
        </Router>
    );
};

export default App;
