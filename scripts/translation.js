import fs from 'fs';
import path from 'path';
import { translate } from '@vitalets/google-translate-api';
// import { HttpProxyAgent } from 'http-proxy-agent';

// const agent = new HttpProxyAgent('http://103.152.112.162:80');
const baseLang = 'en';
const localesDir = path.join(process.cwd(), 'public/locales');
const baseFilePath = path.join(localesDir, baseLang, 'common.json');
const baseFile = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'));
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

async function updateTranslations() {
  for (const locale of supportedLocales) {
    const targetPath = path.join(localesDir, locale, 'common.json');
    let targetTranslations = {};
    
    try {
      targetTranslations = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
    } catch {
      console.warn(`Could not load ${locale}, starting fresh.`);
    }
    
    console.log(`\nProcessing locale: ${locale}`);
    
    // Create a completely new structure based on the base file
    // This ensures deletions are handled and structure is maintained
    const updatedTranslations = await translateNestedObject(baseFile, locale, targetTranslations);
    
    // Write with the same formatting as the base file (2-space indentation)
    fs.writeFileSync(targetPath, JSON.stringify(updatedTranslations, null, 2), 'utf-8');
    
    console.log(`✅ Updated ${locale}/common.json`);
  }
  
  console.log('\n🎉 All translations updated successfully!');
}

updateTranslations().catch(console.error);