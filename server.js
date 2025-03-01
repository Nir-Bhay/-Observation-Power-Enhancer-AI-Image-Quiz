require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON bodies
app.use(express.json());

// Google Gemini AI API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Image Path (Directly from Folder)
const IMAGE_FOLDER = path.join(__dirname, "images"); // Folder where images are stored

// Converts local file information to base64
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

// Route: Process Image from File
app.get("/process-image", async (req, res) => {
    try {
        const imageName = "test.jpg"; // Change this to your image file name
        const imagePath = path.join(IMAGE_FOLDER, imageName);

        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ error: "Image not found in folder" });
        }

        // Convert Image to Base64
        const imagePart = fileToGenerativePart(imagePath, "image/jpeg");

        // Define the prompt
        const prompt = "Analyze the given image and identify all the small, specific objects, elements, or patterns present. Based on the detected elements, generate 4 detailed and challenging questions that test a person's ability to observe and recall specific details about the image. The questions should focus on less obvious details that require careful observation.";

        // Get the model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Generate content
        const generatedContent = await model.generateContent([prompt, imagePart]);

        // Extract response text
        const questions = generatedContent.response.text() || "No questions generated";

        const result = { image: imageName, questions };
        res.json(result);
        console.log(result);
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
