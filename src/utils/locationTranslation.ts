import { Language } from '../types';
import { isTamil } from './itemTranslation';

/**
 * Common household, workplace, and personal location mappings.
 * Maps English location names to natural, clean Tamil equivalents.
 */
export const DICT_LOCATION_EN_TO_TA: Record<string, string> = {
  // Tables & Desks
  'tv table': 'TV மேசை',
  'tv stand': 'TV மேசை',
  'tv unit': 'TV மேசை',
  'bedroom table': 'படுக்கையறை மேசை',
  'study table': 'படிப்பு மேசை',
  'bedside table': 'படுக்கை அருகிலுள்ள மேசை',
  'bed side table': 'படுக்கை அருகிலுள்ள மேசை',
  'nightstand': 'படுக்கை அருகிலுள்ள மேசை',
  'night stand': 'படுக்கை அருகிலுள்ள மேசை',
  'dining table': 'சாப்பாட்டு மேசை',
  'coffee table': 'காபி மேசை',
  'tea table': 'டீ மேசை',
  'work table': 'வேலை மேசை',
  'office table': 'அலுவலக மேசை',
  'office desk': 'அலுவலக மேசை',
  'computer table': 'கணினி மேசை',
  'computer desk': 'கணினி மேசை',
  'hall table': 'ஹால் மேசை',
  'dressing table': 'ஒப்பனை மேசை',
  'table': 'மேசை',
  'desk': 'மேசை',

  // Rooms & House Areas
  'kitchen': 'சமையலறை',
  'bedroom': 'படுக்கையறை',
  'living room': 'வரவேற்பறை',
  'hall': 'ஹால்',
  'balcony': 'பால்கனி',
  'bathroom': 'குளியலறை',
  'restroom': 'கழிப்பறை',
  'store room': 'பொருளறை',
  'storeroom': 'பொருளறை',
  'pooja room': 'பூஜை அறை',
  'puja room': 'பூஜை அறை',
  'prayer room': 'பூஜை அறை',
  'dining room': 'சாப்பாட்டு அறை',
  'corridor': 'தாழ்வாரம்',
  'terrace': 'மாடி',
  'veranda': 'திண்ணை / வராண்டா',
  'garage': 'வாகன நிறுத்துமிடம்',

  // Storage & Furniture
  'cupboard': 'அலமாரி',
  'wardrobe': 'ஆடை அலமாரி',
  'closet': 'அலமாரி',
  'almirah': 'அலமாரி',
  'drawer': 'இழுப்பறை',
  'bedroom drawer': 'படுக்கையறை இழுப்பறை',
  'table drawer': 'மேசை இழுப்பறை',
  'desk drawer': 'மேசை இழுப்பறை',
  'shelf': 'அலமாரித் தட்டு',
  'bookshelf': 'புத்தக அலமாரி',
  'book shelf': 'புத்தக அலமாரி',
  'shoe rack': 'காலணி அலமாரி',
  'rack': 'ரேக் / தட்டு',
  'bed': 'படுக்கை',
  'bedside': 'படுக்கை அருகில்',
  'under the bed': 'படுக்கையின் கீழ்',
  'under bed': 'படுக்கையின் கீழ்',
  'sofa': 'சோபா',
  'couch': 'சோபா',
  'chair': 'நாற்காலி',
  'armchair': 'சாய்வு நாற்காலி',

  // Bags, Pockets & Holders
  'bag': 'பை',
  'handbag': 'கைப்பை',
  'hand bag': 'கைப்பை',
  'school bag': 'பள்ளிப் பை',
  'college bag': 'கல்லூரிப் பை',
  'backpack': 'முதுகுப் பை',
  'office bag': 'அலுவலகப் பை',
  'laptop bag': 'லேப்டாப் பை',
  'travel bag': 'பயணப் பை',
  'suitcase': 'சூட்கேஸ்',
  'pouch': 'சிறிய பை',
  'pocket': 'சட்டைப் பை',
  'shirt pocket': 'சட்டைப் பை',
  'pant pocket': 'பேண்ட் பை',
  'trouser pocket': 'பேண்ட் பை',

  // Fixtures & Surfaces
  'door': 'கதவு',
  'main door': 'முன் கதவு',
  'door hook': 'கதவு கொக்கி',
  'key stand': 'சாவி மாட்டும் இடம்',
  'key hanger': 'சாவி மாட்டும் கொக்கி',
  'key holder': 'சாவி மாட்டும் இடம்',
  'wall hook': 'சுவர் கொக்கி',
  'hook': 'கொக்கி',
  'fridge': 'குளிர்சாதனப் பெட்டி',
  'refrigerator': 'குளிர்சாதனப் பெட்டி',
  'washing machine': 'துணி துவைக்கும் இயந்திரம்',
  'window': 'ஜன்னல்',
  'windowsill': 'ஜன்னல் திட்டு',
  'window sill': 'ஜன்னல் திட்டு',
  'car': 'கார்',
  'car dashboard': 'கார் டேஷ்போர்டு',
  'glove compartment': 'கார் க்ளோவ்பாக்ஸ்',
  'bike': 'பைக்',
  'bike bag': 'பைக் பை',
  'scooter': 'ஸ்கூட்டர்',
  'safe': 'பாதுகாப்பு பெட்டகம்',
  'locker': 'லாக்கர்',
  'box': 'பெட்டி',
};

