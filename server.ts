/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy-initialized Gemini Client
let aiInstance: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in your Secrets panel.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        timeout: 60000,
        headers: {
          'User-Agent': 'aistudio-build',
          'Connection': 'close',
        }
      }
    });
  }
  return aiInstance;
}

// Ensure the server doesn't crash on startup if API key is missing, failing gracefully only when endpoint is hit.
function handleApiError(res: express.Response, error: unknown, message: string) {
  console.error(`${message}:`, error);
  res.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : String(error),
    message: message
  });
}

// Robust wrapper for Gemini generateContent to handle transient timeouts/504 errors with retries and exponential backoff
async function generateContentWithRetry(
  prompt: string,
  config: any,
  model = "gemini-3.5-flash",
  retries = 3,
  delayMs = 1500
): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const ai = getGemini();
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: config
      });
      return response;
    } catch (error: any) {
      console.warn(`Gemini generation failed (attempt ${attempt}/${retries}):`, error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isTransient = 
        errorMessage.includes("DEADLINE_EXCEEDED") ||
        errorMessage.includes("504") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("fetch failed") ||
        error?.status === 504 ||
        error?.code === 504 ||
        (error?.error && (error.error.code === 504 || error.error.status === "DEADLINE_EXCEEDED"));

      if (attempt < retries && isTransient) {
        // Wait and then retry with backoff
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        continue;
      }
      throw error;
    }
  }
}

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. Parse Voice/Text Natural Language Commands
// Example command: "Add a high priority marketing task to write a blog post by next Wednesday, takes 3 hours"
app.post("/api/ai/parse-command", async (req, res) => {
  try {
    const { command, currentDate } = req.body;
    if (!command) {
      res.status(400).json({ success: false, error: "Command string is required." });
      return;
    }

    const ai = getGemini();
    const prompt = `
      You are an expert NLP assistant for a productivity planner.
      Current date is: ${currentDate || new Date().toISOString().split('T')[0]}
      
      Analyze the user's natural language command and extract task information:
      Command: "${command}"
      
      If dates are relative (like "tomorrow", "next Monday", "by Friday"), calculate the correct calendar date (YYYY-MM-DD) relative to current date.
      If a category isn't clear, select the most appropriate one from: 'Work', 'Personal', 'Health', 'Finance', 'Education', 'Social', 'Chores'.
      If priority isn't mentioned, infer it based on context or set to 'medium'.
      If estimated hours isn't clear, make a reasonable guess.
      Optionally break down the command into 2-4 subtasks if requested or if the task seems complex.
    `;

    const response = await generateContentWithRetry(prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Clear and concise title of the task." },
          description: { type: Type.STRING, description: "Detailed description of what to do." },
          category: { type: Type.STRING, description: "Category of the task." },
          deadline: { type: Type.STRING, description: "Target date in YYYY-MM-DD format." },
          priority: { type: Type.STRING, description: "Priority level: high, medium, or low." },
          estimatedHours: { type: Type.NUMBER, description: "Estimated completion effort in hours." },
          subtasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Extracted subtasks if the parent task contains sub-steps."
          }
        },
        required: ["title", "description", "category", "deadline", "priority", "estimatedHours"]
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json({ success: true, data: result });
  } catch (error) {
    handleApiError(res, error, "Failed to parse natural language task command");
  }
});

// 3. Intelligent Task Prioritization
app.post("/api/ai/prioritize-tasks", async (req, res) => {
  try {
    const { tasks, habits, currentDate } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
      res.status(400).json({ success: false, error: "Tasks list is required." });
      return;
    }

    const ai = getGemini();
    const prompt = `
      You are an AI Scheduling Assistant. Analyze the user's current tasks and habits to optimize priorities.
      Current date context: ${currentDate || new Date().toISOString().split('T')[0]}
      
      Tasks list: ${JSON.stringify(tasks)}
      Habits list: ${JSON.stringify(habits || [])}
      
      Tasks can be at risk of missing deadlines if they require many hours but are close to deadlines.
      Evaluate:
      1. Urgency vs Importance.
      2. Missing deadline probability.
      3. Focus hour constraints.
      
      Provide predictions for each task:
      - id: Match the corresponding task's ID.
      - aiPredictedPriority: 'high', 'medium', or 'low'.
      - aiPriorityReason: Short, compelling human-friendly explanation of why it was given this priority or why it is at risk.
      - aiPredictedHours: Your optimized estimate of actual effort required (may differ from user's manual estimate if too optimistic/pessimistic).
      - aiRiskLevel: 'high_risk' if deadline is extremely tight relative to remaining hours, 'on_track' if safe, 'normal' otherwise.
    `;

    const response = await generateContentWithRetry(prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "Original task ID." },
            aiPredictedPriority: { type: Type.STRING, description: "Recommended priority level: high, medium, low." },
            aiPriorityReason: { type: Type.STRING, description: "Brief explanation of this recommendation." },
            aiPredictedHours: { type: Type.NUMBER, description: "Predicted hours needed to complete." },
            aiRiskLevel: { type: Type.STRING, description: "Risk of missing deadline: high_risk, on_track, normal." }
          },
          required: ["id", "aiPredictedPriority", "aiPriorityReason", "aiPredictedHours", "aiRiskLevel"]
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    res.json({ success: true, data: result });
  } catch (error) {
    handleApiError(res, error, "Failed to analyze and prioritize tasks");
  }
});

