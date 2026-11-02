const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

// MODELS ZOTE VALID - Ikifail moja inajaribu ingine auto
const MODELS = ["gemini-1.5-flash-8b", "gemini-1.5-flash", "gemini-1.0-pro"];

const SHENG_DICT = {
  "niaje msee": "Poa sana! Niaje = How are you? Msee = bro/guy. So 'Niaje msee' = What's up bro? Eastlands vibe!",
  "msee": "Msee = Guy / Bro / Dude (Common Eastlands)",
  "poa": "Poa = Cool / Fine / Good",
  "noma": "Noma = Serious / Cool / Heavy",
  "form": "Form = Plans. 'Form iko aje?' = What's the plan?",
  "mbogi": "Mbogi = Squad / Crew",
  "doh": "Doh = Money / Cash",
  "wasee": "Wasee = People / Guys",
  "morio": "Morio = Bro (Kikuyu Sheng)"
};

app.post('/api/chat', async (req, res) => {
  const userText = (req.body.message || req.body.prompt || "").toLowerCase();
  
  // Fast local - Hata kama Google imelala, app inawork!
  if (SHENG_DICT[userText] || SHENG_DICT[userText.trim()]) {
    if (userText.split(' ').length <= 3) {
      return res.json({ text: SHENG_DICT[userText.trim()] || SHENG_DICT[userText] });
    }
  }

  // Jaribu Gemini models
  for (let modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(`You are Nairobi Sheng GPT from Eastlands. Explain "${req.body.message || req.body.prompt}" in Sheng, Swahili and English. Short, real, street vibe.`);
      const text = result.response.text();
      return res.json({ text, model: modelName });
    } catch (e) {
      console.log(`Model ${modelName} failed:`, e.message);
      await new Promise(r => setTimeout(r, 800));
    }
  }

  // Fallback - APP HAIFAI KURUDISHA ERROR!
  const lower = userText.toLowerCase();
  for (let k in SHENG_DICT) {
    if (lower.includes(k)) return res.json({ text: SHENG_DICT[k] });
  }
  return res.json({ text: `Poa msee! "${req.body.message}" - Gemini iko busy sai na watu wengi. Lakini "Niaje msee" = What's up bro? Try tena 10 sec! 🔥` });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sheng GPT live on ${PORT}`));
module.exports = app;
