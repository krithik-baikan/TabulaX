// src/components/HomeTab.js
import React, { useState } from "react";
import { FaTrash, FaDownload } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function HomeTab({
  files,
  uploadErr,
  setUploadErr,
  rel1,
  rel2,
  merge,
  outFmt,
  addFiles,
  removeFile,
  clearAll,
  setRel1,
  setRel2,
  setMerge,
  setFmt,
  startIntegration,
  downloadUrl,
  errorFiles,
  integrationRunning,
}) {
  const [date, setDate] = useState(new Date());
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-8">
        {/* LEFT SECTION */}
        <div className="flex-1 space-y-6">
          {/* Upload Section */}
          <div className="text-center flex flex-col items-center gap-2">
            <h3 className="text-2xl font-semibold mb-4">Upload Your Files</h3>
            <div className="flex gap-3">
              <label className="inline-block px-6 py-3 text-white font-medium rounded-md shadow cursor-pointer bg-gradient-to-r from-[#1f4e79] to-[#0a2a43] transition-all duration-300 hover:opacity-90">
                Choose Files
                <input type="file" multiple onChange={addFiles} className="hidden" />
              </label>
              {files.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm px-4 py-3 bg-red-500 text-white rounded-md shadow hover:bg-red-600 flex items-center gap-2"
                >
                  <FaTrash /> Clear All
                </button>
              )}
            </div>
            {uploadErr && <p className="text-red-600 text-sm mt-2">{uploadErr}</p>}
          </div>

          {/* Uploaded Files */}
          {files.length > 0 && (
            <div className="pl-4 font-semibold text-sm">
              <h4 className="mb-1">Uploaded Files:</h4>
              <ul className="list-disc ml-5 space-y-1">
                {files.map((f) => (
                  <li key={f.name} className="flex items-center gap-2">
                    {f.name}
                    <FaTrash
                      className="text-red-500 cursor-pointer hover:text-red-700"
                      onClick={() => removeFile(f.name)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload Notes */}
          <div className="pl-4">
            <p className="font-bold">Note:</p>
            <ul className="list-disc ml-5 text-sm text-gray-700">
              <li>Max 5 files total</li>
              <li>Max 25 MB each</li>
              <li>Accepted: CSV, JSON, PDF</li>
            </ul>
          </div>

          {/* Feature Extraction Selection */}
          <div>
            <h4 className="font-medium mb-1">
              Do You Want Feature Extracted Files:
              <span className="text-gray-500 text-xs ml-1">
                (If you want feature extracted files, change to Yes)
              </span>
            </h4>
            <div className="flex gap-4 pl-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={rel1}
                  onChange={() => {
                    setRel1(true);
                    setRel2(false);
                  }}
                  className="form-radio rounded-full"
                />
                Yes
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={rel2}
                  onChange={() => {
                    setRel2(true);
                    setRel1(false);
                  }}
                  className="form-radio rounded-full"
                />
                No
              </label>
            </div>
          </div>

          {/* Output Format */}
          <div>
            <h4 className="font-medium mb-1 mt-4">Choose output format:</h4>
            <div className="flex gap-4">
              {["csv", "json", "pdf"].map((fmt) => (
                <label key={fmt} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={outFmt === fmt}
                    onChange={() => setFmt(fmt)}
                    className="form-radio"
                  />
                  {fmt.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Start Integration Button */}
          <div className="text-center space-y-3">
            <button
              disabled={!outFmt || integrationRunning}
              onClick={startIntegration}
              className={`px-6 py-2 rounded-md text-white transition-all duration-300 ${
                !outFmt || integrationRunning
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#1f4e79] to-[#0a2a43] hover:opacity-90"
              }`}
              onMouseEnter={() => !outFmt && setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {integrationRunning ? "Processing..." : "Start Integration"}
            </button>
            {showTooltip && !outFmt && (
              <div className="text-xs text-gray-600">Please select output format</div>
            )}
          </div>
        </div>

        {/* RIGHT SECTION - Calendar + Downloads + Errors */}
        <div className="w-[300px] space-y-4">
          <Calendar onChange={setDate} value={date} className="rounded-lg shadow" />

          <div className="bg-white rounded-md shadow p-4">
            <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
              <FaDownload /> Download Your Files Here
            </h4>
            {downloadUrl ? (
              <a
                href={downloadUrl}
                download
                className="text-blue-700 underline text-sm"
              >
                Click here to download
              </a>
            ) : (
              <p className="text-sm text-gray-500">Nothing to download yet.</p>
            )}
          </div>

          {errorFiles?.length > 0 && (
            <div className="bg-white rounded-md shadow p-4">
              <h4 className="font-medium text-sm mb-1 text-red-600">❌ Files with Errors:</h4>
              <ul className="text-sm list-disc ml-4 text-gray-700">
                {errorFiles.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
