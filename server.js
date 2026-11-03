const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
const MODELS = ["gemini-1.5-flash-8b", "gemini-1.5-flash"];

let SHENG_DICT = {};
try {
  const basePath = path.join(__dirname, 'data');
  console.log("Loading from:", basePath);
  const f1Path = path.join(basePath, 'sheng-1000.json');
  const f2Path = path.join(basePath, 'sheng-part2.json');
  const f3Path = path.join(basePath, 'sheng-part3.json');
  
  const f1 = JSON.parse(fs.readFileSync(f1Path, 'utf8'));
  const f2 = fs.existsSync(f2Path) ? JSON.parse(fs.readFileSync(f2Path, 'utf8')) : {};
  const f3 = fs.existsSync(f3Path) ? JSON.parse(fs.readFileSync(f3Path, 'utf8')) : {};
  
  SHENG_DICT = { ...f1, ...f2, ...f3 };
  console.log(`✅ LOADED: ${Object.keys(SHENG_DICT).length} Sheng words! Example: nganya = ${SHENG_DICT['nganya'] || SHENG_DICT['Nganya']}`);
} catch (e) {
  console.log("❌ Error loading Sheng dict:", e.message);
  console.log(e.stack);
}

app.post('/api/chat', async (req, res) => {
  const userText = (req.body.message || "").toString().trim();
  const lower = userText.toLowerCase();
  
  // 1. Check dictionary DIRECT - hii ndio muhimu!
  if (SHENG_DICT[lower]) {
    return res.json({ reply: `${lower} = ${SHENG_DICT[lower]} [Local Dict - ${Object.keys(SHENG_DICT).length} words]`, remaining: 5 });
  }
  // Check kama key iko na case tofauti
  for (let k in SHENG_DICT) {
    if (k.toLowerCase() === lower) {
      return res.json({ reply: `${k} = ${SHENG_DICT[k]} [Local Dict]`, remaining: 5 });
    }
  }
  // Check kama neno liko ndani ya sentence
  for (let k in SHENG_DICT) {
    if (lower.includes(k.toLowerCase()) && k.length > 2) {
      return res.json({ reply: `${k} = ${SHENG_DICT[k]}`, remaining: 5 });
    }
  }

  // 2. Gemini kama backup
  for (let modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(`You are Nairobi Sheng GPT. Explain Sheng word "${userText}" in 1 sentence Sheng + English. Use this dict: ${JSON.stringify(SHENG_DICT).slice(0,4000)}`);
      const text = result.response.text();
      return res.json({ reply: text, remaining: 5, model: modelName });
    } catch (e) { console.log(modelName + ' fail ' + e.message); }
  }

  // 3. Last fallback
  return res.json({ reply: `Poa! "${userText}" bado sija-add vizuri. Lakini dictionary iko na ${Object.keys(SHENG_DICT).length} words! Jaribu: ganji, momo, thao, keja, supu, doh.`, remaining: 5 });
});

app.post('/api/mpesa/stk', async (req, res) => {
  res.json({ message: "STK sent" });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Live'));

module.exports = app;
