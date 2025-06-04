const fs = require('fs');
const path = require('path');
const { translate } = require('@vitalets/google-translate-api');
// import { HttpProxyAgent } from 'http-proxy-agent';
// const agent = new HttpProxyAgent('http://103.152.112.162:80');

const baseLang = 'en';
const localesDir = path.join(process.cwd(), 'public/locales');

// Files to translate
const filesToTranslate = ['common.json', 'questions.json'];

const supportedLocales = fs.readdirSync(localesDir).filter((l) => l !== baseLang);

async function translateText(text, to) {
  try {
    const res = await translate(text, { to });
    // const res = await translate(text, { to: to, fetchOptions: {agent} });
    return res.text;
  } catch (e) {
    console.error(`Translation failed for "${text}" to "${to}":`, e);
    return text; // Return original text if translation fails
  }
}

async function translateNestedObject(obj, locale, existingTranslations = {}) {
  const result = {};
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      // Handle nested objects recursively
      result[key] = await translateNestedObject(
        obj[key],
        locale,
        existingTranslations[key] || {}
      );
    } else if (Array.isArray(obj[key])) {
      // Handle arrays
      result[key] = [];
      for (let i = 0; i < obj[key].length; i++) {
        if (existingTranslations[key] && existingTranslations[key][i]) {
          // Use existing translation if available
          result[key][i] = existingTranslations[key][i];
        } else {
          // Translate new array item
          if (key === "icon") { // Special case for icons, do not translate
            result[key][i] = obj[key][i];
            console.log(`Skipping translation for icon [${key}[${i}]]: ${obj[key][i]}`);
            continue;
          }
          const translated = await translateText(obj[key][i], locale);
          result[key][i] = translated;
          console.log(`Translated [${key}[${i}]]: ${obj[key][i]} → ${translated}`);
        }
      }
    } else {
      // Handle primitive values (strings, numbers, etc.)
      if (existingTranslations[key]) {
        // Use existing translation
        result[key] = existingTranslations[key];
      } else {
        // Translate new key
        if (typeof obj[key] === 'string') {
          const translated = await translateText(obj[key], locale);
          result[key] = translated;
          console.log(`Translated [${key}]: ${obj[key]} → ${translated}`);
        } else {
          // For non-string primitives (numbers, booleans), keep as is
          result[key] = obj[key];
        }
      }
    }
  }
  
  return result;
}

async function translateFile(fileName, locale) {
  const baseFilePath = path.join(localesDir, baseLang, fileName);
  const targetPath = path.join(localesDir, locale, fileName);
  
  // Check if base file exists
  if (!fs.existsSync(baseFilePath)) {
    console.warn(`Base file ${baseFilePath} does not exist, skipping.`);
    return;
  }
  
  const baseFile = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'));
  let targetTranslations = {};
  
  try {
    targetTranslations = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
  } catch {
    console.warn(`Could not load ${locale}/${fileName}, starting fresh.`);
  }
  
  console.log(`\nProcessing ${fileName} for locale: ${locale}`);
  
  // Create a completely new structure based on the base file
  // This ensures deletions are handled and structure is maintained
  const updatedTranslations = await translateNestedObject(baseFile, locale, targetTranslations);
  
  // Ensure the target directory exists
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Write with the same formatting as the base file (2-space indentation)
  fs.writeFileSync(targetPath, JSON.stringify(updatedTranslations, null, 2), 'utf-8');
  console.log(`✅ Updated ${locale}/${fileName}`);
}

async function updateTranslations() {
  for (const locale of supportedLocales) {
    console.log(`\n🌍 Processing locale: ${locale}`);
    
    for (const fileName of filesToTranslate) {
      await translateFile(fileName, locale);
    }
  }
  
  console.log('\n🎉 All translations updated successfully!');
}

updateTranslations().catch(console.error);