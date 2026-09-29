import { ItemWithLocations, Language } from '../types';
import {
  isTamil,
  getItemDisplayName,
  getItemBilingualNames,
  DICT_EN_TO_TA,
  DICT_TA_TO_EN,
} from '../utils/itemTranslation';
import {
  getLocalizedLocationName,
  getTamilLocationWithLocative,
} from '../utils/locationTranslation';
import { normalizeSearchTerm } from './items';

export interface AIAssistantResult {
  query: string;
  detectedLanguage: 'en' | 'ta';
  speechLang: 'en-US' | 'ta-IN';
  matchedItem: ItemWithLocations | null;
  extractedItemName: string;
  responseText: string;
  locations: string[];
  status: 'found_with_locations' | 'found_no_locations' | 'item_not_found' | 'general_query';
}

/**
 * Common Tanglish (Tamil written in English script) words and phrases
 * used when asking for item locations.
 */
const TANGLISH_KEYWORDS = [
  'enga',
  'engae',
  'yenga',
  'enge',
  'engiruku',
  'engirukku',
  'iruku',
  'irukku',
  'irukuthu',
  'irukudhu',
  'yen',
  'ennoda',
  'enoda',
  'yenoda',
  'ennudaiya',
  'saavi',
  'kannadi',
  'panappai',
  'marundhu',
  'paaru',
  'thedu',
  'vechen',
  'vechuruken',
  'kaatunga',
  'solunga',
  'kedaikula',
  'kaanom',
  'kanom',
];

/**
 * Tanglish to English word dictionary for common belongings
 */
const TANGLISH_OBJECTS_MAP: Record<string, string> = {
  saavi: 'key',
  savvi: 'key',
  kannadi: 'glasses',
  kannaadi: 'glasses',
  panappai: 'wallet',
  pai: 'bag',
  marundhu: 'medicine',
  mathirai: 'tablets',
  petti: 'box',
  kudai: 'umbrella',
  vandi: 'vehicle',
  pothagam: 'book',
  pusthagam: 'book',
  kannadippa: 'spectacles',
  thoppi: 'cap',
};

/**
 * Detect whether the user's spoken or typed query is in Tamil,
 * English, or Tanglish (Tamil in Latin script).
 */
export function detectQueryLanguage(
  query: string,
  fallbackLang: Language
): 'en' | 'ta' {
  const trimmed = query.trim();
  if (!trimmed) return fallbackLang;

  // 1. Direct Tamil Unicode check
  if (isTamil(trimmed)) {
    return 'ta';
  }

  // 2. Tanglish check (words like 'enga', 'iruku', 'yen key enga', etc.)
  const lower = trimmed.toLowerCase();
  const words = lower.split(/[^a-z0-9]+/);

  for (const word of words) {
    if (TANGLISH_KEYWORDS.includes(word)) {
      return 'ta';
    }
  }

  // Check Tanglish multi-word combinations
  if (
    lower.includes(' enga') ||
    lower.startsWith('enga ') ||
    lower.includes(' iruku') ||
    lower.includes(' irukku') ||
    lower.includes('yen ') ||
    lower.includes('kanom') ||
    lower.includes('kaanom')
  ) {
    return 'ta';
  }

  // 3. English conversational search patterns
  const englishPatterns = [
    'where is',
    'where are',
    'where did',
    'find my',
    'search for',
    'look for',
    'show me',
    'tell me where',
    'what is',
    'can you find',
  ];

  for (const pattern of englishPatterns) {
    if (lower.includes(pattern)) {
      return 'en';
    }
  }

  // Fallback to active app language
  return fallbackLang;
}

/**
 * Extract clean item name from raw query text in English, Tamil, or Tanglish
 */
