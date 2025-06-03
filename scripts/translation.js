import fs from 'fs';
import path from 'path';
import { translate } from '@vitalets/google-translate-api';

 
const baseLang = 'en';
const localesDir = path.join(process.cwd(), 'public/locales');
const baseFilePath = path.join(localesDir, baseLang, 'common.json');
const baseFile = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'));

const supportedLocales = fs.readdirSync(localesDir).filter((l) => l !== baseLang);

async function translateText(text, to) {
  try {
    const res = await translate(text, { to });
    return res.text;
  } catch (e) {
    console.error(`Translation failed for "${text}" to "${to}":`, e);
    return '';
  }
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

    const updatedTranslations = { ...targetTranslations };

    for (const key in baseFile) {
      if (!targetTranslations[key]) {
        const translated = await translateText(baseFile[key], locale);
        updatedTranslations[key] = translated;
        console.log(`Translated [${key}]: ${baseFile[key]} → ${translated}`);
      }
    }

    fs.writeFileSync(targetPath, JSON.stringify(updatedTranslations, null, 2), 'utf-8');
  }
}

updateTranslations();
