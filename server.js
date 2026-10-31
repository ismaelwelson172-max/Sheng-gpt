const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let freeChats = {};

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  const id = req.body.userId || req.ip;
  if (!freeChats[id]) freeChats[id] = 10;

  if (freeChats[id] <= 0) {
    return res.json({ reply: "Msee, free 10 zimeisha! Lipisha 99 bob na M-Pesa uendelee!" });
  }

  try {
    const apiKey = process.env.Sheng_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key missing kwa Vercel!");

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Model inafanya 100% leo - si 3.8
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
    
    const result = await model.generateContent(`Wewe ni Nairobi Sheng GPT. Jibu kila kitu kwa Sheng kali ya mtaani Nairobi, funny na ufupi. Usiongee Kiswahili sanifu. User: ${message}`);
    const reply = result.response.text();

    freeChats[id]--;
    res.json({ reply: reply + ` [${freeChats[id]} free]` });
  } catch (e) {
    console.error(e);
    res.json({ reply: `Eish! Error: ${e.message}. Jaribu tena msee!` });
  }
});

app.get('/', (req,res) => res.sendFile(__dirname + '/public/index.html'));
module.exports = app;
