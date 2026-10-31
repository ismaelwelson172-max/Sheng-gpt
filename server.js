const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
let freeChats = {};
const genAI = new GoogleGenerativeAI(process.env.Sheng_API_KEY);
app.post('/api/chat', async (req, res) => {
  const { message, userId } = req.body;
  const id = userId || req.ip;
  if (!freeChats[id]) freeChats[id] = 10;
  if (freeChats[id] <= 0) {
    return res.json({ reply: "Msee, free 10 zimeisha! Lipisha 99 bob na M-Pesa uendelee!", paywall: true });
  }
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Wewe ni Nairobi Sheng GPT. Jibu kila kitu kwa Sheng kali ya mtaani Nairobi, funny, ufupi, na slang. Swali: ${message}`;
    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    freeChats[id]--;
    res.json({ reply: reply + ` [${freeChats[id]} free]` });
  } catch (e) {
    res.json({ reply: `Eish error: ${e.message} - but "${message}" ni noma msee!` });
  }
});
app.get('/', (req,res) => res.sendFile(__dirname + '/public/index.html'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Sheng Live'));
module.exports = app;
