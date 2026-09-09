const Tesseract = require('tesseract.js');

/**
 * Built-in Sample Datasets for reliable SIH demonstration / fallback mode
 */
const DEMO_SAMPLES = [
  {
    id: 'demo-sample-1',
    productName: 'Britannia Marie Gold Biscuits',
    subtitle: 'Fully Compliant Package Example',
    thumbnail: 'marie_gold.jpg',
    extractedData: {
      productName: 'Britannia Marie Gold Biscuits',
      manufacturer: 'Britannia Industries Ltd.',
      address: '5/1A Hungerford Street, Kolkata, West Bengal - 700017',
      netQuantity: '300 g',
      mrp: '₹ 45.00 (Incl. of all taxes)',
      manufacturingDate: '08/2026',
      consumerCare: '1800-425-4449 / feedback@britannia.co.in',
      rawText: 'BRITANNIA MARIE GOLD BISCUITS\nNet Wt: 300 g\nMfd By: Britannia Industries Ltd.\nAddress: 5/1A Hungerford Street, Kolkata, West Bengal - 700017\nMRP Rs. 45.00 (Incl. of all taxes)\nDate of Pkd: 08/2026\nConsumer Care Toll Free: 1800-425-4449\nEmail: feedback@britannia.co.in'
    }
  },
  {
    id: 'demo-sample-2',
    productName: 'Sunrise Spices Garam Masala',
    subtitle: 'Non-Compliant Example (Missing Address)',
    thumbnail: 'spices.jpg',
    extractedData: {
      productName: 'Sunrise Royal Garam Masala',
      manufacturer: 'Sunrise Foods Private Limited',
      address: null, // MISSING
      netQuantity: '100 g',
      mrp: '₹ 68.00',
      manufacturingDate: '07/2026',
      consumerCare: 'support@sunrisespices.com',
      rawText: 'SUNRISE ROYAL GARAM MASALA\nMfg By: Sunrise Foods Private Limited\nNet Quantity: 100 g\nM.R.P.: Rs 68.00 (Inclusive of all taxes)\nMfg Date: 07/2026\nCustomer Care: support@sunrisespices.com'
    }
  },
  {
    id: 'demo-sample-3',
    productName: 'Pure Mountain Wild Honey',
    subtitle: 'Non-Compliant Example (Missing MRP & Mfg Date)',
    thumbnail: 'honey.jpg',
    extractedData: {
      productName: 'Pure Mountain Wild Honey',
      manufacturer: 'Himalayan Organic Apiaries',
      address: 'Industrial Area Phase 1, Dehradun, Uttarakhand - 248001',
      netQuantity: '500 g',
      mrp: null, // MISSING
      manufacturingDate: null, // MISSING
      consumerCare: '1800-890-1122',
      rawText: 'PURE MOUNTAIN WILD HONEY\nPacked By: Himalayan Organic Apiaries\nAddress: Industrial Area Phase 1, Dehradun, Uttarakhand - 248001\nNet Content: 500 g\nFor complaints call: 1800-890-1122'
    }
  }
];

/**
 * Extracts mandatory packaged commodity details from raw OCR text using heuristics & regex.
 */
