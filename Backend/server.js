const express = require("express");
const multer = require("multer");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const FileType = require("file-type");
const sharp = require("sharp");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

/* =======================
   ✅ CORS — FINAL & FIXED
   ======================= */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

/* =======================
   ✅ BODY PARSERS
   ======================= */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* =======================
   ✅ MONGODB CONNECTION
   ======================= */
async function connectDB() {
  if (!process.env.MONGODB_URI) {
    console.warn("⚠️ MONGODB_URI not set");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "Gadgety",
      serverSelectionTimeoutMS: 10000
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
}

connectDB();

/* =======================
   ✅ MONGOOSE MODEL
   ======================= */
const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: String,
  discountedPrice: String,
  date: String,
  image: String,
  url: String,
  category: [String],
  additionalImages: [String]
});

const Project = mongoose.model("Project", projectSchema);

/* =======================
   ✅ STATIC FILES
   ======================= */
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* =======================
   ✅ IMAGE UPLOAD SETUP
   ======================= */
const storage = multer.memoryStorage();
const upload = multer({ storage });

async function reencodeImage(file) {
  const type = await FileType.fromBuffer(file.buffer);
  if (!type || !["image/jpeg", "image/png"].includes(type.mime)) {
    return sharp(file.buffer).png().toBuffer();
  }
  return file.buffer;
}

async function uploadToImgBB(file) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) throw new Error("IMGBB_API_KEY missing");

  const buffer = await reencodeImage(file);
  const base64 = buffer.toString("base64");

  const res = await axios.post(
    `https://api.imgbb.com/1/upload?key=${apiKey}`,
    new URLSearchParams({ image: base64 }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  return res.data.data.url;
}

/* =======================
   ✅ UPLOAD PROJECT
   ======================= */
app.post("/upload", upload.array("images"), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const slug = req.body.title.toLowerCase().replace(/\s+/g, "-");

    const images = [];
    for (const file of req.files) {
      images.push(await uploadToImgBB(file));
    }

    const project = new Project({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      discountedPrice: req.body.discPrice,
      date: today,
      image: images[0],
      additionalImages: images.slice(1),
      url: slug,
      category: Array.isArray(req.body.category)
        ? req.body.category
        : [req.body.category]
    });

    await project.save();
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* =======================
   ✅ GET ALL PROJECTS
   ======================= */
app.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find().lean();
    res.json(
      projects.map(p => ({
        ...p,
        id: p._id.toString(),
        _id: undefined,
        __v: undefined
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =======================
   ✅ GET / UPDATE / DELETE
   ======================= */
app.get("/projects/:id", async (req, res) => {
  const p = await Project.findById(req.params.id);
  if (!p) return res.status(404).end();
  res.json(p);
});

app.put("/projects/:id", async (req, res) => {
  const p = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!p) return res.status(404).end();
  res.json(p);
});

app.delete("/projects/:id", async (req, res) => {
  const p = await Project.findByIdAndDelete(req.params.id);
  if (!p) return res.status(404).end();
  res.json({ success: true });
});

/* =======================
   ✅ EXPORT FOR VERCEL
   ======================= */
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
}
