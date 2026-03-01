const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  originalName: String,
  fileType: String,
  size: Number,
  userEmail: String, // ✅ NEW FIELD
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("File", fileSchema);
