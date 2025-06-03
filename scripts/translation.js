import fs from 'fs';
import path from 'path';
import { translateText } from './translate-api'; // Your wrapper for DeepL/Google Translate

const baseLang = 'en';
const localesDir = path.join(process.cwd(), 'locales');
const baseFile = require(path.join(localesDir, baseLang, 'common.js'));

const supportedLocales = fs.readdirSync(localesDir).filter(l => l !== baseLang);

async function updateTranslations() {
  for (const locale of supportedLocales) {
    const targetPath = path.join(localesDir, locale, 'common.js');
    let targetTranslations = {};

    try {
      targetTranslations = require(targetPath);
    } catch (e) {
      console.warn(`Could not load ${locale}, starting fresh.`);
    }

    const updatedTranslations = { ...targetTranslations };

    for (const key in baseFile) {
      if (!targetTranslations[key]) {
        const translated = await translateText(baseFile[key], baseLang, locale);
        updatedTranslations[key] = translated;
        console.log(`Translated [${key}]: ${baseFile[key]} → ${translated}`);
      }
    }

    fs.writeFileSync(
      targetPath,
      'module.exports = ' + JSON.stringify(updatedTranslations, null, 2),
      'utf-8'
    );
  }
}

updateTranslations();