// 4. Autonomous Planning Agent (Project breakdown)
app.post("/api/ai/generate-breakdown", async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      res.status(400).json({ success: false, error: "Task title is required." });
      return;
    }

    const ai = getGemini();
    const prompt = `
      You are an Autonomous Project Planning Agent.
      Break down the following major project or complex task into small, manageable, sequential subtasks (3 to 6 steps).
      
      Project: "${title}"
      Context: "${description || "No further context provided."}"
      
      For each subtask, estimate the time in minutes and provide a short actionable title.
    `;

    const response = await generateContentWithRetry(prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Subtask title." },
            estimatedMinutes: { type: Type.INTEGER, description: "Minutes estimated to finish this step." }
          },
          required: ["title", "estimatedMinutes"]
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    res.json({ success: true, data: result });
  } catch (error) {
    handleApiError(res, error, "Failed to generate project breakdown");
  }
});

// 5. Smart Calendar Schedule Generator
app.post("/api/ai/generate-agenda", async (req, res) => {
  try {
    const { tasks, date, availableHours } = req.body;
    const workDayHours = availableHours || 8;
    const ai = getGemini();

    const prompt = `
      You are a Smart Calendar Scheduler.
      Create an optimized daily agenda for the date ${date}.
      Available focus hours: ${workDayHours} hours.
      
      Current outstanding tasks: ${JSON.stringify(tasks || [])}
      
      Design a schedule starting from 09:00 with consecutive time blocks.
      You MUST allocate focus blocks for high-priority tasks first.
      Include standard breaks (e.g., lunch, short rest blocks) to prevent burnout.
      Keep slots structured (each slot has a start time, duration in minutes, type, and title).
      Types can be: 'focus' (working on task), 'meeting' (meetings if any, or prep), 'break' (resting), 'buffer' (admin/email review).
    `;

    const response = await generateContentWithRetry(prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING, description: "Start time (HH:MM format)." },
            taskId: { type: Type.STRING, description: "Associated task ID from inputs (null if none/break)." },
            type: { type: Type.STRING, description: "Type of slot: focus, meeting, break, buffer." },
            title: { type: Type.STRING, description: "Label/Title of the slot." },
            durationMinutes: { type: Type.INTEGER, description: "Duration in minutes." }
          },
          required: ["time", "type", "title", "durationMinutes"]
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    res.json({ success: true, data: result });
  } catch (error) {
    handleApiError(res, error, "Failed to generate daily agenda");
  }
});

// 6. Personalized Productivity Coach Insights
app.post("/api/ai/coaching-insights", async (req, res) => {
  try {
    const { tasks, habits, stats, lastAction } = req.body;
    const ai = getGemini();

    const prompt = `
      You are a world-class cognitive Personalized Productivity Coach.
      Your goal is to help the user complete their goals, identify bad work habits, detect burnout risks, and suggest behavioral nudges.
      
      User's Active Tasks: ${JSON.stringify(tasks || [])}
      User's Habits & Streaks: ${JSON.stringify(habits || [])}
      Current Productivity Statistics: ${JSON.stringify(stats || {})}
      Last completed user action or detail: "${lastAction || "Reviewed dashboard"}"
      
      Review this context and generate exactly 3 highly contextual coaching items:
      1. One Procrastination/Risk warning (e.g., highlighting which high-risk deadline is neglected, or identifying a streak that is slipping).
      2. One Peak Productivity Insight (e.g., suggesting focus sessions during morning hours or optimal break intervals based on stats).
      3. One Actionable Tip/Motivational challenge (with a specific click action to improve).
      
      Categorize appropriately and assign 'insight', 'warning', 'tip', 'procrastination', or 'burnout'.
    `;

    const response = await generateContentWithRetry(prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Short title for the insight." },
            content: { type: Type.STRING, description: "Personalized coaching text. Avoid generic advice, use direct stats or tasks." },
            type: { type: Type.STRING, description: "One of: insight, warning, tip, procrastination, burnout." },
            actionText: { type: Type.STRING, description: "Call-to-action button text (null if informational only)." },
            category: { type: Type.STRING, description: "Topic, e.g., 'Focus', 'Burnout', 'Streaks', 'Priorities'." }
          },
          required: ["title", "content", "type", "category"]
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    res.json({ success: true, data: result });
  } catch (error) {
    handleApiError(res, error, "Failed to generate coaching insights");
  }
});

// 7. Email and Document Summarizer
app.post("/api/ai/summarize-document", async (req, res) => {
  try {
    const { text, sourceType } = req.body;
    if (!text || text.trim() === "") {
      res.status(400).json({ success: false, error: "Document text is required." });
      return;
    }

    const ai = getGemini();
    const prompt = `
      You are an AI Document Intelligence Agent.
      Summarize the following raw text from a ${sourceType || 'document'} (could be an email, Notion page, or Slack memo).
      
      Text to analyze:
      """
      ${text}
      """
      
      Provide:
      1. A concise, one-sentence summary.
      2. An array of key takeaways.
      3. An array of suggested actionable tasks that you extracted from the document. For each, predict priority (high/medium/low) and estimated hours of effort.
    `;

    const response = await generateContentWithRetry(prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "High-level summary sentence." },
          keyTakeaways: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Bullet-point key takeaways."
          },
          suggestedTasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Suggested task title." },
                priority: { type: Type.STRING, description: "high, medium, or low." },
                estimatedHours: { type: Type.NUMBER, description: "Predicted hours needed." }
              },
              required: ["title", "priority", "estimatedHours"]
            },
            description: "Extracted tasks to be auto-added."
          }
        },
        required: ["summary", "keyTakeaways", "suggestedTasks"]
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json({ success: true, data: result });
  } catch (error) {
    handleApiError(res, error, "Failed to summarize document");
  }
});

// Vite Integration and Dev Server bootstrapping
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Prodigy AI Backend Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
