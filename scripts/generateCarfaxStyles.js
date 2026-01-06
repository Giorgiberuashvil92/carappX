const fs = require('fs');
const path = require('path');

// CSS ფაილის წაკითხვა
const cssPath = path.join(__dirname, '../assets/styles/app.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// TypeScript ფაილის შექმნა
const tsContent = `// CarFAX CSS სტილები - ავტომატურად გენერირებული
// DO NOT EDIT - ეს ფაილი გენერირებულია assets/styles/app.css-დან

export const CARFAX_CSS = \`${cssContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
`;

// TypeScript ფაილის ჩაწერა
const tsPath = path.join(__dirname, '../utils/carfaxStyles.ts');
fs.writeFileSync(tsPath, tsContent, 'utf8');

console.log('✅ CSS ფაილი წარმატებით გადაკეთდა TypeScript-ში');
console.log(`📄 შექმნილია: ${tsPath}`);

