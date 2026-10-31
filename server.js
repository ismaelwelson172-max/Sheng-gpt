import express from 'express';import cors from 'cors';import path from 'path';import { fileURLToPath } from 'url';const __filename=fileURLToPath(import.meta.url);const __dirname=path.dirname(__filename);const app=express();app.use(cors());app.use(express.json());app.use(express.static(path.join(__dirname,'public')));
const FREE_LIMIT=10;const users=new Map();
const shengDict={
"niaje":["Poa msee! Niko fiti, wewe?","Niko rada!","Freshi sana msee!"],
"poa":["Poa sana!","Niko poa, wewe?","Freshi!"],
"muryo":["Murio ni msee ama dame anakuanga msupa!","Murio = crush wako"],
"githaa":["Githaa ni gari msee!","Githaa = moti"],
"gaping":["Gaping ni kuchukua kitu bila permission","Ku-gapa = kuiba tu"],
"rada":["Rada ni kujua mambo","Uko rada = uko alert"],
"noma":["Noma = poa sana, kali!"],
"msee":["Msee ni jamaa, bro yako"],
"dame":["Dame ni msichana"],
"doh":["Doh ni pesa msee"],
"mbao":["Mbao ni twenty bob"],
"soo":["Soo ni 100 bob"],
"mahewa":["Mahewa ni hewa, hakuna kitu"],
"bash":["Bash ni party"],
"lipa":["Lipa na M-Pesa msee!"]
};
function smartReply(msg){
const m=msg.toLowerCase();
for(let k in shengDict){if(m.includes(k)){let arr=shengDict[k];return arr[Math.floor(Math.random()*arr.length)]+" - ("+k+")";}}
if(m.includes("habari")||m.includes("mambo"))return "Mambo poa msee! Niko rada. Wewe uko aje?";
if(m.includes("jina"))return "Mimi ni Nairobi Sheng GPT, msee wa mtaa anajua Sheng yote!";
if(m.includes("love")||m.includes("penda"))return "Mapenzi kwa Sheng ni 'kumwaga ndani' ama 'kudate' - usisahau msee!";
return `Ehh "${msg}" - kwa Sheng tunasema "${msg} ni mbaya ama noma?" Unataka tafsiri gani msee?`;
}
app.post('/api/chat',(req,res)=>{
const ip=req.headers['x-forwarded-for']||req.ip;const {message,mpesaCode}=req.body;
let count=users.get(ip)||0;const isPaid=mpesaCode&&mpesaCode.toString().toUpperCase().startsWith('Q');
if(count>=FREE_LIMIT&&!isPaid){return res.json({needPayment:true,message:"Bro, umemaliza 10 free! Lipa KSh 99 na M-Pesa ndio uendelee.",paybill:"Till: 123456 - KSh 99"});}
if(!isPaid)users.set(ip,count+1);
res.json({reply:smartReply(message),remaining:isPaid?'UNLIMITED':`${FREE_LIMIT-(count+1)} free`,needPayment:false});
});
app.post('/api/mpesa/stk',(req,res)=>{res.json({success:true,message:`STK imetumwa kwa ${req.body.phone}. Lipa 99 utapata code Q.`});});
app.get('*',(req,res)=>{res.sendFile(path.join(__dirname,'public','index.html'));});
app.listen(process.env.PORT||3000,()=>console.log('LIVE'));
