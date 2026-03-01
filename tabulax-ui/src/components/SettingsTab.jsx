// src/components/SettingsTab.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaMars, FaVenus, FaTransgender, FaRegQuestionCircle, FaPencilAlt
} from "react-icons/fa";

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
];

const Field = ({ label, name, value, onChange, readOnly = false, type = "text", max }) => (
  <div>
    <label className="block font-medium mb-1">{label}</label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      max={max}
      className={`w-full border rounded px-3 py-2 ${readOnly ? "bg-gray-100" : "border-gray-300"}`}
      autoComplete="off"
    />
  </div>
);

export default function SettingsTab({ profile, draft, setDraft, setProfile, user, logout, setProfileComplete }) {
  const [editable, setEditable] = useState(false);
  const [dobError, setDobError] = useState("");
  const [activeSection, setActiveSection] = useState("info");
  const [login, setLogin] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");

  const handlePasswordUpdate = async () => {
    setLoginError(""); setLoginSuccess("");

    if (login.newPassword !== login.confirmPassword) {
      setLoginError("❌ Passwords do not match.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:4000/api/change-password", {
        currentPassword: login.currentPassword,
        newPassword: login.newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoginSuccess("✅ Password updated successfully.");
      setLogin({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setLoginError("❌ " + (err.response?.data?.error || err.message));
    }
  };




  useEffect(() => {
    if (profile && profile.email && !profile.email.includes("@") && user?.email) {
      setDraft((prev) => ({ ...prev, email: user.email }));
      setProfile((prev) => ({ ...prev, email: user.email }));
    }
  }, [profile, user]);

  const isProfileComplete = (data) => {
    const required = ["firstName", "lastName", "dob", "gender", "email", "phone", "city", "state", "postcode", "country"];
    return required.every((k) => !!data?.[k]);
  };

  const handleDraft = (e) => {
    const { name, value } = e.target;

    if (name === "phone" && !/^\d{0,10}$/.test(value)) return;
    if (name === "postcode" && !/^\d{0,6}$/.test(value)) return;
    if (["city", "state", "country"].includes(name) && /\d/.test(value)) return;

    if (name === "dob") {
      const selected = new Date(value);
      const today = new Date();
      if (selected > today) {
        setDobError("❌ DOB cannot be in the future.");
      } else if (selected.getFullYear() < 1900) {
        setDobError("❌ DOB is too far in the past.");
      } else {
        setDobError("");
      }
    }

    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async () => {
    if (!user || dobError || !draft.dob) return;
    try {
      const payload = { ...draft, uid: user.uid };
      const { data } = await axios.post("http://localhost:4000/api/save-profile", payload);
      setProfile(data);
      setEditable(false);
      if (isProfileComplete(data)) {
        setProfileComplete(true);
      }
    } catch (err) {
      console.error("Save error:", err.message);
    }
  };

  const changePic = async (e) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setDraft((prev) => ({ ...prev, photo_url: base64 }));
      setProfile((prev) => ({ ...prev, photo_url: base64 }));
      if (user?.uid) {
        try {
          const payload = { uid: user.uid, photo_url: base64 };
          const { data } = await axios.post("http://localhost:4000/api/save-profile", payload);
          setProfile(data);
        } catch (err) {
          console.error("Photo update failed:", err.message);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const startEdit = () => {
    setEditable(true);
    setDraft(profile);
  };

  const getValue = (key) => editable ? draft?.[key] : profile?.[key];

  return (
    <>
      <div className="flex gap-6 w-full max-w-6xl mx-auto mt-6 px-4 overflow-hidden">
        {/* Left Box */}
        <div className="w-1/3 bg-white p-6 rounded-lg shadow-md text-center">
          <div className="relative inline-block">
            <img
              src={draft?.photo_url || profile?.photo_url || "https://via.placeholder.com/150"}
              alt="Profile"
              className="w-40 h-40 rounded-full object-cover"
            />
            <label className="absolute bottom-2 right-2 bg-white p-1 rounded-full shadow cursor-pointer">
              <FaPencilAlt className="text-black text-sm" />
              <input type="file" accept="image/*" onChange={changePic} className="hidden" />
            </label>
          </div>
          <h2 className="mt-3 text-xl font-semibold">{profile?.firstName || ""} {profile?.lastName || ""}</h2>

          {/* Section Switch Buttons */}
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={() => setActiveSection("info")}
              className={`px-4 py-2 rounded-md shadow font-medium text-white bg-gradient-to-r from-[#1f4e79] to-[#0a2a43] hover:opacity-90`}
            >
              Personal Information
            </button>
            <button
              onClick={() => setActiveSection("login")}
              className={`px-4 py-2 rounded-md shadow font-medium text-white bg-gradient-to-r from-[#1f4e79] to-[#0a2a43] hover:opacity-90`}
            >
              Login & Password
            </button>
          </div>
        </div>

        {/* Right Box */}
        <div className="w-2/3 bg-white p-6 rounded-lg shadow-md overflow-hidden">
          {activeSection === "info" && (
            <>
              <h3 className="text-2xl font-semibold text-[#0a2a43] mb-4">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
                <Field label="First Name" name="firstName" value={getValue("firstName")} onChange={handleDraft} readOnly={!editable} />
                <Field label="Last Name" name="lastName" value={getValue("lastName")} onChange={handleDraft} readOnly={!editable} />

                {/* DOB + Gender */}
                <div className="col-span-2 md:grid md:grid-cols-2 gap-4">
                  <div>
                    <Field
                      label="Date of Birth"
                      name="dob"
                      type="date"
                      value={getValue("dob") || ""}
                      onChange={handleDraft}
                      readOnly={!editable}
                      max={new Date().toISOString().split("T")[0]}
                    />
                    <p className="text-red-500 text-sm min-h-[1rem]">{dobError || "\u00A0"}</p>
                  </div>

                  <div>
                    <label className="font-medium mb-2 block">Gender</label>
                    <div className="flex justify-between items-center gap-2">
                      {["male", "female", "other", "notsay"].map((key, index) => {
                        const icons = [FaMars, FaVenus, FaTransgender, FaRegQuestionCircle];
                        const labels = ["Male", "Female", "Other", "Don't want to say"];
                        const Icon = icons[index];
                        const selected = getValue("gender") === key;
                        return (
                          <label key={key} className="flex flex-col items-center text-center cursor-pointer w-1/4">
                            <input
                              type="radio"
                              name="gender"
                              value={key}
                              className="hidden"
                              checked={selected}
                              onChange={handleDraft}
                              disabled={!editable}
                            />
                            <div className={`w-9 h-9 flex items-center justify-center rounded-full border ${selected ? "bg-gray-200" : "bg-white"}`}>
                              <span className="text-base"><Icon /></span>
                            </div>
                            <span className="mt-1 text-xs">{labels[index]}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-medium mb-1">Phone</label>
                  <div className="flex gap-2">
                    {editable ? (
                      <select
                        name="countryCode"
                        value={getValue("countryCode")}
                        onChange={handleDraft}
                        className="border border-gray-300 rounded px-2"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="min-w-[70px] border border-gray-300 rounded px-2 bg-gray-100 flex items-center">
                        {getValue("countryCode")}
                      </span>
                    )}
                    <input
                      name="phone"
                      value={getValue("phone")}
                      onChange={handleDraft}
                      readOnly={!editable}
                      className="flex-1 border border-gray-300 rounded px-3 py-2"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <Field label="Email" name="email" value={getValue("email")} onChange={handleDraft} readOnly type="email" />
                <Field label="City" name="city" value={getValue("city")} onChange={handleDraft} readOnly={!editable} />
                <Field label="State" name="state" value={getValue("state")} onChange={handleDraft} readOnly={!editable} />
                <Field label="Postcode" name="postcode" value={getValue("postcode")} onChange={handleDraft} readOnly={!editable} />
                <Field label="Country" name="country" value={getValue("country")} onChange={handleDraft} readOnly={!editable} />
              </div>

              {/* Buttons */}
              <div className="mt-8 flex justify-between gap-4">
                {editable ? (
                  <>
                    <button
                      onClick={() => {
                        setEditable(false);
                        setDraft(profile);
                      }}
                      className="px-6 py-2 rounded-md text-white bg-gray-500 hover:bg-gray-600 shadow transition-all duration-300"
                    >
                      Discard Changes
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={!!dobError || !draft.dob}
                      className={`px-6 py-2 rounded shadow text-white font-semibold ${dobError || !draft.dob ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"}`}
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEdit}
                    className="ml-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded shadow"
                  >
                    Edit
                  </button>
                )}
              </div>
            </>
          )}

          {activeSection === "login" && (
            <div>
              <h3 className="text-2xl font-semibold text-[#0a2a43] mb-4">Login & Password</h3>
              <div className="flex flex-col gap-4 mt-4 max-w-md">
                <Field
                  label="Email"
                  name="email"
                  value={user?.email || ""}
                  onChange={() => { }}
                  readOnly
                  type="email"
                />
                <Field
                  label="Current Password"
                  name="currentPassword"
                  value={login.currentPassword}
                  onChange={(e) => setLogin({ ...login, currentPassword: e.target.value })}
                  type="password"
                />
                <Field
                  label="New Password"
                  name="newPassword"
                  value={login.newPassword}
                  onChange={(e) => setLogin({ ...login, newPassword: e.target.value })}
                  type="password"
                />
                <Field
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={login.confirmPassword}
                  onChange={(e) => setLogin({ ...login, confirmPassword: e.target.value })}
                  type="password"
                />

                {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
                {loginSuccess && <p className="text-green-600 text-sm">{loginSuccess}</p>}

                <div className="flex gap-4">
                  <button
                    onClick={handlePasswordUpdate}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded shadow"
                  >
                    Update Password
                  </button>
                  <button
                    onClick={sendResetLink}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded shadow"
                  >
                    Forgot Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </div> {/* Right Box */}
      </div>   {/* Flex Container */}
    </>
  );
}
