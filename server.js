const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// API key from Render environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.post('/generate', async (req, res) => {
  try {
    const { destination, days, budget, interests } = req.body;

    const prompt = `
    Plan a ${days}-day trip to ${destination} with budget Rs.${budget}.
    Interests: ${interests}.
    
    Return ONLY valid JSON (no markdown, no backticks) in this EXACT format:
    {
      "title": "string — catchy trip title",
      "summary": "string — 2-sentence overview",
      "estimatedCosts": {
        "flight": "Rs.XX,XXX",
        "hotel": "Rs.XX,XXX",
        "transport": "Rs.X,XXX",
        "food": "Rs.X,XXX",
        "activities": "Rs.X,XXX",
        "total": "Rs.XX,XXX"
      },
      "days": [
        {
          "day": 1,
          "title": "string",
          "theme": "string — one-line vibe for the day",
          "date": "Day 1",
          "activities": [
            "09:00 AM — Visit XYZ (Entry: Rs.500 | Approx 2 hrs)",
            "12:00 PM — Lunch at ABC Restaurant (Rs.600-Rs.900 per person)",
            "03:00 PM — Activity Name (Rs.1,200 per person | Approx 3 hrs)",
            "07:00 PM — Evening activity (Free / Rs.XXX)"
          ],
          "meals": {
            "breakfast": "Place name + approx cost e.g. Hotel buffet Rs.400",
            "lunch": "Place name + approx cost",
            "dinner": "Place name + approx cost"
          },
          "dailyCost": "Rs.X,XXX-Rs.X,XXX",
          "tips": "One actionable local tip for the day"
        }
      ],
      "packingList": ["item1","item2","item3"],
      "importantNotes": ["note1","note2"]
    }
    
    CRITICAL: Every activity in the activities array MUST include a time, description, AND a cost estimate. Format: HH:MM AM/PM - Activity description (Rs.cost or Free). Never omit the cost. Return raw JSON only, no markdown fences.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const result = await model.generateContent(prompt);
let text = result.response.text();

// Clean unwanted markdown if any
text = text.replace(/```json|```/g, '').trim();

// Try parsing BEFORE sending to frontend
let parsed;
try {
  parsed = JSON.parse(text);
} catch (e) {
  console.error("INVALID JSON FROM GEMINI:\n", text);
  return res.status(500).json({ error: "Invalid JSON from AI" });
}

// Send proper JSON
res.json(parsed);

  } catch (err) {
    console.error("ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Voyager Travel Planner' });
});

app.listen(PORT, () => {
  console.log(`
VOYAGER Travel Planner Running
Port: ${PORT}
Gemini API: ${process.env.GEMINI_API_KEY ? 'Connected' : 'MISSING KEY - set GEMINI_API_KEY in Render dashboard'}
`);
});
