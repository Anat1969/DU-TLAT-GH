/**
 * pages/api/generate-prompt.ts
 *
 * POST /api/generate-prompt
 * מקבל קונספט, מחזיר Midjourney Prompt
 *
 * Request Body:
 * {
 *   title: string
 *   description: string
 *   essence: string
 *   tension: string
 *   medium: string
 *   style: string
 *   references?: string[]
 * }
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { Anthropic } from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const SYSTEM_PROMPT = `You are an artist-architect translating deep ideas into visual prompts.

Create a prompt that is:
1. **Distilled** - capture the idea in ONE visual essence
2. **High-dimensional** - evoke mood, atmosphere, light, composition
3. **Unattached** - avoid "A photo of..." or "An image of..." - write as moment, feeling, space
4. **Pure English** - generic enough for Midjourney, Leonardo, or any image generator
5. **Concrete** - materials, light, composition, texture, mood
6. **No version-specific details** - no mentions of tool names or models

**Never write:**
- "A photo of...", "An image of...", "Picture of..."
- Specific distances (1 meter, 2 hours)
- Actions (running, sitting, walking)
- Text in the image
- Tool-specific terms (Midjourney, Leonardo, render, etc.)

**Always include:**
- Contrast: light ↔ shadow, order ↔ chaos, empty ↔ full
- Rule of thirds in composition
- Texture and light as protagonists

**CRITICAL: Return ONLY valid JSON (no markdown, no extra text) with these 2 fields:**
{
  "interpretation": "Hebrew text (2-3 lines explaining the visual concept)",
  "prompt": "English text only (visual prompt ready for any image generator)"
}
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { title, description, essence, tension, medium, style, references } =
      req.body;

    // Validation
    if (!title || !description || !essence || !tension || !medium || !style) {
      return res.status(400).json({
        error: "Missing required fields: title, description, essence, tension, medium, style",
      });
    }

    const userPrompt = `
Create a visual prompt for this concept:

**Concept:** ${title}
**Source/Inspiration:** ${description}
**Core essence:** "${essence}"
**Central tension/contrast:** ${tension}
**Medium/Space:** ${medium}
**Style/Mood:** ${style}
${references && references.length > 0 ? `**References:** ${references.join(", ")}` : ""}

Generate a visual prompt that captures this idea as an EXPERIENCE, not a description.

Return ONLY a JSON object with no markdown or extra text:
{
  "interpretation": "Hebrew text (2-3 lines explaining the visual concept and how it embodies the idea)",
  "prompt": "English text only (visual prompt, pure language, ready for any image generator. NO tool names, no 'photo of', no actions, no text in image)"
}
`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content =
      message.content[0].type === "text" ? message.content[0].text : "";

    let interpretation = "";
    let prompt = "";

    try {
      const parsed = JSON.parse(content);
      interpretation = (parsed.interpretation || "").trim();
      prompt = (parsed.prompt || "").trim();

      if (!interpretation || !prompt) {
        throw new Error("Missing interpretation or prompt in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", content);
      return res.status(500).json({
        success: false,
        error: "Invalid response format from Claude API - expected JSON",
        debug: content.substring(0, 200),
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        title,
        interpretation,
        prompt,
        timestamp: new Date().toISOString(),
        model: "claude-opus-4-1",
      },
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate prompt",
    });
  }
}
