const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5001; // Make sure this port is not already in use.

//middleware
app.use(express.json()); // Parses JSON bodies
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies

// AWS S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Multer S3 Storage Setup
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME, // Your S3 bucket name
    acl: "public-read", // Allow public access to uploaded images
    contentType: multerS3.AUTO_CONTENT_TYPE, // Set correct MIME type
    key: function (req, file, cb) {
      const folder = req.body.folder || "default";
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const fileName = `${folder}/${uniqueSuffix}${path.extname(file.originalname)}`;
      cb(null, fileName);
    },
  }),
});

// API to get images
// Function to Fetch Image and Text Files from S3
const getS3Files = async () => {
  try {
    const params = { Bucket: S3_BUCKET, Prefix: BASE_FOLDER };
    const data = await s3.listObjectsV2(params).promise();

    const images = [];
    const textFiles = {};

    // Organize Files by Folder
    for (const item of data.Contents) {
      const key = item.Key;
      const folder = key.split("/")[1];

      if (key.endsWith(".jpg") || key.endsWith(".png")) {
        images.push({ path: key, folder });
      } else if (key.endsWith(".txt")) {
        if (!textFiles[folder]) textFiles[folder] = {};
        textFiles[folder][path.basename(key, ".txt")] = key;
      }
    }

    // Fetch Text File Contents from S3
    for (const folder in textFiles) {
      for (const type in textFiles[folder]) {
        const textKey = textFiles[folder][type];
        const textData = await s3.getObject({ Bucket: S3_BUCKET, Key: textKey }).promise();
        textFiles[folder][type] = textData.Body.toString("utf-8").trim();
      }
    }

    // Attach Metadata to Images
    return images.map((img) => ({
      path: `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${img.path}`,
      folder: img.folder,
      definition: textFiles[img.folder]?.definition || "No definition available",
      practice: textFiles[img.folder]?.practice || "No practice available",
      description: textFiles[img.folder]?.description || "No description available",
    }));
  } catch (error) {
    console.error("Error fetching S3 files:", error);
    return [];
  }
};

// API to Get Images and Descriptions from S3
app.get("/api/images", async (req, res) => {
  const images = await getS3Files();
  res.setHeader("Content-Type", "application/json");
  res.json(images);
});

// API to get images (Fetching image paths from S3)
app.get("/api/images", async (req, res) => {
  try {
    const params = { Bucket: process.env.S3_BUCKET_NAME };
    const s3Data = await s3.listObjectsV2(params).promise();
    
    const images = s3Data.Contents.map((item) => ({
      path: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`,
      folder: path.dirname(item.Key),
    }));

    res.setHeader("Content-Type", "application/json");
    res.json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

// API to upload an image
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = req.file.location; // S3 URL of the uploaded file

  res.json({
    success: true,
    path: fileUrl,
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
