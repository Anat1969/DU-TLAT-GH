# 📦 SPATIAL ESSENCE — קבצים מוכנים להורדה

## **רשימת קבצים**

### **1. README.md** ⭐
**תיאור:** מדריך מלא — הוראות היתקנה, setup, זרימת עבודה
**קבלת:** קרא קודם את זה

---

### **2. prompt-generator.js**
**תיאור:** Claude Agent שמקבל קונספט ויוצר Midjourney Prompt
**איפה להעמיד:** `/project-root/` או `/project-root/lib/`
**שימוש:** 
```javascript
const { generatePrompt } = require('./prompt-generator');
const result = await generatePrompt({ title, description, essence, ... });
```

---

### **3. pages-api-generate-prompt.ts**
**תיאור:** Next.js API Route שמחבר Frontend ל-Claude API
**איפה להעמיד:** `/pages/api/generate-prompt.ts`
**Endpoint:** `POST /api/generate-prompt`
**Input:**
```json
{
  "title": "שם הרעיון",
  "description": "תיאור מקור",
  "essence": "הגרעין",
  "tension": "הניגוד",
  "medium": "המדיום",
  "style": "הסגנון",
  "references": ["ref1", "ref2"]
}
```

---

### **4. PromptGenerator.tsx**
**תיאור:** React Component - UI ממשק ליוצר Prompts (RTL, שחור-לבן)
**איפה להעמיד:** `/components/PromptGenerator.tsx`
**שימוש:**
```typescript
import PromptGenerator from '@/components/PromptGenerator';

export default function Home() {
  return <PromptGenerator />;
}
```

---

### **5. supabase-schema.sql**
**תיאור:** Database Schema - SQL queries להקמת Supabase
**איפה להעמיד:** פשוט דבוק בSupabase SQL Editor
**כולל:**
- `concepts` - קונספטים
- `prompts` - Midjourney Prompts
- `images` - תמונות
- `models_3d` - מודלים תלת-מימדיים
- `projects` - ניהול פרויקטים
- views, indexes, RLS

---

### **6. .env.local.example**
**תיאור:** Template של Environment Variables
**איפה להעמיד:** `/project-root/.env.local`
**שלבים:**
1. העתק את הקובץ לתיקיית הפרויקט
2. שנה שם ל-`.env.local` (בלי `.example`)
3. מלא את הערכים שלך (API Keys, Supabase URL וכו')

---

### **7. package.json**
**תיאור:** NPM dependencies וסקריפטים
**איפה להעמיד:** `/project-root/package.json`
**הוסף dependency:**
```bash
npm install
```
**סקריפטים:**
- `npm run dev` - הרץ development server
- `npm run build` - build ל-production
- `npm start` - הרץ production server

---

## **סדר היתקנה המדויק**

```bash
# 1. צור Next.js project
npx create-next-app@latest spatial-essence --typescript
cd spatial-essence

# 2. העתק קבצים לתיקיות הנכונות
# prompt-generator.js → /project-root/
# pages-api-generate-prompt.ts → /pages/api/generate-prompt.ts
# PromptGenerator.tsx → /components/PromptGenerator.tsx
# supabase-schema.sql → שמור בבטחה (תצטרך לדבוק בSupabase)
# .env.local.example → שנה שם ל-.env.local

# 3. Supabase Setup
# - עבור ל-https://supabase.com
# - צור Project חדש
# - בSQL Editor: הדבק את supabase-schema.sql
# - הריץ

# 4. Environment Variables
# - מלא את .env.local בערכים שלך

# 5. Install + Run
npm install
npm run dev
# → http://localhost:3000
```

---

## **סדר קריטי**

**חייב:**
1. ✅ README.md (קרא)
2. ✅ package.json (install)
3. ✅ .env.local.example (setup)
4. ✅ supabase-schema.sql (database)
5. ✅ pages-api-generate-prompt.ts (API)
6. ✅ prompt-generator.js (logic)
7. ✅ PromptGenerator.tsx (UI)

---

## **שימוש בClaude Code**

1. הורד את כל הקבצים
2. פתח Claude Code
3. צור פרויקט Next.js חדש
4. הדבק את הקבצים לתיקיות הנכונות
5. עקוב אחרי README.md

---

## **קבצים שעדיין צריך ליצור**

⏳ Image Upload Component  
⏳ Tripo3D Integration  
⏳ 3D Viewer (Three.js)  
⏳ Project Manager  
⏳ Save Handler  

---

## **שאלות נפוצות**

**Q: איפה אני מעמיד את prompt-generator.js?**  
A: `/project-root/lib/prompt-generator.js` או `/project-root/` — בחר מקום אחד

**Q: האם אני צריך את כל הקבצים?**  
A: כן. כל קובץ הוא חלק מהמערכת.

**Q: מה אם Supabase Schema לא עובד?**  
A: בדוק את ה-SQL Editor בSupabase, בדוק שאין שגיאות

**Q: איפה I put .env.local?**  
A: `/project-root/.env.local` — בתיקיית root של הפרויקט

---

## **מוכן?**

כל הקבצים כאן. בואי נתחיל:

1. **קרא את README.md** (5 דקות)
2. **בנה את הפרויקט** (10 דקות)
3. **Supabase Setup** (5 דקות)
4. **Environment Variables** (2 דקות)
5. **npm install + npm run dev** (3 דקות)

**סה"כ: ~25 דקות עד שהכל פעיל.**

---

🚀 בהצלחה!
