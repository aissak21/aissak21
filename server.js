const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5001; // Make sure this port is not already in use.

//middleware
app.use(express.json()); // Parses JSON bodies
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = req.body.folder || "default";
    const uploadPath = path.join(__dirname, "public/kaleidoscope", folder);
    console.log("Uploading to folder:", req.body);  // Check folder path
    try {
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
    } catch (error) {
      console.error("Error creating directory:", error);
      return cb(error, null);
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage: storage });

// API to get images
app.get("/api/images", (req, res) => {
  const baseDir = path.join(__dirname, "public/kaleidoscope");
  const images = [];

  fs.readdirSync(baseDir).forEach((folder) => {
    if (folder === '.DS_Store') return;
    const folderPath = path.join(baseDir, folder);
    if (fs.statSync(folderPath).isDirectory()) {

      // Default values
      let definiton = "No description available!";
      let practice = "No prompt available!";
      let description = "no description available!";

      // Check for definintino.txt
      const definitionPath = path.join(folderPath, "definition.txt");
      if (fs.existsSync(definitionPath)) {
        try {
          definiton = fs.readFileSync(definitionPath, "utf-8").trim() || definiton;
        } catch (err) {
          console.error(`Error reading description.txt in ${folder}:`, err);
        }
      }

      // Check for practice.txt
      const practicePath = path.join(folderPath, "practice.txt");
      if (fs.existsSync(practicePath)) {
        try {
          practice = fs.readFileSync(practicePath, "utf-8").trim() || practice;
        } catch (err) {
          console.error(`Error reading prompt.txt in ${folder}:`, err);
        }
      }

      // Check for description.txt
      const descriptionPath = path.join(folderPath, "description.txt");
      if (fs.existsSync(descriptionPath)) {
        try {
          description = fs.readFileSync(descriptionPath, "utf-8").trim() || description;
        } catch (err) {
          console.error(`Error reading description.txt in ${folder}:`, err);
        }
      }

      fs.readdirSync(folderPath).forEach((file) => {
        const fileExt = path.extname(file).toLowerCase();
        if (fileExt === ".jpg" || fileExt === ".png") {
          images.push({ path: `kaleidoscope/${folder}/${file}`, folder, definiton, practice, description});
        }
      });
    }
    else
    {
        return res.status(400).json({ error: "No file present or found", path: baseDir,
        folders: folderPath
         });
    }
  });

  res.setHeader("Content-Type", "application/json");
  res.json(images);
});

// API to upload an image
app.post("/api/upload", upload.single("image"), (req, res) => {
  console.log("Folder received:", req.body.folder); // Debugging log
  console.log("Uploaded File:", req.file);

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  res.json({
    success: true,
    path: `/kaleidoscope/${req.body.folder}/${req.file.filename}`,
    folder: req.body.folder,
  });
});

// Serve the React frontend after building it
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname + "/build/index.html")); // Load React App
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
