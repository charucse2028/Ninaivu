import { Item, ItemWithLocations, Language } from '../types';

const TRANSLATIONS_STORAGE_KEY = 'ninaivu_item_translations_v2';

// In-memory cache synced with localStorage
let translationsCache: Record<string, { name_en: string; name_ta: string }> = {};

function initCache() {
  try {
    const raw = localStorage.getItem(TRANSLATIONS_STORAGE_KEY);
    if (raw) {
      translationsCache = JSON.parse(raw);
    }
  } catch {
    translationsCache = {};
  }
}

// Initialize immediately in browser
if (typeof window !== 'undefined') {
  initCache();
}

function saveCache() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(TRANSLATIONS_STORAGE_KEY, JSON.stringify(translationsCache));
  } catch (err) {
    console.warn('Failed to persist translations cache:', err);
  }
}

/** Check if text contains Tamil characters (Unicode \u0B80 - \u0BFF) */
export function isTamil(text: string): boolean {
  return /[\u0B80-\u0BFF]/.test(text);
}

/** Comprehensive English to Tamil mapping of everyday objects/belongings */
export const DICT_EN_TO_TA: Record<string, string> = {
  // Essentials & Keys
  key: 'சாவி',
  keys: 'சாவி',
  'house key': 'வீட்டு சாவி',
  'house keys': 'வீட்டு சாவி',
  'car key': 'கார் சாவி',
  'car keys': 'கார் சாவி',
  'bike key': 'பைக் சாவி',
  'bike keys': 'பைக் சாவி',
  'room key': 'அறை சாவி',
  'room keys': 'அறை சாவி',
  'vehicle key': 'வண்டி சாவி',
  'vehicle keys': 'வண்டி சாவி',
  lock: 'பூட்டு',
  padlock: 'பூட்டு',

  // Wallet & Money & Documents
  wallet: 'பணப்பை',
  wallets: 'பணப்பை',
  purse: 'பணப்பை',
  purses: 'பணப்பை',
  'money purse': 'பணப்பை',
  cash: 'ரொக்கப் பணம்',
  money: 'பணம்',
  coins: 'நாணயங்கள்',
  coin: 'நாணயம்',
  'id card': 'அடையாள அட்டை',
  id: 'அடையாள அட்டை',
  'college id': 'கல்லூரி அடையாள அட்டை',
  'college id card': 'கல்லூரி அடையாள அட்டை',
  'school id': 'பள்ளி அடையாள அட்டை',
  'school id card': 'பள்ளி அடையாள அட்டை',
  'office id': 'அலுவலக அடையாள அட்டை',
  'office id card': 'அலுவலக அடையாள அட்டை',
  'aadhar card': 'ஆதார் அட்டை',
  aadhar: 'ஆதார் அட்டை',
  'pan card': 'பான் அட்டை',
  'ration card': 'குடும்ப அட்டை',
  'smart card': 'ஸ்மார்ட் கார்டு',
  'driving license': 'ஓட்டுநர் உரிமம்',
  license: 'உரிமம்',
  passport: 'கடவுச்சீட்டு',
  passbook: 'வங்கிக் கணக்குப் புத்தகம்',
  'bank passbook': 'வங்கிக் கணக்குப் புத்தகம்',
  'cheque book': 'காசோலை புத்தகம்',
  card: 'அட்டை',
  'debit card': 'டெபிட் கார்டு',
  'credit card': 'கிரெடிட் கார்டு',
  'atm card': 'ஏடிஎம் அட்டை',
  files: 'கோப்புகள்',
  file: 'கோப்பு',
  documents: 'ஆவணங்கள்',
  document: 'ஆவணம்',
  receipt: 'ரசீது',
  bill: 'ரசீது',

  // Eyewear
  spectacles: 'மூக்குக்கண்ணாடி',
  spectacle: 'மூக்குக்கண்ணாடி',
  glasses: 'மூக்குக்கண்ணாடி',
  glass: 'கண்ணாடி',
  'reading glasses': 'மூக்குக்கண்ணாடி',
  'eye glasses': 'மூக்குக்கண்ணாடி',
  sunglasses: 'சூரியக் கண்ணாடி',
  sunglass: 'சூரியக் கண்ணாடி',

  // Gadgets & Electronics
  charger: 'சார்ஜர்',
  chargers: 'சார்ஜர்',
  'mobile charger': 'மொபைல் சார்ஜர்',
  'phone charger': 'போன் சார்ஜர்',
  'laptop charger': 'லேப்டாப் சார்ஜர்',
  cable: 'கேபிள்',
  'charging cable': 'சார்ஜிங் கேபிள்',
  phone: 'அலைபேசி',
  mobile: 'அலைபேசி',
  'mobile phone': 'அலைபேசி',
  smartphone: 'ஸ்மார்ட்போன்',
  telephone: 'தொலைபேசி',
  cellphone: 'அலைபேசி',
  tablet: 'டேப்லெட்',
  ipad: 'ஐபேட்',
  laptop: 'மடிக்கணினி',
  computer: 'கணினி',
  mouse: 'மவுஸ்',
  keyboard: 'விசைப்பலகை',
  pendrive: 'பென்டிரைவ்',
  'pen drive': 'பென்டிரைவ்',
  'power bank': 'பவர் பேங்க்',
  earphones: 'இயர்போன்கள்',
  earphone: 'இயர்போன்',
  headphones: 'ஹெட்போன்கள்',
  headphone: 'ஹெட்போன்',
  airpods: 'ஏர்பாட்ஸ்',
  earbuds: 'இயர்பட்ஸ்',
  torch: 'டார்ச் லைட்',
  flashlight: 'டார்ச் லைட்',
  remote: 'ரிமோட்',
  'tv remote': 'டிவி ரிமோட்',
  'ac remote': 'ஏசி ரிமோட்',
  radio: 'வானொலி',
  calculator: 'கால்குலேட்டர்',

  // Time & Accessories
  watch: 'கைக்கடிகாரம்',
  watches: 'கைக்கடிகாரம்',
  'wrist watch': 'கைக்கடிகாரம்',
  'smart watch': 'ஸ்மார்ட் வாட்ச்',
  smartwatch: 'ஸ்மார்ட் வாட்ச்',
  clock: 'கடிகாரம்',
  ring: 'மோதிரம்',
  'gold ring': 'தங்க மோதிரம்',
  chain: 'சங்கிலி',
  'gold chain': 'தங்கச் சங்கிலி',
  necklace: 'மாலை',
  earrings: 'தோடு',
  earring: 'தோடு',
  bangles: 'வளையல்கள்',
  bangle: 'வளையல்',
  bracelet: 'காப்பு',
  belt: 'இடுப்புப் பட்டை',
  cap: 'தொப்பி',
  hat: 'தொப்பி',
  helmet: 'ஹெல்மெட்',
  umbrella: 'குடை',

  // Bags
  bag: 'பை',
  bags: 'பை',
  backpack: 'முதுகுப்பை',
  'college bag': 'கல்லூரி பை',
  'school bag': 'பள்ளி பை',
  handbag: 'கைப்பை',
  'hand bag': 'கைப்பை',
  'travel bag': 'பயணப் பை',
  suitcase: 'பெட்டி',
  luggage: 'பயணப் பொதி',

  // Health & Medicine
  'walking stick': 'ஊன்றுகோல்',
  stick: 'கைத்தடி',
  cane: 'ஊன்றுகோல்',
  medicine: 'மருந்து',
  medicines: 'மருந்துகள்',
  tablets: 'மாத்திரைகள்',
  pills: 'மாத்திரைகள்',
  pill: 'மாத்திரை',
  syrup: 'மருந்து திரவம்',
  ointment: 'களிம்பு',
  inhaler: 'இன்ஹேலர்',
  'hearing aid': 'கேட்கும் கருவி',
  thermometer: 'வெப்பமானி',
  'bp monitor': 'ரத்த அழுத்த மானி',
  'blood pressure monitor': 'ரத்த அழுத்த மானி',
  'glucometer': 'சர்க்கரை அளவு மானி',
  'band aid': 'பேண்டேஜ்',
  bandage: 'கட்டுத்துணி',
  mask: 'முகக்கவசம்',

  // Stationery & Study
  pen: 'பேனா',
  pens: 'பேனாக்கள்',
  pencil: 'பென்சில்',
  pencils: 'பென்சில்கள்',
  eraser: 'அழிப்பான்',
  sharpener: 'சீவி',
  scale: 'அளவுகோல்',
  ruler: 'அளவுகோல்',
  book: 'புத்தகம்',
  books: 'புத்தகங்கள்',
  notebook: 'நோட்டுப் புத்தகம்',
  diary: 'நாட்குறிப்பு',
  calendar: 'நாள்காட்டி',
  newspaper: 'செய்தித்தாள்',
  magazine: 'பத்திரிகை',

  // Clothing & Personal
  shoes: 'காலணிகள்',
  shoe: 'காலணி',
  footwear: 'காலணி',
  slippers: 'செருப்பு',
  slipper: 'செருப்பு',
  chappal: 'செருப்பு',
  sandals: 'செருப்பு',
  socks: 'காலுறைகள்',
  clothes: 'துணிகள்',
  cloth: 'துணி',
  shirt: 'சட்டை',
  pant: 'கால்சட்டை',
  pants: 'கால்சட்டை',
  saree: 'புடவை',
  dhoti: 'வேஷ்டி',
  towel: 'துண்டு',
  handkerchief: 'கைக்குட்டை',
  comb: 'சீப்பு',
  scissors: 'கத்தரிக்கோல்',
  'nail cutter': 'நகவெட்டி',
  mirror: 'கண்ணாடி',
  soap: 'சோப்பு',
  shampoo: 'ஷாம்பு',
  toothpaste: 'பற்பசை',
  toothbrush: 'பல் துலக்கி',
  oil: 'எண்ணெய்',
  'hair oil': 'தலைமுடி எண்ணெய்',
  powder: 'பவுடர்',
  cream: 'கிரீம்',
  perfume: 'வாசனை திரவியம்',

  // Household & Kitchen
  'water bottle': 'தண்ணீர் பாட்டில்',
  bottle: 'பாட்டில்',
  flask: 'பிளாஸ்க்',
  cup: 'கோப்பை',
  mug: 'குவளை',
  plate: 'தட்டு',
  spoon: 'கரண்டி',
  fork: 'முள் கரண்டி',
  knife: 'கத்தி',
  vessel: 'பாத்திரம்',
  pillow: 'தலையணை',
  bedsheet: 'படுக்கை விரிப்பு',
  blanket: 'போர்வை',
  mat: 'பாய்',
  'iron box': 'இஸ்திரி பெட்டி',
};

