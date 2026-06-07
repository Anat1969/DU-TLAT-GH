# 📐 SPATIAL ESSENCE — מערכת יוצרת מודלים תלת-מימדיים מעמוקים

> תובנה עמוקה → Midjourney Prompt → תמונה → מודל 3D → Supabase

---

## **מה זה?**

מערכת מלאה שהופכת **קונספטים עמוקים** (מתמטיקה, ביומימטיקה, תרבות) לתמונות high-end (National Geographic / Minimal) ואחרי כן למודלים תלת-מימדיים interaktיביים.

**הזרימה:**

```
קונספט עמוק (תובנה)
    ↓
[Claude API] יוצר Midjourney Prompt
    ↓
משתמשת מעתיקה ל-Midjourney
    ↓
משתמשת יוצרת תמונה בMidjourney
    ↓
משתמשת מעלה תמונה לאפליקציה
    ↓
[Tripo3D] הופכת תמונה ל-3D
    ↓
[Supabase] שומרת הכל
    ↓
משתמשת רואה + מסובבת את המודל 3D
```

---

## **סטאק טכנולוגי**

| שכבה | טכנולוגיה | תפקיד |
|------|-----------|--------|
| **Prompt Generation** | Claude API (Opus 4.1) | יוצר Midjourney Prompts |
| **Frontend** | Next.js + React | ממשק משתמש |
| **3D Conversion** | Tripo3D API | הפוך תמונה ל-3D |
| **Database** | Supabase (PostgreSQL) | שמור קונספטים, פרומפטים, תמונות, מודלים |
| **Storage** | Supabase Storage | שמור קבצים (תמונות, מודלים) |
| **Styling** | Pure CSS (RTL, BW) | עברית מלאה, שחור-לבן, minimal |

---

## **דרישות מוקדמות**

