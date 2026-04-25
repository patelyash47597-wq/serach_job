// hooks/useAI.ts
export type AIMode = "topic" | "quiz-explain" | "study-plan";

interface AIRequest {
    mode: AIMode;
    topic?: string;
    question?: string;
    userAnswer?: string;
    correctAnswer?: string;
    quizHistory?: { course: string; level: string; percent: number; date: string }[];
}

export async function askAI(req: AIRequest): Promise<string> {
    let systemPrompt = "";
    let userPrompt = "";

    if (req.mode === "topic") {
        systemPrompt = `You are an expert programming mentor on CareerPath platform. 
Explain topics clearly with:
- Simple language (beginner friendly)
- Real-world examples
- Code snippets where helpful (use markdown)
- Keep response under 300 words
- End with 1 practice tip`;

        userPrompt = `Explain this topic for a web development student: "${req.topic}"`;
    }

    else if (req.mode === "quiz-explain") {
        systemPrompt = `You are a supportive coding tutor on CareerPath.
When a student gets a quiz answer wrong:
- Don't make them feel bad
- Explain WHY the correct answer is right
- Explain WHY their answer was wrong
- Give a memory tip to remember it
- Use simple language, max 200 words`;

        userPrompt = `Quiz Question: "${req.question}"
Student answered: "${req.userAnswer}"
Correct answer: "${req.correctAnswer}"
Please explain why the correct answer is right and help them understand.`;
    }

    else if (req.mode === "study-plan") {
        systemPrompt = `You are a personalized learning coach on CareerPath platform.
Analyze quiz performance and create a study plan.
Format your response as JSON only, no extra text:
{
  "summary": "2 sentence performance summary",
  "strongTopics": ["topic1", "topic2"],
  "weakTopics": ["topic1", "topic2"],  
  "weeklyPlan": [
    { "day": "Monday", "task": "task description", "duration": "30 mins", "priority": "high" },
    ...7 days
  ],
  "tip": "one motivational personalized tip"
}`;

        userPrompt = `Student quiz history: ${JSON.stringify(req.quizHistory)}
Create a personalized 7-day study plan based on their performance.`;
    }

    const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, userPrompt }),
    });

    if (!response.ok) throw new Error("AI request failed");
    const data = await response.json();
    return data.content;
}