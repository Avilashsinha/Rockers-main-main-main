import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

// ---- Cloudinary Configuration ----
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dwm9m3dwk",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---- Multer Memory Storage ----
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// ---- Local cache for demo / dev ----
global.appNotes = global.appNotes || [];

// ---- Core Upload Handler ----
export default async function handler(req, res) {
  // --- Basic CORS setup ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // Wrap multer middleware in a promise for async/await
  const runMulter = () =>
    new Promise((resolve, reject) => {
      upload.single("file")(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

  try {
    await runMulter();

    const { title, subject, desc } = req.body;
    if (!req.file || !title) {
      return res.status(400).json({ error: "File and title are required" });
    }

    // ---- Upload to Cloudinary ----
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "campusnotes/notes",
          resource_type: "auto", // ✅ handles pdf/image/video automatically
          public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
          use_filename: true,
          unique_filename: false,
          overwrite: false,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const note = {
      id: Date.now().toString(),
      title: title.trim(),
      subject: subject?.trim() || "",
      desc: desc?.trim() || "",
      fileName: req.file.originalname,
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      createdAt: new Date(),
    };

    global.appNotes.push(note);

    return res.status(201).json({
      message: "✅ File uploaded successfully!",
      file: note,
    });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    return res.status(500).json({
      error: "Upload failed",
      details: error.message,
    });
  }
}

// ---- Disable default Next.js body parsing ----
export const config = {
  api: {
    bodyParser: false,
  },
};
