const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ✅ CREATE app FIRST (this was missing)
const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 API key loaded from environment variable (set in Render dashboard)
const genAI = new GoogleGenerativeAI("AIzaSyAMBphNHZWEf2XWmpk2nqrubxxJ2I17Htc");

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.post('/generate', async (req, res) => {
  try {
    const { destination, days, budget, interests } = req.body;

    const prompt = `
    Plan a ${days}-day trip to ${destination} with budget ₹${budget}.
    Interests: ${interests}.
    
    Return ONLY valid JSON (no markdown, no backticks) in this EXACT format:
    {
      "title": "string — catchy trip title",
      "summary": "string — 2-sentence overview",
      "estimatedCosts": {
        "flight": "₹XX,XXX",
        "hotel": "₹XX,XXX",
        "transport": "₹X,XXX",
        "food": "₹X,XXX",
        "activities": "₹X,XXX",
        "total": "₹XX,XXX"
      },
      "days": [
        {
          "day": 1,
          "title": "string",
          "theme": "string — one-line vibe for the day",
          "date": "Day 1",
          "activities": [
            "09:00 AM — Visit XYZ (Entry: ₹500 | Approx 2 hrs)",
            "12:00 PM — Lunch at ABC Restaurant (₹600–₹900 per person)",
            "03:00 PM — Activity Name (₹1,200 per person | Approx 3 hrs)",
            "07:00 PM — Evening activity (Free / ₹XXX)"
          ],
          "meals": {
            "breakfast": "Place name + approx cost e.g. Hotel buffet ₹400",
            "lunch": "Place name + approx cost",
            "dinner": "Place name + approx cost"
          },
          "dailyCost": "₹X,XXX–₹X,XXX",
          "tips": "One actionable local tip for the day"
        }
      ],
      "packingList": ["item1","item2","item3"],
      "importantNotes": ["note1","note2"]
    }
    
    CRITICAL: Every activity in the "activities" array MUST include a time, description, AND a cost estimate in ₹. Format: "HH:MM AM/PM — Activity description (₹cost or Free)". Never omit the cost.
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview"
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ result: text });

  } catch (err) {
    console.error("GEMINI ERROR:", err);
    res.status(500).json({ error: "Gemini failed" });
  }
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Voyager Travel Planner' });
});

app.listen(PORT, () => {
    console.log(`
✦ VOYAGER Travel Planner Server Running
🌐 Port: ${PORT}
🤖 Gemini API: ${process.env.GEMINI_API_KEY ? 'Connected ✓' : 'MISSING KEY ✗'}
`);
});