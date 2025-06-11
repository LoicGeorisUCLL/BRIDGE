const fs = require('fs');
const path = require('path');
const { translate } = require('@vitalets/google-translate-api');
require('dotenv').config();

const baseLang = 'en';
const localesDir = path.join(process.cwd(), 'public/locales');

const supportedLocales = fs.readdirSync(localesDir).filter((l) => l !== baseLang);

async function translateText(text, to) {
  try {
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`Translating "${text}" from ${baseLang} to ${to}`);
    
    // Use the imported translate function directly
    const result = await translate(text, { 
      to: to 
    });
    
    console.log(`Translation result: "${result.text}"`);
    return result.text;
    
  } catch (e) {
    console.error(`Translation failed for "${text}" to "${to}":`, e);
    // Return original text if translation fails
    return text;
  }
}

// async function translateText(text, to) {
//   try {
//     await new Promise(resolve => setTimeout(resolve, 200));
    
//     const baseUrl = process.env.TRANSLATE_URL;
//     console.log(`Using translation service: ${baseUrl}`);
    
//     const response = await fetch(`${baseUrl}`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         q: text,
//         source: 'en',
//         target: to,
//         format: 'text'
//       })
//     });
    
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
    
//     const result = await response.json();

//     return result.translatedText;
//   } catch (e) {
//     console.error(`Translation failed for "${text}" to "${to}":`, e);
//     return text;
//   }
// }

// Helper function to get nested value from object using dot notation path
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return current[key];
    }
    return undefined;
  }, obj);
}

// Helper function to set nested value in object using dot notation path
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!(key in current)) {
      // Check if the next key is a number to determine if we should create an array
      const nextKey = keys[keys.indexOf(key) + 1];
      if (nextKey && !isNaN(parseInt(nextKey))) {
        current[key] = [];
      } else {
        current[key] = {};
      }
    }
    return current[key];
  }, obj);
  
  // Handle array indices
  if (!isNaN(parseInt(lastKey))) {
    const index = parseInt(lastKey);
    if (!Array.isArray(target)) {
      // Convert object to array if needed
      const arr = [];
      Object.keys(target).forEach(k => {
        if (!isNaN(parseInt(k))) {
          arr[parseInt(k)] = target[k];
        }
      });
      // Replace the target with the array
      const parentKeys = keys.slice(0, -1);
      const parentTarget = parentKeys.reduce((current, key) => current[key], obj);
      const parentKey = keys[keys.length - 1];
      parentTarget[parentKey] = arr;
      arr[index] = value;
    } else {
      target[index] = value;
    }
  } else {
    target[lastKey] = value;
  }
}

// Function to get all paths in a nested object - FIXED VERSION
function getAllPaths(obj, prefix = '') {
  const paths = [];
  
  for (const key in obj) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      // Handle nested objects recursively
      paths.push(...getAllPaths(obj[key], currentPath));
    } else if (Array.isArray(obj[key])) {
      // Handle arrays - translate the entire array as one unit
      if (obj[key].every(item => typeof item === 'string')) {
        // If all items in array are strings, add the array path itself
        paths.push(currentPath);
      } else {
        // Handle arrays with mixed content or objects
        for (let i = 0; i < obj[key].length; i++) {
          if (typeof obj[key][i] === 'string') {
            paths.push(`${currentPath}.${i}`);
          } else if (typeof obj[key][i] === 'object' && obj[key][i] !== null) {
            // Handle arrays of objects
            paths.push(...getAllPaths(obj[key][i], `${currentPath}.${i}`));
          } else {
            paths.push(`${currentPath}.${i}`);
          }
        }
      }
    } else {
      // Handle primitive values
      paths.push(currentPath);
    }
  }
  
  return paths;
}

// New function to translate arrays of strings
async function translateStringArray(arr, locale) {
  const translatedArray = [];
  for (const item of arr) {
    if (typeof item === 'string' && item.trim() !== '') {
      try {
        const translated = await translateText(item, locale);
        translatedArray.push(translated);
      } catch (error) {
        console.error(`Failed to translate array item: "${item}"`);
        translatedArray.push(item);
      }
    } else {
      translatedArray.push(item);
    }
  }
  return translatedArray;
}

