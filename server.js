const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
const MODELS = ["gemini-1.5-flash-8b", "gemini-1.5-flash", "gemini-1.0-pro"];

// === LOAD SHENG 1000+ WORDS FROM YOUR 3 FILES ===
let SHENG_DICT = {};
try {
  const f1 = JSON.parse(fs.readFileSync('./data/sheng-1000.json', 'utf8'));
  const f2 = JSON.parse(fs.readFileSync('./data/sheng-part2.json', 'utf8'));
  const f3 = JSON.parse(fs.readFileSync('./data/sheng-part3.json', 'utf8'));
  SHENG_DICT = { ...f1, ...f2, ...f3 };
  console.log(`✅ Sheng dictionary loaded: ${Object.keys(SHENG_DICT).length} words!`);
} catch (e) {
  console.log("Error loading Sheng dict:", e.message);
  // fallback ya zamani kama file hazipatikani
  SHENG_DICT = {
    "sasa msee": "Sasa msee! What's up bro? 'Sasa' = Now/What's up, 'Msee' = Guy/Bro. Eastlands greeting.",
    "niaje": "Niaje - How are you? / What's up?",
    "msee": "Msee = Guy / Bro",
    "poa": "Poa = Cool / Fine",
    "noma": "Noma = Cool / Heavy / Serious"
  };
}

let chatCount = {}; // simple counter

app.post('/api/chat', async (req, res) => {
  const { message, mpesaCode } = req.body;
  const userText = (message || "").toString();

  // Check paywall - kama code iko sawa, unlimited
  const isUnlimited = mpesaCode && mpesaCode.toUpperCase().startsWith('Q');

  // Fast local - kama ni neno moja tu la Sheng
  const lower = userText.toLowerCase().trim();
  if (SHENG_DICT[lower] || lower.split(' ').length <= 2) {
    const localDef = SHENG_DICT[lower];
    if (localDef) {
      return res.json({ reply: localDef, remaining: isUnlimited ? 999 : 5 });
    }
  }

  for (let modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(`You are Nairobi Sheng GPT. Short street explanation for: "${userText}". Use Sheng dictionary: ${JSON.stringify(SHENG_DICT).slice(0,8000)}. Reply in Sheng + English mix, Eastlands vibe, 2-3 sentences max.`);
      const text = result.response.text();
      return res.json({ reply: text, remaining: isUnlimited ? 999 : 9, model: modelName });
    } catch (e) {
      console.log(modelName + ' failed: ' + e.message);
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Fallback - HAINIZI BUDISHA UNDEFINED TENA!
  let fallback = SHENG_DICT[lower];
  if (!fallback) {
    for (let k in SHENG_DICT) { if (lower.includes(k)) { fallback = SHENG_DICT[k]; break; } }
  }
  if (!fallback) fallback = `Poa msee! "${userText}" - Nimekuelewa! Gemini iko busy kidogo, but tuko mtaani! Uliza neno ingine ya Sheng!`;

  return res.json({ reply: fallback, remaining: isUnlimited ? 999 : 5 });
});

app.post('/api/mpesa/stk', async (req, res) => {
  res.json({ message: "STK sent - Ingiza code unayoanza na 'Q'" });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Live'));

module.exports = app;
