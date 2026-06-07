/**
 * PROMPT GENERATOR
 * 
 * מקבל קונספט עמוק (תובנה, מקור השראה, מטפורה)
 * מחזיר Midjourney Prompt ברמת National Geographic / Minimal / Architectural
 * 
 * דוגמה Input:
 * {
 *   concept: "התגעגעות למעצור שלא קיים",
 *   inspiration: "Waiting for Godot",
 *   medium: "מרחב מחייה",
 *   style: "minimalist brutalist"
 * }
 */

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic();

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

async function generatePrompt(concept) {
  /**
   * concept: {
   *   title: string (שם הרעיון)
   *   description: string (תיאור מה הוא בא מ-mathematica/biomimicry/culture/etc)
   *   essence: string (הגרעין בעברית - משפט אחד)
   *   tension: string (ניגוד עיקרי - מה מתכתש)
   *   medium: string (מרחב מחייה? מבנה? פרטים?)
   *   style: string (minimalist, brutalist, organic, parametric, etc)
   *   references: array[string] (אם יש מקורות inspiration)
   * }
   */

  const userPrompt = `
ייצר Midjourney Prompt מזוקק מהרעיון הזה:

**שם הרעיון:** ${concept.title}
**תיאור:** ${concept.description}
**הגרעין בעברית:** "${concept.essence}"
**הניגוד/המתח:** ${concept.tension}
**המדיום:** ${concept.medium}
**הסגנון:** ${concept.style}
${concept.references ? `**אינספירציות:** ${concept.references.join(", ")}` : ""}

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

  try {
    const response = await client.messages.create({
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

    return {
      success: true,
      prompt: response.content[0].type === "text" ? response.content[0].text : "",
      timestamp: new Date().toISOString(),
      model: "claude-opus-4-1",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Example usage:
async function main() {
  const exampleConcept = {
    title: "התגעגעות למעצור שלא קיים",
    description:
      "מהויצירה 'Waiting for Godot' של סמואל בקט. זיכרון של עתיד שלא יגיע, התלבטות בין כאוס ותיקווה.",
    essence:
      "הרגע בו הזמן נעצר ואנו עומדים בסף של משהו שלא יקרה לעד",
    tension:
      "תנועה ↔ עמידה | תקווה ↔絶望望 | מלא ↔ ריק",
    medium: "מרחב מחייה ללא דמויות",
    style: "minimalist brutalist, twilight, awaiting",
    references: [
      "בקט",
      "אור זהוב מתפרק",
      "בטון בשחיקה",
      "דממה טעונה",
    ],
  };

  console.log("🔨 Generating Midjourney Prompt...\n");
  const result = await generatePrompt(exampleConcept);

  if (result.success) {
    console.log(result.prompt);
  } else {
    console.error("Error:", result.error);
  }
}

// main();

module.exports = { generatePrompt };