/** Tamil to English mapping */
export const DICT_TA_TO_EN: Record<string, string> = {
  // Keys & Locks
  சாவி: 'Keys',
  'வீட்டு சாவி': 'House Key',
  'கார் சாவி': 'Car Key',
  'பைக் சாவி': 'Bike Key',
  'அறை சாவி': 'Room Key',
  'வண்டி சாவி': 'Vehicle Keys',
  பூட்டு: 'Lock',

  // Wallets & Cards
  பணப்பை: 'Wallet',
  'ரொக்கப் பணம்': 'Cash',
  பணம்: 'Money',
  நாணயம்: 'Coin',
  நாணயங்கள்: 'Coins',
  'அடையாள அட்டை': 'ID Card',
  'கல்லூரி அடையாள அட்டை': 'College ID Card',
  'பள்ளி அடையாள அட்டை': 'School ID Card',
  'அலுவலக அடையாள அட்டை': 'Office ID Card',
  'ஆதார் அட்டை': 'Aadhaar Card',
  'பான் அட்டை': 'PAN Card',
  'குடும்ப அட்டை': 'Ration Card',
  'ஓட்டுநர் உரிமம்': 'Driving License',
  உரிமம்: 'License',
  கடவுச்சீட்டு: 'Passport',
  'வங்கிக் கணக்குப் புத்தகம்': 'Bank Passbook',
  'காசோலை புத்தகம்': 'Cheque Book',
  அட்டை: 'Card',
  கோப்பு: 'File',
  கோப்புகள்: 'Files',
  ஆவணம்: 'Document',
  ஆவணங்கள்: 'Documents',
  ரசீது: 'Receipt',

  // Eyewear
  மூக்குக்கண்ணாடி: 'Spectacles',
  கண்ணாடி: 'Glasses',
  'சூரியக் கண்ணாடி': 'Sunglasses',

  // Electronics & Gadgets
  சார்ஜர்: 'Charger',
  'மொபைல் சார்ஜர்': 'Mobile Charger',
  'போன் சார்ஜர்': 'Phone Charger',
  'லேப்டாப் சார்ஜர்': 'Laptop Charger',
  கேபிள்: 'Cable',
  'சார்ஜிங் கேபிள்': 'Charging Cable',
  அலைபேசி: 'Phone',
  கைப்பேசி: 'Mobile Phone',
  போன்: 'Phone',
  ஸ்மார்ட்போன்: 'Smartphone',
  தொலைபேசி: 'Telephone',
  மடிக்கணினி: 'Laptop',
  கணினி: 'Computer',
  விசைப்பலகை: 'Keyboard',
  மவுஸ்: 'Mouse',
  பென்டிரைவ்: 'Pen Drive',
  'பவர் பேங்க்': 'Power Bank',
  இயர்போன்: 'Earphones',
  இயர்போன்கள்: 'Earphones',
  ஹெட்போன்: 'Headphones',
  ஹெட்போன்கள்: 'Headphones',
  இயர்பட்ஸ்: 'Earbuds',
  'டார்ச் லைட்': 'Flashlight',
  ரிமோட்: 'Remote',
  'டிவி ரிமோட்': 'TV Remote',
  'ஏசி ரிமோட்': 'AC Remote',
  வானொலி: 'Radio',
  கால்குலேட்டர்: 'Calculator',

  // Watches & Accessories
  கைக்கடிகாரம்: 'Watch',
  வாட்ச்: 'Watch',
  'ஸ்மார்ட் வாட்ச்': 'Smart Watch',
  கடிகாரம்: 'Clock',
  மோதிரம்: 'Ring',
  'தங்க மோதிரம்': 'Gold Ring',
  சங்கிலி: 'Chain',
  'தங்கச் சங்கிலி': 'Gold Chain',
  மாலை: 'Necklace',
  தோடு: 'Earrings',
  வளையல்: 'Bangle',
  வளையல்கள்: 'Bangles',
  காப்பு: 'Bracelet',
  'இடுப்புப் பட்டை': 'Belt',
  தொப்பி: 'Cap',
  ஹெல்மெட்: 'Helmet',
  குடை: 'Umbrella',

  // Bags
  பை: 'Bag',
  முதுகுப்பை: 'Backpack',
  'கல்லூரி பை': 'College Bag',
  'பள்ளி பை': 'School Bag',
  கைப்பை: 'Handbag',
  'பயணப் பை': 'Travel Bag',
  பெட்டி: 'Suitcase',

  // Health
  ஊன்றுகோல்: 'Walking Stick',
  கைத்தடி: 'Walking Stick',
  மருந்து: 'Medicine',
  மருந்துகள்: 'Medicines',
  மாத்திரை: 'Tablets',
  மாத்திரைகள்: 'Tablets',
  'கேட்கும் கருவி': 'Hearing Aid',
  வெப்பமானி: 'Thermometer',
  'ரத்த அழுத்த மானி': 'BP Monitor',
  'சர்க்கரை அளவு மானி': 'Glucometer',
  இன்ஹேலர்: 'Inhaler',
  முகக்கவசம்: 'Face Mask',

  // Stationery
  பேனா: 'Pen',
  பேனாக்கள்: 'Pens',
  பென்சில்: 'Pencil',
  பென்சில்கள்: 'Pencils',
  அழிப்பான்: 'Eraser',
  அளவுகோல்: 'Ruler',
  புத்தகம்: 'Book',
  புத்தகங்கள்: 'Books',
  'நோட்டுப் புத்தகம்': 'Notebook',
  நாட்குறிப்பு: 'Diary',
  நாள்காட்டி: 'Calendar',
  செய்தித்தாள்: 'Newspaper',

  // Clothing & Daily
  காலணி: 'Footwear',
  காலணிகள்: 'Shoes',
  செருப்பு: 'Slippers',
  காலுறைகள்: 'Socks',
  துணி: 'Cloth',
  துணிகள்: 'Clothes',
  சட்டை: 'Shirt',
  கால்சட்டை: 'Pants',
  புடவை: 'Saree',
  வேஷ்டி: 'Dhoti',
  துண்டு: 'Towel',
  கைக்குட்டை: 'Handkerchief',
  சீப்பு: 'Comb',
  கத்தரிக்கோல்: 'Scissors',
  நகவெட்டி: 'Nail Cutter',
  சோப்பு: 'Soap',
  ஷாம்பு: 'Shampoo',
  பற்பசை: 'Toothpaste',
  'பல் துலக்கி': 'Toothbrush',

  // Kitchen / Home
  'தண்ணீர் பாட்டில்': 'Water Bottle',
  பாட்டில்: 'Bottle',
  பிளாஸ்க்: 'Flask',
  கோப்பை: 'Cup',
  குவளை: 'Mug',
  தட்டு: 'Plate',
  கரண்டி: 'Spoon',
  கத்தி: 'Knife',
  தலையணை: 'Pillow',
  'படுக்கை விரிப்பு': 'Bedsheet',
  போர்வை: 'Blanket',
  பாய்: 'Mat',
  'இஸ்திரி பெட்டி': 'Iron Box',
};

