/* global describe, it, expect, jest */
const aiService = require('../services/aiService');

jest.setTimeout(25000);

describe('AI Multilingual Translation & Voice Transcription Engine', () => {

  describe('aiService.translateText', () => {
    it('should translate regional text and detect source language', async () => {
      const hindiSample = 'पुस्तकालय में इंटरनेट काम नहीं कर रहा है।';
      const result = await aiService.translateText(hindiSample, 'English');
      
      expect(result).toHaveProperty('translated_text');
      expect(typeof result.translated_text).toBe('string');
      expect(result.translated_text.length).toBeGreaterThan(0);
      expect(result).toHaveProperty('source_language');
      expect(result).toHaveProperty('target_language', 'English');
    });

    it('should return original text if input is empty or invalid', async () => {
      const result = await aiService.translateText('', 'English');
      expect(result.translated_text).toBe('');
    });
  });

  describe('aiService.transcribeAudio', () => {
    it('should gracefully handle speech audio or fallback accurately', async () => {
      // Mock tiny base64 audio payload
      const mockAudio = Buffer.from('mock audio recording test data').toString('base64');
      const result = await aiService.transcribeAudio(mockAudio, 'audio/webm');
      
      expect(result).toHaveProperty('transcript');
      expect(typeof result.transcript).toBe('string');
      expect(result).toHaveProperty('language_detected');
      expect(result).toHaveProperty('title_suggestion');
    });
  });

});