export function extractItemFromQuery(rawQuery: string): string {
  let cleaned = rawQuery
    .toLowerCase()
    .trim()
    .replace(/[?,.!'"¿¡;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // English prefixes
  const enPrefixes = [
    'where did i put my',
    'where did i keep my',
    'where did i leave my',
    'where can i find my',
    'where are my',
    'where is my',
    'where are the',
    'where is the',
    'tell me where my',
    'show me my',
    'find my',
    'search for my',
    'search my',
    'look for my',
    'look for',
    'where my',
    'where',
  ];

  for (const prefix of enPrefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length).trim();
      break;
    }
  }

  // Tamil prefixes
  const taPrefixes = [
    'என் ',
    'எங்கே ',
    'எங்க ',
    'எங்கே இருக்கிறது ',
    'எங்க இருக்கு ',
    'எங்கே உள்ளது ',
    'பொருளைக் கண்டுபிடி ',
    'கண்டுபிடி ',
  ];

  for (const prefix of taPrefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length).trim();
      break;
    }
  }

  // Tanglish prefixes
  const tanglishPrefixes = [
    'yenoda ',
    'ennoda ',
    'enoda ',
    'ennudaiya ',
    'yen ',
    'en ',
  ];

  for (const prefix of tanglishPrefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length).trim();
      break;
    }
  }

  // Tanglish & Tamil suffixes
  const suffixes = [
    ' enga iruku',
    ' enga irukku',
    ' enga irukuthu',
    ' enga',
    ' yenga iruku',
    ' yenga',
    ' enge irukku',
    ' enge',
    ' iruku',
    ' irukku',
    ' kanom',
    ' kaanom',
    ' எங்கே இருக்கு',
    ' எங்க இருக்கு',
    ' எங்கே உள்ளது',
    ' எங்கே',
    ' எங்க',
  ];

  for (const suffix of suffixes) {
    if (cleaned.endsWith(suffix)) {
      cleaned = cleaned.slice(0, -suffix.length).trim();
      break;
    }
  }

  return cleaned;
}

/**
 * Helper to ensure an English location name begins with "the " (unless already present)
 */
function withArticle(loc: string): string {
  const trimmed = loc.trim();
  if (/^the\s+/i.test(trimmed)) {
    return trimmed;
  }
  return `the ${trimmed}`;
}

/**
 * Strips leading "the " to prevent duplicate articles in grouped lists
 */
function withoutArticle(loc: string): string {
  return loc.trim().replace(/^the\s+/i, '');
}

/**
 * Formats English location response according to the strict specification:
 * 1 location: "Your key may be in the TV Table. Please check there."
 * 2 locations: "Your key may be in the TV Table or the Bedroom Table. Please check these locations."
 * 3+ locations: "Your key may be in the TV Table, Bedroom Table, or Study Table. Please check these locations."
 */
export function formatEnglishLocationResponse(itemName: string, rawLocations: string[]): string {
  if (rawLocations.length === 0) {
    return `I found your ${itemName}, but no location has been saved for it yet.`;
  }

  const locations = rawLocations.map(loc => getLocalizedLocationName(loc, 'en'));

  if (locations.length === 1) {
    const loc = withArticle(locations[0]);
    return `Your ${itemName} may be in ${loc}. Please check there.`;
  }

  if (locations.length === 2) {
    const loc1 = withArticle(locations[0]);
    const loc2 = withArticle(locations[1]);
    return `Your ${itemName} may be in ${loc1} or ${loc2}. Please check these locations.`;
  }

  // 3 or more locations
  const first = withArticle(locations[0]);
  const middle = locations.slice(1, -1).map(withoutArticle).join(', ');
  const last = withoutArticle(locations[locations.length - 1]);
  const combined = middle ? `${first}, ${middle}, or ${last}` : `${first}, or ${last}`;

  return `Your ${itemName} may be in ${combined}. Please check these locations.`;
}

