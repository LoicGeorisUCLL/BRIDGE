import translate from '@vitalets/google-translate-api';

export async function translateText(text, from, to) {
  const result = await translate(text, { from, to });
  return result.text;
}
