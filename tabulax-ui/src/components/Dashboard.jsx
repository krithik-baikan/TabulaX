import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaUserCircle } from "react-icons/fa";
import SettingsTab from "./SettingsTab";
import HomeTab from "./HomeTab";
import FilesUpload from "./FilesUpload";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [menuOpen, setMenu] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadErr, setUploadErr] = useState("");
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [rel1, setRel1] = useState(false);
  const [rel2, setRel2] = useState(false);
  const [merge, setMerge] = useState(false);
  const [outFmt, setFmt] = useState(null);
  const [errorFiles, setErrorFiles] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [integrationRunning, setIntegrationRunning] = useState(false);

  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "🌅 Good Morning";
    if (hour < 17) return "🌞 Good Afternoon";
    if (hour < 20) return "🌇 Good Evening";
    return "🌙 Good Night";
  };

  const [time, setTime] = useState("");
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      setTime(`${h}:${m}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const [loading, setLoading] = useState(true);

  const isProfileComplete = (p) =>
    p?.firstName && p?.lastName && p?.dob && p?.gender &&
    p?.email && p?.city && p?.state && p?.country &&
    p?.postcode && p?.phone && p?.countryCode;

  // ✅ JWT Auth: check token on mount, redirect to login if invalid
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const { data } = await axios.get("http://localhost:4000/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("✅ User loaded:", data.email);
        setUser(data);
        setProfile(data);
        setDraft(data);
      } catch (err) {
        console.error("❌ Auth check failed:", err.response?.data || err.message);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [navigate]);




  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".profile-dropdown") && !e.target.closest(".profile-icon")) {
        setMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!profile?.email || tab !== "uploaded") return;
      try {
        const res = await axios.get(`http://localhost:4000/api/get-user-files/${profile.email}`);
        setFiles(res.data || []);
      } catch (err) {
        console.error("❌ Failed to load user files:", err.message);
      }
    };
    fetchFiles();
  }, [tab, profile?.email]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const addFiles = (e) => {
    const list = Array.from(e.target.files || []);
    const valid = [];
    for (const file of list) {
      if (file.size > 25 * 1024 * 1024) {
        setUploadErr("Max file size is 25MB.");
        return;
      }
      const ext = file.name.split(".").pop().toLowerCase();
      if (!["csv", "json", "pdf"].includes(ext)) {
        setUploadErr("Invalid file type.");
        return;
      }
      valid.push(file);
    }
    setUploadErr("");
    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (filename) => {
    setFiles((prev) => prev.filter((f) => f.name !== filename));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const startIntegration = async () => {
    if (!files.length || !outFmt || integrationRunning) return;

    setIntegrationRunning(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("userEmail", profile?.email);
    formData.append("all_related", rel1);
    formData.append("some_related", rel2);
    formData.append("merge", merge);
    formData.append("output_format", outFmt);

    try {
      await axios.post("http://localhost:4000/api/upload-files", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await axios.post("http://localhost:4000/start-integration", {
        outputFormats: [outFmt],
        featureExtractionEnabled: rel1, // ✅ This drives clean+feature output
      });


      // ✅ Trigger successful → prepare download
      setDownloadUrl("http://localhost:4000/download/latest.zip");
    } catch (err) {
      console.error("❌ Upload or integration failed:", err.response?.data || err.message);
      alert("❌ Upload or integration failed");
    } finally {
      setIntegrationRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f6fa]">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5f6fa]">
      <Sidebar tab={tab} setTab={setTab} onLogoutClick={logout} integrationRunning={integrationRunning} />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center border-b-2 border-gray-400 pb-4 mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Welcome {profile?.firstName || "User"} ✨
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-gray-800 font-semibold text-md">
              <span>{getGreeting()}</span>
              <span className="h-5 w-[1.5px] bg-gray-400 mx-2 rounded-sm"></span>
              <span>{time}</span>
            </div>
            <div className="relative">
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#1f4e79] cursor-pointer profile-icon"
                  onClick={() => setMenu(!menuOpen)} />
              ) : (
                <FaUserCircle className="text-3xl text-[#1f4e79] cursor-pointer profile-icon"
                  onClick={() => setMenu(!menuOpen)} />
              )}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg py-2 z-50 profile-dropdown">
                  <button onClick={() => { setTab("settings"); setMenu(false); }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100">Personal Info</button>
                  <button onClick={logout}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {tab === "home" && (
          <HomeTab
            files={files}
            setFiles={setFiles}
            uploadErr={uploadErr}
            setUploadErr={setUploadErr}
            rel1={rel1}
            rel2={rel2}
            merge={merge}
            outFmt={outFmt}
            addFiles={addFiles}
            removeFile={removeFile}
            clearAll={clearAll}
            setRel1={setRel1}
            setRel2={setRel2}
            setMerge={setMerge}
            setFmt={setFmt}
            startIntegration={startIntegration}
            setErrorFiles={setErrorFiles}
            downloadUrl={downloadUrl}
            errorFiles={errorFiles}
          />
        )}

        {tab === "uploaded" && <FilesUpload profile={profile} />}
        {tab === "settings" && (
          <SettingsTab
            profile={profile}
            draft={draft}
            setDraft={setDraft}
            setProfile={setProfile}
            user={user}
            logout={logout}
          />
        )}

        {integrationRunning && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]">
            <div className="bg-white p-6 rounded-md shadow-md text-center max-w-xs">
              <h3 className="text-lg font-semibold text-red-600 mb-2">⚠️ Do not close or reload</h3>
              <p className="text-sm text-gray-700">The system is processing your data. Leaving this page will cancel the operation.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