async function translateNestedObject(baseObj, locale, existingTranslations = {}, sourceTracker = {}) {
  const result = {};
  const newSourceTracker = {};
  let translationCount = 0;
  
  // Get all paths in the base object
  const allPaths = getAllPaths(baseObj);
  
  for (const path of allPaths) {
    const baseValue = getNestedValue(baseObj, path);
    const existingTranslation = getNestedValue(existingTranslations, path);
    const trackedSourceValue = getNestedValue(sourceTracker, path);
    
    // Skip translation for icon fields and empty arrays
    if (path.includes('.icon') || path.endsWith('.icon') || 
        (Array.isArray(baseValue) && baseValue.length === 0)) {
      setNestedValue(result, path, baseValue);
      setNestedValue(newSourceTracker, path, baseValue);
      console.log(`⏭️  Skipping [${path}]: ${JSON.stringify(baseValue)}`);
      continue;
    }
    
    // Determine if we need to translate
    let needsTranslation = false;
    let reason = '';
    
    if (!existingTranslation) {
      needsTranslation = true;
      reason = 'new key';
    } else if (trackedSourceValue === undefined) {
      needsTranslation = true;
      reason = 'no source tracking (legacy)';
    } else if (JSON.stringify(trackedSourceValue) !== JSON.stringify(baseValue)) {
      needsTranslation = true;
      reason = 'source value changed';
    }
    
    // Handle array of strings
    if (Array.isArray(baseValue) && baseValue.every(item => typeof item === 'string')) {
      if (needsTranslation) {
        try {
          const translatedArray = await translateStringArray(baseValue, locale);
          setNestedValue(result, path, translatedArray);
          setNestedValue(newSourceTracker, path, baseValue);
          translationCount += baseValue.length;
          console.log(`🔄 Translated array [${path}] (${reason}): ${JSON.stringify(baseValue)} → ${JSON.stringify(translatedArray)}`);
        } catch (error) {
          console.error(`❌ Failed to translate array [${path}]: ${JSON.stringify(baseValue)}`);
          setNestedValue(result, path, baseValue);
          setNestedValue(newSourceTracker, path, baseValue);
        }
      } else if (existingTranslation) {
        setNestedValue(result, path, existingTranslation);
        setNestedValue(newSourceTracker, path, baseValue);
        console.log(`✅ Kept existing array [${path}]: ${JSON.stringify(existingTranslation)}`);
      } else {
        setNestedValue(result, path, baseValue);
        setNestedValue(newSourceTracker, path, baseValue);
      }
    }
    // Handle single strings
    else if (needsTranslation && typeof baseValue === 'string' && baseValue.trim() !== '') {
      try {
        const translated = await translateText(baseValue, locale);
        setNestedValue(result, path, translated);
        setNestedValue(newSourceTracker, path, baseValue);
        translationCount++;
        console.log(`🔄 Translated [${path}] (${reason}): "${baseValue}" → "${translated}"`);
      } catch (error) {
        console.error(`❌ Failed to translate [${path}]: "${baseValue}"`);
        setNestedValue(result, path, baseValue);
        setNestedValue(newSourceTracker, path, baseValue);
      }
    } else if (existingTranslation) {
      // Use existing translation
      setNestedValue(result, path, existingTranslation);
      setNestedValue(newSourceTracker, path, baseValue);
      console.log(`✅ Kept existing [${path}]: "${existingTranslation}"`);
    } else {
      // For non-string primitives (numbers, booleans), keep as is
      setNestedValue(result, path, baseValue);
      setNestedValue(newSourceTracker, path, baseValue);
      if (typeof baseValue !== 'string') {
        console.log(`📋 Copied non-string [${path}]: ${JSON.stringify(baseValue)}`);
      }
    }
  }
  
  return { translations: result, sourceTracker: newSourceTracker, translationCount };
}

