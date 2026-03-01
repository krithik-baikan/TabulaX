// src/components/UploadedFiles.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaDownload, FaTrash, FaFilePdf, FaFileCsv, FaFileCode } from "react-icons/fa";

export default function UploadedFiles({ profile }) {
  const [userFiles, setUserFiles] = useState([]);

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/get-user-files/${profile.email}`);
      setUserFiles(res.data || []);
    } catch (err) {
      console.error("❌ Failed to fetch uploaded files:", err.message);
    }
  };

  useEffect(() => {
    if (profile?.email) {
      fetchFiles();
    }
  }, [profile]);

  const downloadFile = async (fileName) => {
    try {
      const res = await axios.get(`http://localhost:4000/api/download-file/${fileName}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("❌ Download failed:", err.message);
      alert("Download failed");
    }
  };

  const deleteFile = async (fileName) => {
    try {
      await axios.delete(`http://localhost:4000/api/delete-file/${fileName}`);
      alert("File deleted");
      fetchFiles(); // Refresh list
    } catch (err) {
      console.error("❌ Delete failed:", err.message);
      alert("Delete failed");
    }
  };

  const getIcon = (type) => {
    if (type.includes("pdf")) return <FaFilePdf className="text-red-600 text-4xl" />;
    if (type.includes("csv")) return <FaFileCsv className="text-green-600 text-4xl" />;
    if (type.includes("json")) return <FaFileCode className="text-yellow-600 text-4xl" />;
    return <FaFileCode className="text-gray-600 text-4xl" />;
  };

  return (
    <div>
      <h3 className="text-xl font-semibold">Manage your uploaded files</h3>
      <hr className="my-4 border-t border-gray-300" />

      {userFiles.length === 0 ? (
        <p className="text-gray-500 mt-4">No files uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {userFiles.map((file) => (
            <div
              key={file._id}
              className="bg-white shadow rounded-lg p-4 flex flex-col items-center text-center border"
            >
              {getIcon(file.fileType)}
              <h4 className="mt-2 font-semibold text-sm break-words">{file.originalName}</h4>
              <p className="text-xs text-gray-600 mt-1">
                {file.fileType}, {(file.size / 1024).toFixed(1)} KB
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Uploaded: {new Date(file.uploadDate).toLocaleString()}
              </p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => downloadFile(file.originalName)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <FaDownload /> Download
                </button>
                <button

  onClick={async () => {
    try {
      const confirmed = window.confirm(`Delete ${file.originalName}?`);
      if (!confirmed) return;

      await axios.delete(`http://localhost:4000/api/delete-file/${file.originalName}`, {
        params: {
          userEmail: profile?.email,
        },
      });

      alert("File deleted.");
      fetchFiles();
    } catch (err) {
      console.error("❌ Delete failed:", err.message);
      alert("❌ Delete failed");
    }
  }}
  className="text-red-600 hover:text-red-800 ml-4 text-sm flex items-center gap-1"
>
  <FaTrash className="text-base" />
  <span>Delete</span>
</button>


              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
