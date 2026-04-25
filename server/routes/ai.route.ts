// server/routes/ai.route.ts
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

router.post("/ai", async (req, res) => {
    try {
        const { systemPrompt, userPrompt } = req.body;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
        });

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: `${systemPrompt}\n\n${userPrompt}` }
                    ],
                },
            ],
        });

        const response = await result.response;
        const text = response.text();

        res.json({ content: text });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

export default router;