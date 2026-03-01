const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    default: "",
    trim: true,
  },
  lastName: {
    type: String,
    default: "",
    trim: true,
  },
  dob: {
    type: String, // Format: YYYY-MM-DD
    default: "",
  },
  phone: {
    type: String,
    default: "",
  },
  countryCode: {
    type: String,
    default: "+91",
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other", "Prefer not to say", ""],
    default: "",
  },
  city: {
    type: String,
    default: "",
  },
  state: {
    type: String,
    default: "",
  },
  postcode: {
    type: String,
    default: "",
  },
  country: {
    type: String,
    default: "",
  },
  photo_url: {
    type: String,
    default: "",
  },
  isComplete: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  this.updatedAt = new Date();
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password helper
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