/**
 * Formats Tamil location response according to the strict specification:
 * 1 location: "நீங்கள் கொடுத்த தகவல்படி, உங்கள் சாவி TV மேசையில் இருக்கலாம். அங்கே முதலில் பாருங்கள்."
 * 2 locations: "நீங்கள் கொடுத்த தகவல்படி, உங்கள் சாவி TV மேசை அல்லது படுக்கையறை மேசையில் இருக்கலாம். இந்த இடங்களை முதலில் பாருங்கள்."
 * 3+ locations: "நீங்கள் கொடுத்த தகவல்படி, உங்கள் சாவி TV மேசை, படுக்கையறை மேசை அல்லது படிப்பு மேசையில் இருக்கலாம். இந்த இடங்களை முதலில் பாருங்கள்."
 */
export function formatTamilLocationResponse(itemName: string, rawLocations: string[]): string {
  if (rawLocations.length === 0) {
    return `உங்கள் ${itemName} சேமிக்கப்பட்டுள்ளது, ஆனால் அதற்கான இடம் இன்னும் சேமிக்கப்படவில்லை.`;
  }

  // Localize all location names into natural Tamil
  const locations = rawLocations.map(loc => getLocalizedLocationName(loc, 'ta'));

  if (locations.length === 1) {
    const locWithSuffix = getTamilLocationWithLocative(locations[0]);
    return `நீங்கள் கொடுத்த தகவல்படி, உங்கள் ${itemName} ${locWithSuffix} இருக்கலாம். அங்கே முதலில் பாருங்கள்.`;
  }

  if (locations.length === 2) {
    const loc1 = locations[0];
    const loc2WithSuffix = getTamilLocationWithLocative(locations[1]);
    return `நீங்கள் கொடுத்த தகவல்படி, உங்கள் ${itemName} ${loc1} அல்லது ${loc2WithSuffix} இருக்கலாம். இந்த இடங்களை முதலில் பாருங்கள்.`;
  }

  // 3 or more locations
  const initial = locations.slice(0, -1).join(', ');
  const lastWithSuffix = getTamilLocationWithLocative(locations[locations.length - 1]);
  return `நீங்கள் கொடுத்த தகவல்படி, உங்கள் ${itemName} ${initial} அல்லது ${lastWithSuffix} இருக்கலாம். இந்த இடங்களை முதலில் பாருங்கள்.`;
}

/**
 * Resolves natural English item name from user query or matched item
 * e.g. "Keys" -> "key", "Wallet" -> "wallet"
 */
export function resolveEnglishItemName(matchedItem: ItemWithLocations, queryTerm?: string): string {
  if (queryTerm) {
    const q = queryTerm.trim().toLowerCase();
    const itemName = matchedItem.item_name.trim().toLowerCase();
    if (itemName === q || itemName === q + 's' || itemName + 's' === q) {
      return q;
    }
  }

  const name = matchedItem.item_name.trim();
  // If item is 'Keys', singularize to 'key' to match user's question "Where is my key?"
  if (name.toLowerCase() === 'keys') {
    return 'key';
  }
  return name.toLowerCase();
}

/**
 * Resolves natural Tamil item name for matched item (e.g. "சாவி")
 */
export function resolveTamilItemName(matchedItem: ItemWithLocations): string {
  return getItemDisplayName(matchedItem, 'ta');
}

/**
 * Formats item name for "Item Not Found" response (e.g. "Key")
 */
