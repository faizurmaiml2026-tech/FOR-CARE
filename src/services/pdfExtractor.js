/**
 * AI HEALTH RECORDS — In-Browser PDF Text Extraction
 * Powered by local Mozilla pdf.js (no external CDNs or network calls)
 */
(function (global) {
  'use strict';

  // Configure worker path to local worker script
  if (global.pdfjsLib) {
    try {
      global.pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';
    } catch (_) {}
  }

  /**
   * Extracts digital text from a PDF File or Blob
   * @param {File|Blob} file
   * @returns {Promise<{success: boolean, text: string, pageCount: number, isScanned?: boolean, error?: string}>}
   */
  async function extractTextFromPdf(file) {
    if (!file) {
      return { success: false, error: 'No file selected for text extraction.' };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File exceeds the 10 MB limit.' };
    }

    if (!global.pdfjsLib) {
      console.warn('pdf.js library not initialized in window. Proceeding with vault archival.');
      return {
        success: true,
        text: '',
        pageCount: 1,
        isScanned: true
      };
    }

    try {
      const buffer = await file.arrayBuffer();
      const loadingTask = global.pdfjsLib.getDocument({
        data: buffer,
        isEvalSupported: false,
        useWorkerFetch: false
      });

      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages || 1;
      const textPieces = [];

      for (let i = 1; i <= numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageStrings = (content.items || []).map((it) => it.str);
          textPieces.push(pageStrings.join(' '));
        } catch (pageErr) {
          console.warn('Could not extract text from PDF page ' + i + ':', pageErr);
        }
      }

      const fullText = textPieces.join('\n\n').trim();
      const nonWhitespaceChars = fullText.replace(/\s+/g, '').length;
      const isScanned = nonWhitespaceChars < 25;

      return {
        success: true,
        text: fullText,
        pageCount: numPages,
        isScanned: isScanned
      };
    } catch (err) {
      console.error('PDF parsing error:', err);
      return {
        success: false,
        error: 'Unable to parse PDF content. The file might be corrupted or encrypted with a password.'
      };
    }
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.pdfExtractor = {
    extractText: extractTextFromPdf
  };
})(window);
