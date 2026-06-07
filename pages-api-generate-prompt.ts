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

const SYSTEM_PROMPT = `אתה אדריכל-אמן שמתרגם רעיונות עמוקים לפרומפטים ויזואליים.

כל פרומפט שאתה יוצר חייב להיות:
1. **מזוקק** - זקק את הרעיון לתחושה חזותית אחת בדיוק
2. **גבוה-ממד** - National Geographic, טבע, ארכיטקטורה, minimal
3. **ללא קשירות** - אל תרשום "תמונה של...", כתוב את הדברים כ-moment, feeling, space
4. **באנגלית טהורה** - עבור Midjourney
5. **קונקרטי** - חומרים, אור, קומפוזיציה, אווירה

**אל תרשום EVER:**
- "A photo of..." או "An image of..."
- מרחקים מדודים (1 meter, 2 hours)
- פעולות (running, sitting, walking)
- טקסט בתמונה

**שימו לב:**
- תמיד הנח ניגוד: אור ↔ צל, סדר ↔ כאוס, ריק ↔ מלא
- חוק השלישים בקומפוזיציה
- טקסטורה ואור הם גיבורים, לא רקע

**תמיד הדפיס 3 דברים:**
1. תיאור בעברית (2-3 שורות, תחושה + מתח)
2. הפרומפט באנגלית (חד, ברור, ללא שרשור)
3. הערת ערך (למה התמונה הזו משיחה עם הרעיון?)
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
ייצר Midjourney Prompt מזוקק מהרעיון הזה:

**שם הרעיון:** ${title}
**תיאור:** ${description}
**הגרעין בעברית:** "${essence}"
**הניגוד/המתח:** ${tension}
**המדיום:** ${medium}
**הסגנון:** ${style}
${references && references.length > 0 ? `**אינספירציות:** ${references.join(", ")}` : ""}

בנה לי תמונה שתופסת את הרעיון הזה בדיוק — לא כתיאור של הרעיון, אלא כ*חוויה* של הרעיון.

פלט:
---

**תיאור [בעברית]:**
[2-3 שורות, תחושה + הניגוד כיצד משתקף]

**Midjourney Prompt [באנגלית]:**
[הפרומפט המלא, ברור וחד]

**למה התמונה הזו עובדת:**
[הערה קצרה - איך הניגוד / חומרים / אור / קומפוזיציה משיחה עם הרעיון]

---
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

    // Parse the response to extract sections
    const parts = content.split("---").filter((p) => p.trim());
    let hebrewDescription = "";
    let midjourneyPrompt = "";
    let whyItWorks = "";

    if (parts.length > 1) {
      // Extract sections from the response
      const descMatch = content.match(
        /\*\*תיאור.*?\*\*:?\n([\s\S]*?)(?=\*\*Midjourney|$)/i
      );
      const promptMatch = content.match(
        /\*\*Midjourney Prompt.*?\*\*:?\n([\s\S]*?)(?=\*\*למה|$)/i
      );
      const whyMatch = content.match(
        /\*\*למה התמונה.*?\*\*:?\n([\s\S]*?)$/i
      );

      if (descMatch) hebrewDescription = descMatch[1].trim();
      if (promptMatch) midjourneyPrompt = promptMatch[1].trim();
      if (whyMatch) whyItWorks = whyMatch[1].trim();
    }

    return res.status(200).json({
      success: true,
      data: {
        title,
        hebrewDescription: hebrewDescription || "N/A",
        midjourneyPrompt: midjourneyPrompt || content,
        whyItWorks: whyItWorks || "N/A",
        fullResponse: content,
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
