require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Google Gemini AI API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Route: Process Image from File
app.post("/process-image", upload.single('image'), async (req, res) => {
    try {
        const imagePath = req.file.path;

        // Convert Image to Base64
        const imagePart = {
            inlineData: {
                data: Buffer.from(fs.readFileSync(imagePath)).toString("base64"),
                mimeType: req.file.mimetype
            }
        };

        // Define the prompt
        const prompt = `
            Analyze the given image and generate 4 detailed and challenging observation questions based on the image. 
            The questions should focus on less obvious details that require careful observation. 
            Ensure the questions are concise and require the observer to recall precise details like patterns, colors, positions, and the relationships between different objects within the image.
            Provide the questions in  English.
        `;

        // Get the model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Generate content
        const generatedContent = await model.generateContent([prompt, imagePart]);

        // Extract response text
        const questions = generatedContent.response.text() || "No questions generated";

        const result = { image: req.file.filename, questions: questions.split('\n').filter(q => q.trim() !== '') };
        res.json(result);
        console.log(result);

        // Clean up uploaded file
        fs.unlinkSync(imagePath);
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
});

// Route: Validate User Answers
app.post("/validate-answers", async (req, res) => {
    try {
        const { questions, userAnswers } = req.body;

        if (!questions || !userAnswers || questions.length !== userAnswers.length) {
            return res.status(400).json({ error: "Invalid input data" });
        }

        // Define the prompt for validation
        const validationPrompt = questions.map((question, index) => {
            return `Question: ${question}\nUser Answer: ${userAnswers[index]}\nIs the answer correct? Provide the correct answer and explanation if incorrect.`;
        }).join("\n\n");

        // Get the model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Generate validation content
        const validationContent = await model.generateContent([validationPrompt]);

        // Extract response text
        const validationResults = validationContent.response.text() || "No validation results generated";

        const result = { validationResults };
        res.json(result);
        console.log(result);
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
