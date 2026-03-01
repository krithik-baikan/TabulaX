import React, { useState } from "react";

const TestForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    phone: "",
    dob: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      // Allow only digits, max 10 characters
      if (/^\d{0,10}$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">🧪 Test Editable Form</h2>

      <label className="block mb-2 font-medium">First Name:</label>
      <input
        type="text"
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        className="w-full mb-4 border px-3 py-2 rounded"
        placeholder="Type your name"
      />

      <label className="block mb-2 font-medium">Phone Number:</label>
      <input
        type="text"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        inputMode="numeric"
        className="w-full mb-4 border px-3 py-2 rounded"
        placeholder="Only numbers, max 10 digits"
      />

      <label className="block mb-2 font-medium">Date of Birth:</label>
      <input
        type="date"
        name="dob"
        value={formData.dob}
        onChange={handleChange}
        className="w-full mb-4 border px-3 py-2 rounded"
      />

      <p className="mt-4 text-gray-600">
        <strong>Current State:</strong><br />
        {JSON.stringify(formData, null, 2)}
      </p>
    </div>
  );
};

export default TestForm;
