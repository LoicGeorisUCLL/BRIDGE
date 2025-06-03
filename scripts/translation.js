import fs from 'fs';
import path from 'path';
import { translateText } from './translation-api'; // Same as before

const baseLang = 'en';
const localesDir = path.join(process.cwd(), 'locales');
const baseFilePath = path.join(localesDir, baseLang, 'common.json');
const baseFile = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'));

const supportedLocales = fs.readdirSync(localesDir).filter((l) => l !== baseLang);

async function updateTranslations() {
  for (const locale of supportedLocales) {
    const targetPath = path.join(localesDir, locale, 'common.json');
    let targetTranslations = {};

    try {
      targetTranslations = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
    } catch {
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

    fs.writeFileSync(targetPath, JSON.stringify(updatedTranslations, null, 2), 'utf-8');
  }
}

updateTranslations();
