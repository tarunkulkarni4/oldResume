const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load Environment Variables if running with a .env file later
dotenv.config();

const app = express();

// VERY IMPORTANT: Allows our local index.html to communicate with this backend securely
app.use(cors());

// Configure Express to process large PDF base64 strings securely without throwing "payload too large" errors
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ==========================================
// ⚠️ PASTE YOUR MONGODB INSTANCE URI HERE
// Example: mongodb+srv://admin:password123@cluster0.abcde.mongodb.net/resume_vault
// ==========================================
const MONGODB_URI = "mongodb+srv://kulakarnik273_db_user:ipBtykR7jEYT6rDR@cluster0.g4sbkpe.mongodb.net/resume_vault";

mongoose.connect(MONGODB_URI)
    .then(() => console.log("✅ Successfully connected to MongoDB Atlas!"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// Database Architecture Schema
const resumeSchema = new mongoose.Schema({
    name: String,
    type: String, // PDF, DOCX, DOC
    size: Number,
    base64: String, // The actual raw compressed file
    createdDate: String,
    uploadedDate: String
});

// Build the Mongoose Model
const Resume = mongoose.model("Resume", resumeSchema);

// -----------------------------------------------------------------
// API ENDPOINTS
// -----------------------------------------------------------------

// Retrieve All Resumes (Chronological matching the dashboard UI)
app.get("/resumes", async (req, res) => {
    try {
        const data = await Resume.find().sort({ createdDate: -1 });
        
        // Map the _id format nicely to standard id for our frontend code
        const formattedData = data.map(doc => ({
            id: doc._id.toString(),
            name: doc.name,
            type: doc.type,
            size: doc.size,
            base64: doc.base64,
            createdDate: doc.createdDate,
            uploadedDate: doc.uploadedDate
        }));
        
        res.json({ success: true, count: data.length, data: formattedData });
    } catch (error) {
        console.error("GET Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload a new Resume Document
app.post("/upload", async (req, res) => {
    try {
        const { name, type, size, base64, createdDate, uploadedDate } = req.body;

        const newResume = new Resume({
            name,
            type,
            size,
            base64,
            createdDate,
            uploadedDate
        });

        const saved = await newResume.save();
        res.json({ success: true, id: saved._id });
        console.log(`Uploaded successfully: ${name}`);
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete an existing Resume Document
app.delete("/resumes/:id", async (req, res) => {
    try {
        await Resume.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Deleted successfully" });
        console.log(`Deleted Document ID: ${req.params.id}`);
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Boot up the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
=============================================
🚀 RESUME VAULT BACKEND IS RUNNING 🚀
=============================================
Listening freely on port ${PORT}
Make sure MONGODB_URI is properly pasted above!
=============================================
`);
});