function extractInformationFromText(rawText = '') {
  const text = rawText.replace(/\r/g, ' ');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let productName = null;
  let manufacturer = null;
  let address = null;
  let netQuantity = null;
  let mrp = null;
  let manufacturingDate = null;
  let consumerCare = null;

  // 1. Net Quantity extraction
  // Handles "NET WEIGHT: 500g", "Net Wt: 250 g", "Net Quantity 1 kg", "200ml", "10 N", "75g"
  const netQtyRegex = /\b(?:net\s*(?:wt\.?|weight|qty\.?|quantity|vol\.?|volume|contents?)?[\s:.-]*)\b([0-9]+(?:\.[0-9]+)?\s*(?:g|gm|gms|kg|kilograms?|ml|l|ltr|litres?|liters?|pcs|pieces?|units?|packs?|N)?)\b/i;
  const standaloneQtyRegex = /\b([0-9]+(?:\.[0-9]+)?\s*(?:g|gm|gms|kg|ml|ltr|litres?))\b/i;
  
  const netMatch = text.match(netQtyRegex) || text.match(standaloneQtyRegex);
  if (netMatch && netMatch[1]) {
    let val = netMatch[1].trim();
    if (/^\d+$/.test(val)) {
      val = `${val} g`;
    }
    netQuantity = val;
  }

  // 2. MRP extraction (Strict contextual rules to avoid '18 Food Safety Road' -> MRP 18/-)
  // Strategy:
  // (a) Look for explicit MRP keyword with word boundary \b:
  //     e.g., "MRP: Rs. 40.00", "M.R.P. ₹ 99.00", "MIRP. PS 4000", "MRP 150", "Max Retail Price ₹ 75"
  // (b) Standalone currency:
  //     e.g., "₹ 45.00", "Rs. 120"
  //     CRITICAL FIX: Currency MUST use standalone word boundary `\b(?:rs\.?|inr)\b` or `₹`.
  //     NEVER match partial word endings (e.g. "SUFFERERS. 18" -> NOT Rs. 18).
  //     Lines with address, nutrient, or warning context are excluded from standalone currency matching.
  const explicitMrpRegex = /\b(?:m\.?[1il]?\.?r\.?[pfb]\.?|mrp|mirp|max(?:imum)?\s*retail\s*price)\b[\s:.-]*(?:₹|rs\.?|inr|ps\.?)?[\s]*([0-9]+(?:\.[0-9]{1,2})?)/i;
  const explicitMatch = text.match(explicitMrpRegex);

  if (explicitMatch && explicitMatch[1]) {
    let val = explicitMatch[1];
    // if OCR misread 40.00 as 4000
    if (val.length === 4 && val.endsWith('00')) {
      val = `${val.slice(0, 2)}.${val.slice(2)}`;
    }
    mrp = `₹ ${val}`;
  } else {
    // Check lines for standalone currency with strict contextual exclusions
    const standaloneCurrencyRegex = /(?:₹|\b(?:rs\.?|inr)\b)[\s:.-]*([0-9]+(?:\.[0-9]{1,2})?)\b/i;
    for (const line of lines) {
      // Exclude lines with address, nutrient, or warning context
      if (/(?:road|street|lane|plot|sector|safety|box|allergy|sufferer|serving|size|energy|protein|fat|carb|vitamin|nutrient|pin|phone|call|tel|weight)/i.test(line)) {
        continue;
      }
      const curMatch = line.match(standaloneCurrencyRegex);
      if (curMatch && curMatch[1]) {
        mrp = `₹ ${curMatch[1]}`;
        break;
      }
    }
  }

  // 3. Manufacturing / Packing / Expiry Date
  // Handles "Mfg Date: 08/2026", "USE BY: 01/12/2010", "Pkd: 05/26", "Best Before 12 months"
  const dateWithKeywordRegex = /\b(?:mfd|mfg|pkd|packed|pkg|manufactured|wig|date\s*of\s*mfg|mfg\s*date|use\s*by|best\s*before|exp(?:iry)?)[\s:.-]*([0-3]?\d[\/\-.][0-1]?\d[\/\-.](?:19|20)\d{2}|[0-1]?\d[\/\-.](?:19|20)\d{2}|[0-3]?\d[\/\-.][0-1]?\d[\/\-.]\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\/\-.]*(?:19|20)?\d{2})\b/i;
  const dateMatch = text.match(dateWithKeywordRegex);

  if (dateMatch && dateMatch[1]) {
    manufacturingDate = dateMatch[1].trim();
  } else {
    // Look for explicit 4-digit year dates: DD/MM/YYYY or MM/YYYY
    const fourDigitDateMatch = text.match(/\b(?:[0-3]?\d[\/\-.])?([0-1]?\d[\/\-.](?:19|20)\d{2})\b/);
    if (fourDigitDateMatch) {
      manufacturingDate = fourDigitDateMatch[0];
    } else {
      // Fallback 2-digit MM/YY match like 08/26
      const monthYearMatch = text.match(/\b(0[1-9]|1[0-2])[\/\-.](20\d\d|\d{2})\b/);
      if (monthYearMatch) {
        manufacturingDate = monthYearMatch[0];
      }
    }
  }

  // 4. Consumer Care
  // e.g. "Consumer care: 1800 123 456", "customercare@brand.com", "Toll Free: 1800-xxx"
  const phoneMatch = text.match(/(?:1800[-\s]?[0-9]{3}[-\s]?[0-9]{3,4}|(?:tel|call|phone|toll[-\s]*free)[\s:.-]*([0-9\s-]{8,15}))/i);
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  
  if (phoneMatch || emailMatch) {
    const parts = [];
    if (phoneMatch) parts.push(phoneMatch[0].trim());
    if (emailMatch) parts.push(emailMatch[1].trim());
    consumerCare = parts.join(' | ');
  } else if (/customer\s*care|consumer\s*care|consumer\s*cell|helpline/i.test(text)) {
    consumerCare = 'Customer Care Helpline Mentioned';
  }

  // 5. Manufacturer / Packer Name
  // Handles "Manufactured By: Brand Food Pte Ltd", "Mfd By: Britannia Industries Ltd", "Product of Singapore"
  const mfgRegex = /(?:manufactured\s*by|mfd\s*by|mfg\s*by|packed\s*by|pkd\s*by|marketed\s*by|produced\s*by)[\s:.-]*([^\n,]+(?:ltd|limited|pvt|private|foods|industries|co\.|corporation|enterprises|pte)?)/i;
  const mfgMatch = text.match(mfgRegex);
  if (mfgMatch && mfgMatch[1].trim().length > 3) {
    const rawVal = mfgMatch[1].trim();
    const cleanCorp = rawVal.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\s+(?:Pte\.?|Pvt\.?|Ltd\.?|Limited|Foods|Industries|Corporation)(?:\s+Ltd\.?)?)\b/);
    if (cleanCorp) {
      manufacturer = cleanCorp[1].trim();
    } else {
      manufacturer = rawVal;
    }
  } else {
    // Check lines for company indicators or country origin declarations
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/(?:manufactured\s*by|packed\s*by)/i.test(line)) {
        if (i + 1 < lines.length && /(?:ltd|limited|pte|foods|corp|co\.)/i.test(lines[i + 1])) {
          manufacturer = lines[i + 1].trim();
          break;
        }
      }
      // Precise company name extraction: "Brand Food Pte Ltd"
      const cleanCorpMatch = line.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\s+(?:Pte\.?|Pvt\.?|Ltd\.?|Limited|Foods|Industries|Corporation)(?:\s+Ltd\.?)?)\b/);
      if (cleanCorpMatch) {
        manufacturer = cleanCorpMatch[1].trim();
        break;
      }
      if (/(?:pvt\.?\s*ltd\.?|private\s*limited|industries|foods|laboratories|enterprises|pte\s*ltd)/i.test(line)) {
        manufacturer = line.replace(/.*?(?=[A-Z][a-zA-Z\s]+(?:pvt|ltd|limited|pte|foods))/i, '').trim();
        break;
      }
      if (/\bproduct\s*of\s*([a-zA-Z\s]+)/i.test(line)) {
        const prodMatch = line.match(/\bproduct\s*of\s*([a-zA-Z\s]+)/i);
        if (prodMatch) {
          manufacturer = `Product of ${prodMatch[1].trim()}`;
          break;
        }
      }
    }
  }

  // 6. Address
  // Look for pin codes (6 digits), states, industrial area, road, street, or lines starting with Address / Adress
  const pinMatch = text.match(/\b([1-9][0-9]{2}\s?[0-9]{3})\b/);
  const addressKeywordRegex = /\b(?:road|street|nagar|sector|industrial\s*area|plot\s*no|phase|dist|state|lane|highway|estate|taluk|adress|address)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (addressKeywordRegex.test(line) || (pinMatch && line.includes(pinMatch[1]))) {
      // Strip warning / allergen prefixes if present (e.g. "ALLERGY SUFFERERS. 18 Food Safety Road")
      let cleaned = line.replace(/^[a-z\s\W]*(?:warning\s*-|allergy\s*sufferers|warning|note|caution|contains|ingredients)[\s.:-]*/i, '').trim();
      
      // Lookahead up to 3 lines for city/country/pincode (e.g. "Singapore 123456" or "Kolkata 700017")
      for (let j = i + 1; j <= Math.min(i + 3, lines.length - 1); j++) {
        const nextLine = lines[j];
        if (/^(?:use\s*by|exp|mfg|net\s*wt|mrp|declared)/i.test(nextLine)) continue;
        const cityPinMatch = nextLine.match(/\b([A-Za-z]+)\s+([0-9]{5,6})\b/);
        if (cityPinMatch) {
          cleaned += `, ${cityPinMatch[0]}`;
          break;
        }
      }
      address = cleaned;
      break;
    }
  }
  if (!address && pinMatch) {
    address = `Postal Pin Code detected: ${pinMatch[1]}`;
  }

  // 7. Product Name
  // Pass 1: Search for recognizable commodity keywords
  for (const line of lines) {
    let cleaned = line.replace(/[^a-zA-Z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/\b(?:contains|contain|with|serving)\b.*$/i, '').trim();

    if (/breakfast|cereal|biscuit|cookie|honey|spice|masala|atta|flour|tea|coffee|snack|chips|juice|oil|butter|cheese/i.test(cleaned)) {
      if (!/\b(?:nutrition|serving|information|vitamin|folic|calcium|iron|sodium|protein|sugar|saturated\s*fat|total\s*fat)\b/i.test(cleaned) && !/(?:“|”|gu\b|gu:|^oe\b)/i.test(line.trim())) {
        cleaned = cleaned.replace(/.*?(?=(?:low\s*fat|breakfast|cereals?|biscuit|cookie|honey|spice|pure))/i, '');
        if (cleaned.split(' ').length >= 2 && cleaned.length >= 6) {
          productName = cleaned.trim();
          break;
        }
      }
    }
  }

  // Pass 2: General brand title fallback
  if (!productName) {
    for (const line of lines) {
      let cleaned = line.replace(/[^a-zA-Z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (
        cleaned.length >= 4 &&
        cleaned.length <= 40 &&
        !line.includes('“') &&
        !/\b(?:rep|ji|oe|mfg|mfd|exp|mrp|batch|fssai|net|lic|ingred|pack|weight|adress|address|serving|quantity|per\s*serving|nutrition|allergy|sufferers|declared|product\s*of|vitamin|folic|calcium|iron|sodium|protein|sugar|saturated\s*fat|total\s*fat)\b/i.test(cleaned) &&
        cleaned.split(' ').length >= 2
      ) {
        productName = cleaned;
        break;
      }
    }
  }

  return {
    productName: productName || 'Packaged Commodity',
    manufacturer,
    address,
    netQuantity,
    mrp,
    manufacturingDate,
    consumerCare,
    rawText: text
  };
}

/**
 * Executes OCR on image file using Tesseract.js with optional preprocessing.
 * @param {Buffer} imageBuffer - Uploaded image bytes
 * @returns {Promise<Object>} Extracted product information
 */
async function processImage(imageBuffer) {
  try {
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
      throw new Error('Uploaded image data is missing.');
    }

    const { data: { text, confidence } } = await Tesseract.recognize(
      imageBuffer,
      'eng',
      {
        logger: () => {} // Silent
      }
    );

    const extracted = extractInformationFromText(text || '');
    return {
      success: true,
      confidence: confidence || 0,
      extractedData: extracted,
      rawText: text || ''
    };
  } catch (error) {
    console.error('OCR Processing error:', error);
    return {
      success: false,
      error: error.message || 'OCR extraction failed',
      extractedData: {
        productName: null,
        manufacturer: null,
        address: null,
        netQuantity: null,
        mrp: null,
        manufacturingDate: null,
        consumerCare: null,
        rawText: ''
      }
    };
  }
}

module.exports = {
  processImage,
  extractInformationFromText,
  DEMO_SAMPLES
};
