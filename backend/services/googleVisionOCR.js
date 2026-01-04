const vision = require('@google-cloud/vision');
const fs = require('fs');

let visionClient = null;

/**
 * Initialize Google Cloud Vision client
 * Uses GOOGLE_APPLICATION_CREDENTIALS environment variable for authentication
 */
const initializeVisionClient = () => {
  if (visionClient) {
    return visionClient;
  }

  try {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (!credentialsPath) {
      console.warn('GOOGLE_APPLICATION_CREDENTIALS not set. Google Vision API will not be available.');
      return null;
    }

    if (!fs.existsSync(credentialsPath)) {
      console.warn(`Google credentials file not found at ${credentialsPath}. Google Vision API will not be available.`);
      return null;
    }

    visionClient = new vision.ImageAnnotatorClient();
    console.log('Google Cloud Vision API client initialized successfully');
    return visionClient;
  } catch (error) {
    console.error('Error initializing Google Cloud Vision client:', error);
    return null;
  }
};

/**
 * Extract text from image using Google Cloud Vision API
 * @param {String} imagePath - Path to the image file
 * @returns {Promise<Object>} - Extracted text and confidence
 */
const extractTextFromImage = async (imagePath) => {
  try {
    const client = initializeVisionClient();
    
    if (!client) {
      return {
        text: '',
        confidence: 0,
        success: false,
        error: 'Google Vision API client not initialized'
      };
    }

    if (!fs.existsSync(imagePath)) {
      return {
        text: '',
        confidence: 0,
        success: false,
        error: 'Image file not found'
      };
    }

    const [result] = await client.textDetection(imagePath);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return {
        text: '',
        confidence: 0,
        success: false,
        error: 'No text detected in image'
      };
    }

    // First detection contains the full text
    const fullText = detections[0].description || '';
    
    // Calculate average confidence from all detections
    const confidences = detections
      .slice(1)
      .map(detection => {
        // Vision API doesn't always provide confidence, so we estimate
        // based on bounding box quality
        return detection.boundingPoly ? 0.85 : 0.7;
      })
      .filter(conf => conf > 0);
    
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0.8;

    return {
      text: fullText.trim(),
      confidence: avgConfidence * 100, // Convert to percentage
      success: true,
      method: 'google-cloud-vision'
    };
  } catch (error) {
    console.error('Google Vision API OCR error:', error);
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
 * Process document and extract information using Google Cloud Vision API
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
    confidence: ocrResult.confidence,
    method: ocrResult.method || 'google-cloud-vision'
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
  processDocument,
  initializeVisionClient
};