/**
 * Normalizes an English term (strips punctuation, handles trailing plurals).
 */
function findInEnDict(term: string): string | undefined {
  const clean = term.toLowerCase().trim();
  if (DICT_EN_TO_TA[clean]) return DICT_EN_TO_TA[clean];

  // Try singular version if ends in s
  if (clean.endsWith('es') && DICT_EN_TO_TA[clean.slice(0, -2)]) {
    return DICT_EN_TO_TA[clean.slice(0, -2)];
  }
  if (clean.endsWith('s') && DICT_EN_TO_TA[clean.slice(0, -1)]) {
    return DICT_EN_TO_TA[clean.slice(0, -1)];
  }

  // Check substring root
  for (const [key, val] of Object.entries(DICT_EN_TO_TA)) {
    if (clean.includes(key) && key.length > 2) {
      return val;
    }
  }

  return undefined;
}

/**
 * Normalizes a Tamil term to find English translation.
 */
function findInTaDict(term: string): string | undefined {
  const clean = term.trim();
  if (DICT_TA_TO_EN[clean]) return DICT_TA_TO_EN[clean];

  // Strip plural suffix கள் if present
  if (clean.endsWith('கள்') && DICT_TA_TO_EN[clean.slice(0, -3)]) {
    return DICT_TA_TO_EN[clean.slice(0, -3)];
  }

  // Check substring root
  for (const [key, val] of Object.entries(DICT_TA_TO_EN)) {
    if (clean.includes(key) && key.length > 1) {
      return val;
    }
  }

  return undefined;
}

