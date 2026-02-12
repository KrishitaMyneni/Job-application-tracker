require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

/* ================= USER MODEL ================= */

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

/* ================= JOB MODEL ================= */

const JobSchema = new mongoose.Schema({
  company: String,
  role: String,
  status: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Job = mongoose.model("Job", JobSchema);

/* ================= AUTH MIDDLEWARE ================= */

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token, unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* ================= ROUTES ================= */

app.get("/health", (req, res) => {
  res.send("backend is alive");
});

/* -------- REGISTER -------- */

app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------- LOGIN -------- */

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // 👇 NEW CLEAR MESSAGE
    if (!user) {
      return res.status(400).json({
        message: "Account not found. Please register first."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // 👇 NEW CLEAR MESSAGE
    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password."
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------- JOB ROUTES (PROTECTED) -------- */

app.get("/jobs", authMiddleware, async (req, res) => {
  const jobs = await Job.find({ userId: req.userId });
  res.json(jobs);
});

app.post("/jobs", authMiddleware, async (req, res) => {
  const newJob = new Job({
    company: req.body.company,
    role: req.body.role,
    status: req.body.status,
    userId: req.userId,
  });

  await newJob.save();
  res.json(newJob);
});

app.delete("/jobs/:id", authMiddleware, async (req, res) => {
  try {
    await Job.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/jobs/:id", authMiddleware, async (req, res) => {
  try {
    const updatedJob = await Job.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: req.body.status },
      { new: true }
    );

    res.json(updatedJob);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= SERVER ================= */

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
