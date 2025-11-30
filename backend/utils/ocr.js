const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

/**
 * Extract text from document image using OCR
 * @param {String} imagePath - Path to the image file
 * @returns {Promise<Object>} - Extracted text and confidence
 */
const extractTextFromImage = async (imagePath) => {
  try {
    const { data: { text, confidence } } = await Tesseract.recognize(
      imagePath,
      'eng',
      {
        logger: m => {
          // Log progress if needed
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    return {
      text: text.trim(),
      confidence: confidence,
      success: true
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return {
      text: '',
      confidence: 0,
      success: false,
      error: error.message
    };
  }
};

/**
 * Extract Aadhaar number from OCR text
 * @param {String} text - OCR extracted text
 * @returns {String|null} - Aadhaar number or null
 */
const extractAadhaarNumber = (text) => {
  // Aadhaar format: XXXX XXXX XXXX (12 digits with spaces)
  const aadhaarRegex = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;
  const matches = text.match(aadhaarRegex);
  
  if (matches && matches.length > 0) {
    // Return the first match, remove spaces
    return matches[0].replace(/\s/g, '');
  }
  
  // Try alternative format without spaces
  const aadhaarRegexAlt = /\b\d{12}\b/g;
  const matchesAlt = text.match(aadhaarRegexAlt);
  
  if (matchesAlt && matchesAlt.length > 0) {
    return matchesAlt[0];
  }
  
  return null;
};

/**
 * Extract PAN number from OCR text
 * @param {String} text - OCR extracted text
 * @returns {String|null} - PAN number or null
 */
const extractPANNumber = (text) => {
  // PAN format: ABCDE1234F (5 letters, 4 digits, 1 letter)
  const panRegex = /\b[A-Z]{5}\d{4}[A-Z]{1}\b/gi;
  const matches = text.match(panRegex);
  
  if (matches && matches.length > 0) {
    return matches[0].toUpperCase();
  }
  
  return null;
};

/**
 * Extract name from OCR text (for Aadhaar/PAN)
 * @param {String} text - OCR extracted text
 * @returns {String|null} - Extracted name or null
 */
const extractName = (text) => {
  // Look for common name patterns
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Usually name appears in uppercase on ID documents
  for (const line of lines) {
    if (line.length > 3 && line.length < 50 && /^[A-Z\s]+$/.test(line)) {
      // Check if it's not a number or date
      if (!/\d/.test(line) && !line.includes('DOB') && !line.includes('DATE')) {
        return line;
      }
    }
  }
  
  return null;
};

/**
 * Process document and extract information
 * @param {String} imagePath - Path to document image
 * @param {String} documentType - 'aadhaar' or 'pan'
 * @returns {Promise<Object>} - Extracted document data
 */
const processDocument = async (imagePath, documentType) => {
  const ocrResult = await extractTextFromImage(imagePath);
  
  if (!ocrResult.success) {
    return {
      success: false,
      error: ocrResult.error,
      data: null
    };
  }

  const extractedData = {
    text: ocrResult.text,
    confidence: ocrResult.confidence
  };

  if (documentType === 'aadhaar') {
    extractedData.aadhaarNumber = extractAadhaarNumber(ocrResult.text);
    extractedData.name = extractName(ocrResult.text);
  } else if (documentType === 'pan') {
    extractedData.panNumber = extractPANNumber(ocrResult.text);
    extractedData.name = extractName(ocrResult.text);
  }

  return {
    success: true,
    data: extractedData
  };
};

module.exports = {
  extractTextFromImage,
  extractAadhaarNumber,
  extractPANNumber,
  extractName,
  processDocument
};