function formatCapitalizedItemName(term: string): string {
  const trimmed = term.trim();
  if (!trimmed) return 'Item';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Resolve item against current active user's saved items.
 * Guarantees privacy: operates solely on the supplied items array.
 */
function findMatchingItem(
  extractedTerm: string,
  rawQuery: string,
  userItems: ItemWithLocations[]
): ItemWithLocations | null {
  if (!extractedTerm && !rawQuery) return null;

  const candidateTerms = new Set<string>();
  if (extractedTerm) {
    candidateTerms.add(extractedTerm);
    // Add normalized variations
    normalizeSearchTerm(extractedTerm).forEach(t => candidateTerms.add(t));

    // Tanglish dictionary mapping (e.g. saavi -> key, kannadi -> glasses)
    if (TANGLISH_OBJECTS_MAP[extractedTerm]) {
      const enMapped = TANGLISH_OBJECTS_MAP[extractedTerm];
      candidateTerms.add(enMapped);
      normalizeSearchTerm(enMapped).forEach(t => candidateTerms.add(t));
    }
  }

  // Also extract words from the raw query
  const queryWords = rawQuery
    .toLowerCase()
    .replace(/[?,.!'"¿¡;:()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (const word of queryWords) {
    if (word.length > 2 && !TANGLISH_KEYWORDS.includes(word)) {
      candidateTerms.add(word);
      normalizeSearchTerm(word).forEach(t => candidateTerms.add(t));
      if (TANGLISH_OBJECTS_MAP[word]) {
        candidateTerms.add(TANGLISH_OBJECTS_MAP[word]);
      }
    }
  }

  const termsArray = Array.from(candidateTerms).map(t => t.toLowerCase().trim()).filter(Boolean);

  // 1. Exact match on item_name, name_en, or name_ta
  for (const item of userItems) {
    const itemName = item.item_name.toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    const nameTa = (item.name_ta || '').toLowerCase();

    for (const term of termsArray) {
      if (itemName === term || nameEn === term || nameTa === term) {
        return item;
      }
    }
  }

  // 2. Dictionary translated matches
  for (const item of userItems) {
    const bilingual = getItemBilingualNames(item.item_name, item.id);
    const itemEn = (bilingual.name_en || '').toLowerCase();
    const itemTa = (bilingual.name_ta || '').toLowerCase();

    for (const term of termsArray) {
      // Check if term matches dictionary translations
      const dictTa = DICT_EN_TO_TA[term];
      const dictEn = DICT_TA_TO_EN[term];

      if (
        (dictTa && (dictTa === itemTa || item.item_name.includes(dictTa))) ||
        (dictEn && (dictEn.toLowerCase() === itemEn || item.item_name.toLowerCase().includes(dictEn.toLowerCase())))
      ) {
        return item;
      }
    }
  }

  // 3. Partial substring match
  for (const item of userItems) {
    const itemName = item.item_name.toLowerCase();
    const nameEn = (item.name_en || '').toLowerCase();
    const nameTa = (item.name_ta || '').toLowerCase();

    for (const term of termsArray) {
      if (term.length >= 3) {
        if (
          itemName.includes(term) ||
          term.includes(itemName) ||
          (nameEn && (nameEn.includes(term) || term.includes(nameEn))) ||
          (nameTa && (nameTa.includes(term) || term.includes(nameTa)))
        ) {
          return item;
        }
      }
    }
  }

  return null;
}

/**
 * Main AI Assistant processor:
 * 1. Analyzes the question
 * 2. Identifies requested item
 * 3. Finds item in the current user's saved data
 * 4. Retrieves all saved locations for that item
 * 5. Generates the response in the requested language (English or Tamil)
 * 6. Sets the target Speech Synthesis language (en-US or ta-IN)
 */
export function generateAIAssistantResponse(
  query: string,
  userItems: ItemWithLocations[],
  activeLanguage: Language
): AIAssistantResult {
  const trimmedQuery = query.trim();
  // If active app language is Tamil, always respond in Tamil with ta-IN voice.
  // If active app language is English, respond in English unless query is explicitly in Tamil/Tanglish.
  const detectedLanguage: 'en' | 'ta' =
    activeLanguage === 'ta'
      ? 'ta'
      : detectQueryLanguage(trimmedQuery, 'en');
  const speechLang: 'en-US' | 'ta-IN' = detectedLanguage === 'ta' ? 'ta-IN' : 'en-US';

  if (!trimmedQuery) {
    return {
      query: '',
      detectedLanguage,
      speechLang,
      matchedItem: null,
      extractedItemName: '',
      responseText: '',
      locations: [],
      status: 'general_query',
    };
  }

  const extractedTerm = extractItemFromQuery(trimmedQuery);
  const matchedItem = findMatchingItem(extractedTerm, trimmedQuery, userItems);

  // If item was matched from user's saved items
  if (matchedItem) {
    const validLocations = (matchedItem.locations || [])
      .map(l => l.location_name.trim())
      .filter(Boolean);

    const enItemName = resolveEnglishItemName(matchedItem, extractedTerm);
    const taItemName = resolveTamilItemName(matchedItem);
    const itemDisplayName = detectedLanguage === 'ta' ? taItemName : enItemName;

    // Localized locations for display pills and UI cards
    const displayLocations = validLocations.map(loc =>
      getLocalizedLocationName(loc, detectedLanguage)
    );

    if (validLocations.length > 0) {
      // Item has 1 or more saved locations
      const responseText =
        detectedLanguage === 'ta'
          ? formatTamilLocationResponse(taItemName, validLocations)
          : formatEnglishLocationResponse(enItemName, validLocations);

      return {
        query: trimmedQuery,
        detectedLanguage,
        speechLang,
        matchedItem,
        extractedItemName: itemDisplayName,
        responseText,
        locations: displayLocations,
        status: 'found_with_locations',
      };
    } else {
      // Item found, but NO locations saved yet
      const responseText =
        detectedLanguage === 'ta'
          ? `உங்கள் ${taItemName} சேமிக்கப்பட்டுள்ளது, ஆனால் அதற்கான இடம் இன்னும் சேமிக்கப்படவில்லை.`
          : `I found your ${enItemName}, but no location has been saved for it yet.`;

      return {
        query: trimmedQuery,
        detectedLanguage,
        speechLang,
        matchedItem,
        extractedItemName: itemDisplayName,
        responseText,
        locations: [],
        status: 'found_no_locations',
      };
    }
  }

  // If item was NOT found in user's saved items
  const displayQueryTerm = extractedTerm || trimmedQuery;
  const isGeneralGreeting =
    !extractedTerm ||
    ['hello', 'hi', 'vanakkam', 'வணக்கம்', 'help', 'search', 'ninaivu'].includes(displayQueryTerm.toLowerCase());

  if (isGeneralGreeting) {
    const responseText =
      detectedLanguage === 'ta'
        ? 'நான் உங்கள் நினைவு உதவியாளர். "என் சாவி எங்கே இருக்கு?" என்பது போன்ற கேள்விகளைக் கேட்டு அறியலாம்.'
        : 'I can help you remember where your items are kept. Ask me about any saved item like "Where is my key?".';

    return {
      query: trimmedQuery,
      detectedLanguage,
      speechLang,
      matchedItem: null,
      extractedItemName: displayQueryTerm,
      responseText,
      locations: [],
      status: 'general_query',
    };
  }

  // Specific item query but not saved yet
  const displayItemNotFound =
    detectedLanguage === 'ta'
      ? (DICT_EN_TO_TA[displayQueryTerm.toLowerCase()] ||
         (TANGLISH_OBJECTS_MAP[displayQueryTerm.toLowerCase()] && DICT_EN_TO_TA[TANGLISH_OBJECTS_MAP[displayQueryTerm.toLowerCase()]]) ||
         displayQueryTerm)
      : formatCapitalizedItemName(displayQueryTerm);

  const responseText =
    detectedLanguage === 'ta'
      ? `${displayItemNotFound} என்ற பொருள் சேமிக்கப்படவில்லை. முதலில் அதைச் சேர்க்கவும்.`
      : `I couldn't find a saved item called ${displayItemNotFound}. Please add it first.`;

  return {
    query: trimmedQuery,
    detectedLanguage,
    speechLang,
    matchedItem: null,
    extractedItemName: displayItemNotFound,
    responseText,
    locations: [],
    status: 'item_not_found',
  };
}
