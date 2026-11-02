const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
const MODELS = ["gemini-1.5-flash-8b", "gemini-1.5-flash", "gemini-1.0-pro"];

const SHENG_DICT = {
  "sasa msee": "Sasa msee! = What's up bro? 'Sasa' = Now/What's up, 'Msee' = Guy/Bro. Eastlands greeting!",
  "niaje": "Niaje = How are you? / What's up?",
  "msee": "Msee = Guy / Bro",
  "poa": "Poa = Cool / Fine",
  "noma": "Noma = Cool / Heavy / Serious"
};

let chatCount = {}; // simple counter

app.post('/api/chat', async (req, res) => {
  const { message, mpesaCode } = req.body;
  const userText = (message || "").toString();
  
  // Check paywall - kama code iko sawa, unlimited
  const isUnlimited = mpesaCode && mpesaCode.toUpperCase().startsWith('Q');
  
  // Fast local
  const lower = userText.toLowerCase().trim();
  if (SHENG_DICT[lower] && lower.split(' ').length <= 2) {
    return res.json({ reply: SHENG_DICT[lower], remaining: isUnlimited ? 999 : 9 });
  }

  for (let modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(`You are Nairobi Sheng GPT. Short street explanation for: "${userText}" in Sheng/Swahili/English`);
      const text = result.response.text();
      return res.json({ reply: text, remaining: isUnlimited ? 999 : 9, model: modelName });
    } catch (e) {
      console.log(modelName + " failed: " + e.message);
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Fallback - HAIWEZI RUDISHA UNDEFINED TENA!
  let fallback = SHENG_DICT[lower];
  if (!fallback) {
    for (let k in SHENG_DICT) if (lower.includes(k)) { fallback = SHENG_DICT[k]; break; }
  }
  if (!fallback) fallback = `Poa msee! "${userText}" = Nimekuelewa! Gemini iko busy kidogo, but tuko mtaani! Uliza ingine! 🔥`;

  return res.json({ reply: fallback, remaining: isUnlimited ? 999 : 8 });
});

app.post('/api/mpesa/stk', async (req, res) => {
  res.json({ message: "STK sent - Ingiza code inayoanza na Q" });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Live'));
module.exports = app;
