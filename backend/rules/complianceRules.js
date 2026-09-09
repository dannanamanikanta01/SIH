/**
 * Legal Metrology (Packaged Commodities) Rules, 2011 Compliance Rule Engine
 * 
 * Each rule defines:
 * - id: unique rule identifier
 * - name: human readable rule description
 * - ruleReference: specific Legal Metrology 2011 rule citation
 * - weight: relative weight in score calculation
 * - evaluate: (extractedData) => { status: 'PASS'|'FAIL', detectedValue: string|null, reason?: string }
 */

const COMPLIANCE_RULES = [
  {
    id: 'product_name',
    name: 'Generic / Product Name',
    ruleReference: 'Rule 6(1)(b) - Common/Generic commodity name',
    weight: 10,
    evaluate: (data) => {
      const val = data.productName;
      if (val && typeof val === 'string' && val.trim().length >= 2) {
        return {
          status: 'PASS',
          detectedValue: val.trim()
        };
      }
      return {
        status: 'FAIL',
        detectedValue: null,
        reason: 'Generic or commodity product name could not be identified on package.'
      };
    }
  },
  {
    id: 'manufacturer',
    name: 'Manufacturer / Packer Name',
    ruleReference: 'Rule 6(1)(a) - Name of manufacturer/packer/importer',
    weight: 20,
    evaluate: (data) => {
      const val = data.manufacturer;
      if (val && typeof val === 'string' && val.trim().length >= 3) {
        return {
          status: 'PASS',
          detectedValue: val.trim()
        };
      }
      return {
        status: 'FAIL',
        detectedValue: null,
        reason: 'Manufacturer or Packer name declaration not detected.'
      };
    }
  },
  {
    id: 'address',
    name: 'Manufacturer / Packer Address',
    ruleReference: 'Rule 6(1)(a) - Complete physical address of manufacturer/packer',
    weight: 15,
    evaluate: (data) => {
      const val = data.address;
      if (val && typeof val === 'string' && val.trim().length >= 5) {
        return {
          status: 'PASS',
          detectedValue: val.trim()
        };
      }
      return {
        status: 'FAIL',
        detectedValue: null,
        reason: 'Physical address of manufacturer/packer could not be identified.'
      };
    }
  },
  {
    id: 'net_quantity',
    name: 'Net Quantity Declaration',
    ruleReference: 'Rule 6(1)(c) - Net quantity in standard units of weight/measure/number',
    weight: 20,
    evaluate: (data) => {
      const val = data.netQuantity;
      if (val && typeof val === 'string' && val.trim().length >= 1) {
        return {
          status: 'PASS',
          detectedValue: val.trim()
        };
      }
      return {
        status: 'FAIL',
        detectedValue: null,
        reason: 'Net quantity declaration (e.g. g, kg, ml, L, units) not detected.'
      };
    }
  },
  {
    id: 'mrp',
    name: 'Maximum Retail Price (MRP)',
    ruleReference: 'Rule 6(1)(e) - MRP inclusive of all taxes',
    weight: 15,
    evaluate: (data) => {
      const val = data.mrp;
      if (val && typeof val === 'string' && val.trim().length >= 2) {
        return {
          status: 'PASS',
          detectedValue: val.trim()
        };
      }
      return {
        status: 'FAIL',
        detectedValue: null,
        reason: 'Maximum Retail Price (MRP) declaration not detected.'
      };
    }
  },
  {
    id: 'mfg_date',
    name: 'Date / Month of Manufacture',
    ruleReference: 'Rule 6(1)(d) - Month and year of manufacture or packing',
    weight: 10,
    evaluate: (data) => {
      const val = data.manufacturingDate;
      if (val && typeof val === 'string' && val.trim().length >= 3) {
        return {
          status: 'PASS',
          detectedValue: val.trim()
        };
      }
      return {
        status: 'FAIL',
        detectedValue: null,
        reason: 'Date or month of manufacture/packing not detected.'
      };
    }
  },
  {
    id: 'consumer_care',
    name: 'Consumer Care / Helpline Details',
    ruleReference: 'Rule 6(1)(n) - Name, address, phone/email of consumer care cell',
    weight: 10,
    evaluate: (data) => {
      const val = data.consumerCare;
      if (val && typeof val === 'string' && val.trim().length >= 4) {
        return {
          status: 'PASS',
          detectedValue: val.trim()
        };
      }
      return {
        status: 'FAIL',
        detectedValue: null,
        reason: 'Consumer care contact details (helpline or email) not detected.'
      };
    }
  }
];

/**
 * Evaluates extracted package data against Legal Metrology Rules.
 * @param {Object} extractedData - Extracted fields from OCR
 * @returns {Object} { score, status, checks, detectedIssues, totalPassed, totalRules }
 */
function evaluateCompliance(extractedData = {}) {
  const checks = [];
  const detectedIssues = [];
  let totalScore = 0;
  let totalWeight = 0;
  let passedCount = 0;

  for (const rule of COMPLIANCE_RULES) {
    const result = rule.evaluate(extractedData);
    totalWeight += rule.weight;

    const checkObj = {
      id: rule.id,
      name: rule.name,
      ruleReference: rule.ruleReference,
      status: result.status,
      detectedValue: result.detectedValue || null
    };

    if (result.status === 'PASS') {
      totalScore += rule.weight;
      passedCount++;
    } else {
      checkObj.reason = result.reason || `${rule.name} failed verification.`;
      detectedIssues.push(checkObj.reason);
    }

    checks.push(checkObj);
  }

  const scorePercentage = Math.round((totalScore / totalWeight) * 100);
  
  // Under Legal Metrology Rules 2011, all mandatory declarations are legally required.
  // If any mandatory rule fails, the package status is NON_COMPLIANT.
  const status = (passedCount === COMPLIANCE_RULES.length) ? 'COMPLIANT' : 'NON_COMPLIANT';

  return {
    score: scorePercentage,
    status,
    totalPassed: passedCount,
    totalRules: COMPLIANCE_RULES.length,
    checks,
    detectedIssues
  };
}

module.exports = {
  COMPLIANCE_RULES,
  evaluateCompliance
};
