const fs = require('node:fs');
const assert = require('node:assert/strict');
const src = fs.readFileSync(__dirname + '/lms-layout-v6.js', 'utf8');
const tag = 'const technicalFrench = ';
const start = src.indexOf(tag);
const end = src.indexOf(';\n  function translateTechnicalDescription', start);
assert.ok(start >= 0 && end > start, 'French translation dictionary missing');
const map = JSON.parse(src.slice(start + tag.length, end));
assert.equal(Object.keys(map).length, 40, 'Expected 40 technical descriptions');
for (let i = 1; i <= 40; ++i) {
  assert.equal(typeof map[i], 'string', 'Missing translation for pedal ' + i);
  assert.ok(map[i].trim().length > 55, 'Translation too short for pedal ' + i);
  assert.ok(!/[�]|Ã©|Ã¨|Ãª/.test(map[i]), 'Incorrect UTF-8 in pedal ' + i);
}
assert.ok(src.includes("if (lang !== 'fr') return;"), 'English-language protection missing');
assert.ok(src.includes('translateTechnicalDescription(lang);'), 'UI hook missing');
console.log('40 descriptions FR validées, aucun identifiant manquant, anglais conservé.');
