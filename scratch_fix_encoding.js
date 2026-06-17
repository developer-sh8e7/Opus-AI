const fs = require('fs');
const path = require('path');

const WINDOWS_1252_BYTES = new Map([
  [0x20AC, 0x80],
  [0x201A, 0x82],
  [0x0192, 0x83],
  [0x201E, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02C6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8A],
  [0x2039, 0x8B],
  [0x0152, 0x8C],
  [0x017D, 0x8E],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201C, 0x93],
  [0x201D, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02DC, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9A],
  [0x203A, 0x9B],
  [0x0153, 0x9C],
  [0x017E, 0x9E],
  [0x0178, 0x9F],
]);

const LEGACY_MARKERS = /[ÃÂØÙâð]/;

function repairLegacyText(value) {
  if (!LEGACY_MARKERS.test(value)) return value;

  const bytes = [];
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0xFF) {
      bytes.push(codePoint);
      continue;
    }
    const windowsByte = WINDOWS_1252_BYTES.get(codePoint);
    if (windowsByte !== undefined) {
      bytes.push(windowsByte);
      continue;
    }
    bytes.push(...Buffer.from(character, 'utf8'));
  }

  const repaired = Buffer.from(bytes).toString('utf8');
  return repaired.includes('\uFFFD') ? value : repaired;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        processDirectory(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.md') || file.endsWith('.json')) {
      // Don't modify package-lock.json or build outputs
      if (file === 'package-lock.json' || fullPath.includes('\\dist\\') || fullPath.includes('/dist/')) continue;
      
      const content = fs.readFileSync(fullPath, 'utf8');
      if (LEGACY_MARKERS.test(content)) {
        const repaired = repairLegacyText(content);
        if (repaired !== content) {
          console.log(`Repaired encoding in: ${fullPath}`);
          fs.writeFileSync(fullPath, repaired, 'utf8');
        }
      }
    }
  }
}

const targetDir = path.join(__dirname, 'src');
console.log(`Processing src directory: ${targetDir}`);
processDirectory(targetDir);

// Also process markdown files in the root
const rootFiles = fs.readdirSync(__dirname);
for (const file of rootFiles) {
  if (file.endsWith('.md') || file.endsWith('.js')) {
    if (file === 'scratch_fix_encoding.js') continue;
    const fullPath = path.join(__dirname, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (LEGACY_MARKERS.test(content)) {
      const repaired = repairLegacyText(content);
      if (repaired !== content) {
        console.log(`Repaired encoding in root file: ${file}`);
        fs.writeFileSync(fullPath, repaired, 'utf8');
      }
    }
  }
}

console.log('Done!');
