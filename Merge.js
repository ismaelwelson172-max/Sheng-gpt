const fs = require('fs');

const f1 = JSON.parse(fs.readFileSync('./data/sheng-1000.json','utf8'));
const f2 = JSON.parse(fs.readFileSync('./data/sheng-part2.json','utf8'));
const f3 = JSON.parse(fs.readFileSync('./data/sheng-part3.json','utf8'));

const full = { ...f1, ...f2, ...f3 };

fs.writeFileSync('./data/sheng-full-1000.json', JSON.stringify(full, null, 2));

console.log(`✅ Merged! Total: ${Object.keys(full).length} words`);