/**
 * Extracts bilingual pairs from compound strings like:
 * "சாவி (Key)" -> { name_ta: "சாவி", name_en: "Keys" }
 * "Key (சாவி)" -> { name_en: "Keys", name_ta: "சாவி" }
 * "சாவி / Keys" -> { name_ta: "சாவி", name_en: "Keys" }
 */
function parseCompoundName(raw: string): { name_en?: string; name_ta?: string } {
  // Matches "Part1 (Part2)"
  const parenMatch = raw.match(/^(.+?)\s*\((.+?)\)$/);
  if (parenMatch) {
    const p1 = parenMatch[1].trim();
    const p2 = parenMatch[2].trim();
    if (isTamil(p1) && !isTamil(p2)) return { name_ta: p1, name_en: p2 };
    if (!isTamil(p1) && isTamil(p2)) return { name_en: p1, name_ta: p2 };
  }

  // Matches "Part1 / Part2" or "Part1 - Part2"
  const splitMatch = raw.split(/\s*[\/\-]\s*/);
  if (splitMatch.length === 2) {
    const p1 = splitMatch[0].trim();
    const p2 = splitMatch[1].trim();
    if (isTamil(p1) && !isTamil(p2)) return { name_ta: p1, name_en: p2 };
    if (!isTamil(p1) && isTamil(p2)) return { name_en: p1, name_ta: p2 };
  }

  return {};
}

