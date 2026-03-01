require("dotenv").config({ path: "../.env" });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const runPipeline = require("./pipeline/pipelineRunner");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const File = require("./models/File");

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "tabulax_jwt_secret_2026";


const app = express();

// ✅ Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json({ limit: "5mb" }));

// ✅ Static folder to serve files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Multer setup: save files to disk
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Save with original name
  },
});
const upload = multer({ storage });

// ✅ MongoDB connect
mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("⚠️ MongoDB connection failed — server will continue without DB");
    console.error(err.message);
  });

// ✅ Test route
app.get("/ping", (req, res) => {
  res.send("🟢 Server is alive");
});

// ============================================
// ✅ JWT Authentication Routes
// ============================================

// POST /api/signup
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const uid = new mongoose.Types.ObjectId().toString();
    const user = new User({ uid, email: email.toLowerCase(), password });
    await user.save();

    const token = jwt.sign({ uid: user.uid, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({
      token,
      user: { uid: user.uid, email: user.email, firstName: user.firstName, lastName: user.lastName },
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    return res.status(500).json({ error: "Signup failed" });
  }
});

// POST /api/login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ uid: user.uid, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: { uid: user.uid, email: user.email, firstName: user.firstName, lastName: user.lastName },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/me — verify token and return user data
app.get("/api/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ uid: decoded.uid }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

// POST /api/change-password
app.post("/api/change-password", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ uid: decoded.uid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new passwords are required" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update password" });
  }
});

// ✅ Profile Routes
app.get("/api/get-profile/:uid", async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    return res.json(user || null);
  } catch (err) {
    console.error("get-profile error:", err.message);
    return res.status(500).json({ error: "DB read failed" });
  }
});

app.post("/api/save-profile", async (req, res) => {
  const { uid, ...data } = req.body;
  if (!uid) return res.status(400).json({ error: "Missing UID" });

  const requiredFields = [
    "firstName", "lastName", "email", "dob", "phone",
    "city", "state", "country", "photo_url", "gender"
  ];
  const isComplete = requiredFields.every((field) => !!data[field]);

  try {
    const updated = await User.findOneAndUpdate(
      { uid },
      { ...data, isComplete },
      { upsert: true, new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error("Error saving profile:", err.message);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

// ✅ Upload Files (Save to disk + MongoDB)
// ✅ Route: Upload files and save metadata to MongoDB
app.post("/api/upload-files", upload.array("files", 5), async (req, res) => {
  console.log("📥 /api/upload-files HIT");

  const userEmail = req.body.userEmail;
  if (!userEmail) return res.status(400).json({ error: "Missing userEmail" });

  try {
    const uploaded = await Promise.all(
      req.files.map((file) =>
        File.create({
          originalName: file.originalname,
          fileType: file.mimetype,
          size: file.size,
          userEmail, // ✅ store with user
        })
      )
    );

    return res.json({ message: "Files passed to MongoDB", uploaded });
  } catch (err) {
    console.error("❌ Upload failed:", err.message);
    res.status(500).json({ error: "Upload failed" });
  }
});



// ✅ Get all uploaded files
app.get("/api/get-user-files/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const files = await File.find({ userEmail: email }).sort({ uploadDate: -1 });
    res.json(files);
  } catch (err) {
    console.error("❌ Failed to fetch files:", err.message);
    res.status(500).json({ error: "Could not get user files" });
  }
});


// ✅ Download file by name
app.get("/api/download-file/:name", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.name);
  res.download(filePath, (err) => {
    if (err) {
      console.error("❌ Download error:", err.message);
      res.status(404).send("File not found");
    }
  });
});

// ✅ Delete file by ID
// ✅ Route: Delete file by filename and userEmail
app.delete("/api/delete-file/:filename", async (req, res) => {
  const { filename } = req.params;
  const { userEmail } = req.query;

  if (!userEmail || !filename) {
    return res.status(400).json({ error: "Missing email or filename" });
  }

  try {
    const result = await File.findOneAndDelete({
      originalName: filename,
      userEmail
    });

    if (!result) {
      return res.status(404).json({ error: "File not found or not owned by user" });
    }

    return res.json({ message: "File deleted" });
  } catch (err) {
    console.error("❌ Delete error:", err.message);
    return res.status(500).json({ error: "Server error during delete" });
  }
});



// ============================================
// ✅ TabulaX Pipeline Routes (replaces Flask)
// ============================================

const BACKEND_DIR = path.resolve(__dirname, "..", "..", "backend");

const PIPELINE_FOLDERS = [
  "datasets/converted_csv_files",
  "datasets/cleaned_csv_files",
  "datasets/jsonl_inputs",
  "datasets/final_feature_extracted_files",
  "datasets/feature_extracted_files",
  "datasets/merged_outputs",
  "datasets/final_cleaned_files",
  "datasets/jsonl_outputs",
  "datasets/zip_file",
];

// POST /start-integration
app.post("/start-integration", async (req, res) => {
  try {
    const data = req.body;

    console.log("\n==============================");
    console.log(" Incoming Integration Request");
    console.log("==============================");
    console.log(data);

    const outputFormats = data.outputFormats || ["csv"];
    const selectedFormat = outputFormats[0] ? outputFormats[0].toLowerCase() : "csv";
    const featureEnabled = data.featureExtractionEnabled !== false;

    console.log(`>> Output format selected: ${selectedFormat}`);
    console.log(`>> Feature Extraction Enabled: ${featureEnabled}`);

    await runPipeline(selectedFormat, featureEnabled);

    console.log(" TabulaX Pipeline completed.");
    return res.json({ status: "completed" });
  } catch (err) {
    console.error(" Exception occurred during integration:");
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /download/latest.zip
app.get("/download/latest.zip", (req, res) => {
  const zipPath = path.join(BACKEND_DIR, "datasets", "zip_file", "final_output.zip");
  if (fs.existsSync(zipPath)) {
    return res.download(zipPath);
  }
  return res.status(404).json({ error: "Zip file not found" });
});

// POST /force-reset
app.post("/force-reset", (req, res) => {
  for (const folder of PIPELINE_FOLDERS) {
    const fullPath = path.join(BACKEND_DIR, folder);
    if (!fs.existsSync(fullPath)) continue;
    for (const f of fs.readdirSync(fullPath)) {
      const filePath = path.join(fullPath, f);
      if (fs.statSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  }
  return res.json({ status: "reset" });
});

// ✅ Start server
app.listen(PORT, () =>
  console.log(`✅ Server running → http://localhost:${PORT}`)
);