/**
 * Reverse mapping for known Tamil locations to English.
 */
export const DICT_LOCATION_TA_TO_EN: Record<string, string> = {
  'tv மேசை': 'TV Table',
  'படுக்கையறை மேசை': 'Bedroom Table',
  'படிப்பு மேசை': 'Study Table',
  'படுக்கை அருகிலுள்ள மேசை': 'Bedside Table',
  'சாப்பாட்டு மேசை': 'Dining Table',
  'காபி மேசை': 'Coffee Table',
  'டீ மேசை': 'Tea Table',
  'வேலை மேசை': 'Work Table',
  'அலுவலக மேசை': 'Office Desk',
  'கணினி மேசை': 'Computer Table',
  'ஹால் மேசை': 'Hall Table',
  'மேசை': 'Desk',
  'சமையலறை': 'Kitchen',
  'படுக்கையறை': 'Bedroom',
  'வரவேற்பறை': 'Living Room',
  'ஹால்': 'Hall',
  'பால்கனி': 'Balcony',
  'குளியலறை': 'Bathroom',
  'பொருளறை': 'Store Room',
  'பூஜை அறை': 'Pooja Room',
  'அலமாரி': 'Cupboard',
  'ஆடை அலமாரி': 'Wardrobe',
  'இழுப்பறை': 'Drawer',
  'படுக்கையறை இழுப்பறை': 'Bedroom Drawer',
  'மேசை இழுப்பறை': 'Table Drawer',
  'அலமாரித் தட்டு': 'Shelf',
  'புத்தக அலமாரி': 'Bookshelf',
  'காலணி அலமாரி': 'Shoe Rack',
  'படுக்கை': 'Bed',
  'படுக்கை அருகில்': 'Bedside',
  'படுக்கையின் கீழ்': 'Under the Bed',
  'சோபா': 'Sofa',
  'நாற்காலி': 'Chair',
  'பை': 'Bag',
  'கைப்பை': 'Handbag',
  'பள்ளிப் பை': 'School Bag',
  'கல்லூரிப் பை': 'College Bag',
  'முதுகுப் பை': 'Backpack',
  'அலுவலகப் பை': 'Office Bag',
  'லேப்டாப் பை': 'Laptop Bag',
  'சட்டைப் பை': 'Shirt Pocket',
  'பேண்ட் பை': 'Pant Pocket',
  'கதவு': 'Door',
  'சாவி மாட்டும் இடம்': 'Key Holder',
  'குளிர்சாதனப் பெட்டி': 'Refrigerator',
  'கார்': 'Car',
  'பைக்': 'Bike',
  'பெட்டி': 'Box',
};