async function translateFile(fileName, locale) {
  const baseFilePath = path.join(localesDir, baseLang, fileName);
  const targetPath = path.join(localesDir, locale, fileName);
  const sourceTrackerPath = path.join(localesDir, locale, `.${fileName}.source-tracker.json`);
  
  // Check if base file exists
  if (!fs.existsSync(baseFilePath)) {
    console.warn(`⚠️  Base file ${baseFilePath} does not exist, skipping.`);
    return 0;
  }
  
  let baseFile;
  try {
    baseFile = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'));
  } catch (error) {
    console.error(`❌ Failed to parse base file ${baseFilePath}:`, error.message);
    return 0;
  }
  
  let targetTranslations = {};
  let sourceTracker = {};
  
  // Load existing translations
  try {
    targetTranslations = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
    console.log(`📖 Loaded existing translations for ${locale}/${fileName}`);
  } catch {
    console.warn(`⚠️  Could not load ${locale}/${fileName}, starting fresh.`);
  }
  
  // Load source tracker
  try {
    sourceTracker = JSON.parse(fs.readFileSync(sourceTrackerPath, 'utf-8'));
    console.log(`📊 Loaded source tracker for ${locale}/${fileName}`);
  } catch {
    console.warn(`⚠️  Could not load source tracker for ${locale}/${fileName}, starting fresh.`);
  }
  
  console.log(`\n📋 Processing ${fileName} for locale: ${locale}`);
  
  // Translate with change detection
  const result = await translateNestedObject(baseFile, locale, targetTranslations, sourceTracker);
  
  // Ensure the target directory exists
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`📁 Created directory: ${targetDir}`);
  }
  
  // Write translations file
  fs.writeFileSync(targetPath, JSON.stringify(result.translations, null, 2), 'utf-8');
  
  // Write source tracker file (hidden file to track source values)
  fs.writeFileSync(sourceTrackerPath, JSON.stringify(result.sourceTracker, null, 2), 'utf-8');
  
  console.log(`✅ Updated ${locale}/${fileName} (${result.translationCount} new/changed translations)`);
  
  return result.translationCount;
}

async function updateTranslations(fileName) {
  // Validate file name
  if (!fileName.endsWith('.json')) {
    fileName += '.json';
  }
  
  // Check if the base file exists
  const baseFilePath = path.join(localesDir, baseLang, fileName);
  if (!fs.existsSync(baseFilePath)) {
    console.error(`❌ Base file ${baseFilePath} does not exist!`);
    console.log('📂 Available files:');
    const baseDir = path.join(localesDir, baseLang);
    if (fs.existsSync(baseDir)) {
      const availableFiles = fs.readdirSync(baseDir).filter(f => f.endsWith('.json'));
      availableFiles.forEach(file => console.log(`  - ${file}`));
    } else {
      console.log(`  Directory ${baseDir} does not exist!`);
    }
    return;
  }
  
  console.log(`🌍 Translating ${fileName} for ${supportedLocales.length} locales: ${supportedLocales.join(', ')}`);
  
  let totalTranslations = 0;
  
  for (const locale of supportedLocales) {
    console.log(`\n📍 Processing locale: ${locale}`);
    try {
      const count = await translateFile(fileName, locale);
      totalTranslations += count || 0;
    } catch (error) {
      console.error(`❌ Error processing locale ${locale}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Translation completed successfully!`);
  console.log(`📊 Total new/changed translations: ${totalTranslations}`);
  
  if (totalTranslations === 0) {
    console.log(`ℹ️  All translations are up to date!`);
  }
}

// Get command line argument
const fileName = process.argv[2];

if (!fileName) {
  console.error('❌ Please provide a file name as an argument.');
  console.log('Usage: node script.js <filename>');
  console.log('Examples:');
  console.log('  node script.js common.json');
  console.log('  node script.js questions');
  console.log('  node script.js tasks');
  console.log('  node script.js common');
  process.exit(1);
}

updateTranslations(fileName).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});