- **Node.js** 18+ ו-npm/yarn
- **Claude API Key** (יש לך בעלים)
- **Tripo3D API Key** (חינמית מ-https://www.tripo3d.ai/)
- **Supabase Project** (חינמית מ-https://supabase.com/)
- **Midjourney Subscription** (יש לך בעלים)

---

## **הוראות היתקנה**

### **שלב 1 — Clone ו-Install**

```bash
git clone <repository-url>
cd spatial-essence
npm install
```

### **שלב 2 — Supabase Setup**

1. **הכנס ל-Supabase:** https://supabase.com/
2. **צור Project חדש** (בחר Free Tier)
3. **עבור ל-SQL Editor** במשמאל
4. **הדבק את תוכן `supabase-schema.sql`**
5. **הריץ את ה-queries**
6. **צור 2 Storage Buckets:**
   - `images` (Public)
   - `models` (Public)

### **שלב 3 — Environment Variables**

צור קובץ `.env.local`:

```env
# Claude API
CLAUDE_API_KEY=sk-ant-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Tripo3D API
TRIPO_API_KEY=your-tripo3d-key

# App Settings
NEXT_PUBLIC_APP_NAME=Spatial Essence
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### **שלב 4 — Run Development Server**

```bash
npm run dev
```

הטיפה בפרדן:
```
http://localhost:3000
```

---

## **קבצים שיצרנו**

```
project-root/
├── prompt-generator.js
│   └── Claude Agent שמקבל קונספט ויוצר Midjourney Prompt
│
├── pages/
│   └── api/
│       ├── generate-prompt.ts
│       │   └── API Route שמקשר בין Frontend ל-Claude
│       ├── upload-image.ts (צריך ליצור)
│       │   └── API Route לעלאת תמונה ל-Supabase
│       └── generate-3d.ts (צריך ליצור)
│           └── API Route לשליחה ל-Tripo3D
│
├── components/
│   ├── PromptGenerator.tsx
│   │   └── React Component ממשק יוצר Prompts
│   ├── ImageUpload.tsx (צריך ליצור)
│   │   └── React Component לעלאת תמונות
│   ├── Model3DViewer.tsx (צריך ליצור)
│   │   └── React Component לתצוגת 3D עם Three.js
│   └── SaveManager.tsx (צריך ליצור)
│       └── React Component לשמירה בSupabase
│
├── supabase-schema.sql
│   └── Database Schema (הדבק ב-Supabase SQL Editor)
│
├── .env.local
│   └── Environment variables (יצור לעצמך)
│
├── package.json
├── next.config.js
└── README.md (הקובץ הזה)
```

---

## **זרימת עבודה — שלב אחרי שלב**

### **1. יצירת Prompt**

1. פתח את האפליקציה ב-`http://localhost:3000`
2. מלא את פרטי הקונספט:
   - **שם הרעיון** (e.g., "התגעגעות למעצור שלא קיים")
   - **תיאור מקור** (e.g., "מ'Waiting for Godot' של סמואל בקט")
   - **הגרעין** (e.g., "הרגע בו הזמן נעצר")
   - **הניגוד** (e.g., "אור ↔ צל | סדר ↔ כאוס")
   - **המדיום** (e.g., "מרחב מחייה ללא דמויות")
   - **הסגנון** (e.g., "minimalist brutalist")
3. לחץ על "יצור Midjourney Prompt"
4. Claude API תייצר prompt בעברית + באנגלית

### **2. העתקה ל-Midjourney**

1. העתק את ה-Prompt (לחץ "Copy to Clipboard")
2. פתח את Midjourney (Discord או Web)
3. הדבק את הפרומפט
4. חכה לתמונה (בדרך כלל 5-30 שניות)

### **3. העלאת תמונה**

1. חזור לאפליקציה
2. עבור לקומפוננטה "Image Upload"
3. גרור + הנח את התמונה מ-Midjourney
4. או לחץ "Choose File"
5. התמונה תתעלה ל-Supabase Storage

### **4. יצירת מודל 3D**

1. המערכת אוטומטית תשלח את התמונה ל-Tripo3D
2. חכה כ-10-15 שניות
3. Tripo3D תחזיר מודל .glb
4. המודל יישמר בSupabase

### **5. צפייה ותאימה**

1. המודל יופיע בComponent "Model 3D Viewer"
2. סובב עכשיו עם העכבר
3. הקרב / הרחק עם גלגל
4. הטה עם Shift + drag

### **6. שמירה בSupabase**

1. לחץ "Save Project"
2. בחר פרויקט או צור חדש
3. הכל (קונספט, פרומפט, תמונה, מודל) יישמר

---

## **דוגמה זרימה מלאה**

```
קלט קונספט:
─────────────────────────────────
שם:          "התגעגעות למעצור שלא קיים"
תיאור:       "מ'Waiting for Godot' של סמואל בקט"
גרעין:       "הרגע בו הזמן נעצר"
ניגוד:       "תנועה ↔ עמידה"
מדיום:       "מרחב מחייה ללא דמויות"
סגנון:       "minimalist brutalist twilight"

↓ Claude API יוצר ↓

פלט Prompt (בעברית):
─────────────────────────────────
"ממתקה של זמן כשהוא עוצר - 
בין תקווה לדממה, 
סדר בטון הופך לתרגיל בעמידה"

↓ Claude API יוצר ↓

פלט Prompt (באנגלית, עבור Midjourney):
─────────────────────────────────
"Suspended moment of time crystallized, 
brutalist concrete threshold, 
raking golden hour light casting long shadows, 
empty threshold space, 
anticipatory tension between silence and memory, 
weathered brutalist architecture with moss veins, 
liminal space at dusk, 
rule of thirds composition, 
ultra-detailed, no text, no humans, 
photorealistic, rule of thirds, 
chiaroscuro lighting, 
wide-angle view from ground level"

↓ משתמשת העתיקה ל-Midjourney ↓

↓ Midjourney יוצרת ↓

תמונה: photo.png

↓ משתמשת מעלה ↓

↓ Tripo3D הופכת ↓

מודל 3D: model.glb

↓ Supabase שומר ↓

הכל במקום אחד.
```

---

## **קונפיגורציה נוספת**

### **Tripo3D API**

```javascript
// pages/api/generate-3d.ts
const tripo_response = await fetch(
  "https://api.tripo3d.ai/v2/openapi/models/image-to-3d",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TRIPO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: "https://your-image-url.png",
    }),
  }
);

// מחזירה task_id, אתה צריך לתשאול עד שהמודל מוכן
```

### **Supabase Upload**

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(url, anonKey);

const { data, error } = await supabase.storage
  .from("models")
  .upload(`3d/${concept_id}/${timestamp}.glb`, modelFile);
```

---

## **טיפים וטריקים**

1. **Prompts עמוקים = תמונות טובות יותר**
   - ככל שהקונספט עמוק יותר, Claude יוצר prompt טוב יותר
   - Midjourney "מבינה" prompts שמדברים על עמק ותרבות

2. **שמור כל prompts שעובדים**
   - בחזור בSupabase, אתה תוכלי לשפר אותם או להשתמש שוב

3. **ניסיונות עם סגנונות**
   - "brutalist", "parametric", "organic", "industrial", "liminal"
   - כל אחד מייצר אווירה שונה

4. **תמונות בעלות גבוהה = מודלים טובים יותר**
   - Tripo3D עובדת טוב עם תמונות בעלות 1024x1024+

5. **שמור את הנאטיביות**
   - מעתיקה ל-Midjourney לפחות פעם בשבוע
   - הנציה את הפרומפטים שעובדים הכי טוב

---

## **סיבוך נפוץ ופתרונות**

| בעיה | סיבה | פתרון |
|------|------|--------|
| Prompt לא נוצר | API Key לא תקין | בדוק את `CLAUDE_API_KEY` ב-.env.local |
| תמונה לא תעלה | Supabase Storage לא קונפיגורציה | צור buckets "images" ו-"models" |
| 3D לא הופך | Tripo3D אמא Key | בדוק את `TRIPO_API_KEY` |
| UI מטולטל | CSS RTL | וודא שה-container יש `dir="rtl"` |

---

## **מידע קשור**

- **Claude API Docs:** https://docs.anthropic.com/
- **Tripo3D Docs:** https://docs.tripo3d.ai/
- **Supabase Docs:** https://supabase.com/docs/
- **Midjourney Docs:** https://docs.midjourney.com/

---

## **מה עדיין צריך ליצור**

1. ✅ Prompt Generator
2. ✅ Prompt Generator API Route
3. ✅ Prompt Generator UI Component
4. ✅ Supabase Schema
5. ⏳ Image Upload API Route + Component
6. ⏳ Tripo3D Integration API Route
7. ⏳ Model 3D Viewer Component (Three.js)
8. ⏳ Save Manager Component
9. ⏳ Project Management Interface
10. ⏳ GitHub Repository Setup

---

## **הערות**

- כל הקוד בעברית (comments, variables)
- RTL (Right-to-Left) אוטומטי בComponent
- שחור-לבן טהור (no colors)
- Minimal design (no icons, no decorations)
- Accessible ופעיל בכל גודל מסך

---

## **רישיון**

Personal Use Only

---

## **יוצרים**

- Claude (AI) — Prompt Generation + Framework
- You — Vision + Refinement

---

**זה זה. קח את הקבצים, הרץ ב-Claude Code, ותתחיל.**

🚀 ברכות!