/**
 * Returns localized display name for a location.
 *
 * Rules:
 * - If language = "en": returns English version or original if already English.
 * - If language = "ta": returns Tamil display translation when a known translation exists.
 * - If the user entered a location directly in Tamil (e.g. "படுக்கையறை மேசை"):
 *     - When Tamil is selected, returns "படுக்கையறை மேசை"
 *     - When English is selected, preserves original user-entered text unless a reliable English translation exists
 * - If no translation exists: keep the original location name (do not invent translations).
 */
export function getLocalizedLocationName(
  locationName: string | null | undefined,
  language: Language
): string {
  if (!locationName) return '';
  const trimmed = locationName.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();

  // If Target is Tamil
  if (language === 'ta') {
    // Already Tamil? Keep as-is
    if (isTamil(trimmed)) {
      return trimmed;
    }

    // Direct lookup in English -> Tamil dictionary
    if (DICT_LOCATION_EN_TO_TA[lower]) {
      return DICT_LOCATION_EN_TO_TA[lower];
    }

    // Check with stripped articles like "the " or "in the "
    const cleaned = lower.replace(/^(in\s+the\s+|on\s+the\s+|the\s+|at\s+the\s+)/i, '').trim();
    if (DICT_LOCATION_EN_TO_TA[cleaned]) {
      return DICT_LOCATION_EN_TO_TA[cleaned];
    }

    // No translation exists: preserve original
    return trimmed;
  }

  // Target is English
  if (language === 'en') {
    // If input is Tamil, check if we have a known English counterpart
    if (isTamil(trimmed)) {
      if (DICT_LOCATION_TA_TO_EN[trimmed]) {
        return DICT_LOCATION_TA_TO_EN[trimmed];
      }
      if (DICT_LOCATION_TA_TO_EN[lower]) {
        return DICT_LOCATION_TA_TO_EN[lower];
      }
      // Preserve original Tamil user input rather than forcing a bad translation
      return trimmed;
    }

    // Otherwise it's already in English/Latin script
    return trimmed;
  }

  return trimmed;
}

/**
 * Adds the natural Tamil locative suffix ("-ல்" or "யில்") to a location name
 * so that it reads naturally before "இருக்கலாம்" in spoken/written Tamil.
 *
 * Examples:
 * - "TV மேசை" -> "TV மேசையில்"
 * - "படுக்கையறை மேசை" -> "படுக்கையறை மேசையில்"
 * - "படிப்பு மேசை" -> "படிப்பு மேசையில்"
 * - "சமையலறை" -> "சமையலறையில்"
 * - "அலமாரி" -> "அலமாரியில்"
 * - "ஹால்" -> "ஹால்-ல்"
 * - "சோபா" -> "சோபா-ல்"
 * - "TV Table" (untranslated) -> "TV Table-ல்"
 */
export function getTamilLocationWithLocative(locationName: string): string {
  const trimmed = locationName.trim();
  if (!trimmed) return '';

  // If already ends with locative suffix, don't duplicate
  if (trimmed.endsWith('-ல்') || trimmed.endsWith('இல்') || trimmed.endsWith('யில்')) {
    return trimmed;
  }

  // Words ending with 'ை' (like மேசை, அறை, பை, இழுப்பறை) naturally take "யில்"
  if (trimmed.endsWith('ை')) {
    return `${trimmed}யில்`;
  }

  // Words ending with 'ி' (like அலமாரி, கொக்கி) naturally take "யில்"
  if (trimmed.endsWith('ி')) {
    return `${trimmed}யில்`;
  }

  // Words ending with 'ம்' (like இடம், மேசைப்பக்கம்) take "த்தில்" or "-ல்"
  if (trimmed.endsWith('ம்')) {
    return `${trimmed.slice(0, -1)}த்தில்`;
  }

  // Default clean suffix for other words
  return `${trimmed}-ல்`;
}
