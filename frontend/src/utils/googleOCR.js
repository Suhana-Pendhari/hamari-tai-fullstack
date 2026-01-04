/**
 * Client-side OCR using Google Cloud Vision API
 * This is used as the primary OCR method before falling back to server-side OCR
 */

/**
 * Convert file to base64
 * @param {File} file - File to convert
 * @returns {Promise<string>} - Base64 string
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Extract text from image using Google Cloud Vision API (client-side)
 * @param {File} imageFile - Image file to process
 * @param {string} apiKey - Google Cloud Vision API key
 * @returns {Promise<Object>} - Extracted text and confidence
 */
export const extractTextWithVisionAPI = async (imageFile, apiKey) => {
  try {
    if (!apiKey) {
      throw new Error('Google Cloud Vision API key is required');
    }

    const base64Image = await fileToBase64(imageFile);

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 10,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Vision API request failed');
    }

    const data = await response.json();
    const textAnnotations = data.responses[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return {
        text: '',
        confidence: 0,
        success: false,
        error: 'No text detected in image'
      };
    }

    // First annotation contains the full text
    const fullText = textAnnotations[0].description || '';
    
    // Calculate average confidence from all annotations
    const confidences = textAnnotations
      .slice(1)
      .map(annotation => annotation.confidence || 0)
      .filter(conf => conf > 0);
    
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0.8; // Default confidence if not provided

    return {
      text: fullText.trim(),
      confidence: avgConfidence * 100, // Convert to percentage
      success: true
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
export const extractAadhaarNumber = (text) => {
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
export const extractPANNumber = (text) => {
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
export const extractName = (text) => {
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
 * Process document and extract information using Google Vision API
 * @param {File} imageFile - Document image file
 * @param {string} documentType - 'aadhaar' or 'pan'
 * @param {string} apiKey - Google Cloud Vision API key (optional, will use env var if not provided)
 * @returns {Promise<Object>} - Extracted document data
 */
export const processDocumentWithVisionAPI = async (imageFile, documentType, apiKey = null) => {
  const visionApiKey = apiKey || import.meta.env.VITE_GOOGLE_VISION_API_KEY;
  
  if (!visionApiKey) {
    return {
      success: false,
      error: 'Google Vision API key not configured',
      data: null
    };
  }

  const ocrResult = await extractTextWithVisionAPI(imageFile, visionApiKey);
  
  if (!ocrResult.success) {
    return {
      success: false,
      error: ocrResult.error || 'OCR extraction failed',
      data: null
    };
  }

  const extractedData = {
    text: ocrResult.text,
    confidence: ocrResult.confidence,
    method: 'google-vision-api'
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