/**
 * Capitalizes first letter of each word in English.
 */
function toTitleCase(str: string): string {
  return str.replace(/\b\w+/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

/**
 * Returns bilingual names { name_en, name_ta } for any given item string or ID.
 * Resolves bidirectional translation automatically.
 */
export function getItemBilingualNames(
  rawName: string,
  itemId?: string
): { name_en: string; name_ta: string } {
  const trimmed = (rawName || '').trim();
  if (!trimmed) {
    return { name_en: '', name_ta: '' };
  }

  // 1. Check persistent cache by ID
  if (itemId && translationsCache[itemId]) {
    return translationsCache[itemId];
  }

  // 2. Check persistent cache by lowercase string
  const lowerKey = trimmed.toLowerCase();
  if (translationsCache[lowerKey]) {
    const cached = translationsCache[lowerKey];
    if (itemId) {
      translationsCache[itemId] = cached;
      saveCache();
    }
    return cached;
  }

  // 3. Check for compound format: "சாவி (Key)" or "Keys (சாவி)"
  const compound = parseCompoundName(trimmed);
  if (compound.name_en && compound.name_ta) {
    const result = {
      name_en: toTitleCase(compound.name_en),
      name_ta: compound.name_ta,
    };
    translationsCache[lowerKey] = result;
    if (itemId) translationsCache[itemId] = result;
    saveCache();
    return result;
  }

  let name_en = '';
  let name_ta = '';

  if (isTamil(trimmed)) {
    // Input is in Tamil
    name_ta = trimmed;
    const foundEn = findInTaDict(trimmed);
    name_en = foundEn ? toTitleCase(foundEn) : trimmed;
  } else {
    // Input is in English
    name_en = toTitleCase(trimmed);
    const foundTa = findInEnDict(trimmed);
    name_ta = foundTa || trimmed;
  }

  const result = { name_en, name_ta };

  // Cache by both text and ID
  translationsCache[lowerKey] = result;
  if (itemId) translationsCache[itemId] = result;
  saveCache();

  return result;
}

/**
 * Registers or updates explicit bilingual names for an item.
 */
export function registerItemBilingualNames(
  itemId: string,
  name_en: string,
  name_ta: string
): void {
  const result = { name_en: name_en.trim(), name_ta: name_ta.trim() };
  translationsCache[itemId] = result;
  if (name_en) translationsCache[name_en.toLowerCase()] = result;
  if (name_ta) translationsCache[name_ta.toLowerCase()] = result;
  saveCache();
}

/**
 * Primary helper to get the display name of an item in the requested language.
 *
 * Example:
 * - When language is 'en': "Keys"
 * - When language is 'ta': "சாவி"
 * - When switched back to 'en': "Keys"
 */
export function getItemDisplayName(
  item: Item | ItemWithLocations | string | null | undefined,
  language: Language
): string {
  if (!item) return '';

  if (typeof item === 'string') {
    const bilingual = getItemBilingualNames(item);
    return language === 'ta' ? bilingual.name_ta || bilingual.name_en : bilingual.name_en || bilingual.name_ta;
  }

  // If item already has language-specific properties
  if (language === 'ta' && item.name_ta) {
    return item.name_ta;
  }
  if (language === 'en' && item.name_en) {
    return item.name_en;
  }

  // Otherwise compute bilingual resolution from item_name
  const bilingual = getItemBilingualNames(item.item_name, item.id);
  return language === 'ta' ? bilingual.name_ta || bilingual.name_en : bilingual.name_en || bilingual.name_ta;
}

/**
 * Enriches an item object with name_en and name_ta.
 */
export function enrichItemWithBilingualNames<T extends Item>(item: T): T {
  const bilingual = getItemBilingualNames(item.item_name, item.id);
  return {
    ...item,
    name_en: item.name_en || bilingual.name_en,
    name_ta: item.name_ta || bilingual.name_ta,
  };
}
