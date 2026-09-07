/* global describe, it, expect, jest */
const { executeWithRetry } = require('../config/supabase');
const aiService = require('../services/aiService');

describe('Phase 2 Resilience & Retry Test Suite', () => {
  describe('Supabase executeWithRetry query wrapper', () => {
    it('should return result immediately on successful query', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ data: [{ id: 1, title: 'Resolved' }], error: null });
      const result = await executeWithRetry(mockQuery, { maxRetries: 2, initialDelayMs: 10 });

      expect(result).toEqual({ data: [{ id: 1, title: 'Resolved' }], error: null });
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient network drops and succeed', async () => {
      const mockQuery = jest.fn()
        .mockRejectedValueOnce(new Error('fetch failed: connection reset'))
        .mockResolvedValueOnce({ data: { success: true }, error: null });

      const result = await executeWithRetry(mockQuery, { maxRetries: 2, initialDelayMs: 10, backoffFactor: 1 });
      expect(result).toEqual({ data: { success: true }, error: null });
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should retry on transient 503 gateway error in result.error', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ data: null, error: { status: 503, message: 'Service Unavailable' } })
        .mockResolvedValueOnce({ data: [{ id: 42 }], error: null });

      const result = await executeWithRetry(mockQuery, { maxRetries: 2, initialDelayMs: 10, backoffFactor: 1 });
      expect(result).toEqual({ data: [{ id: 42 }], error: null });
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-transient errors like constraint violations', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } });

      const result = await executeWithRetry(mockQuery, { maxRetries: 3, initialDelayMs: 10 });
      expect(result.error.code).toBe('23505');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should stop after maxRetries if transient failures persist', async () => {
      const mockQuery = jest.fn()
        .mockRejectedValue(new Error('ETIMEDOUT: Connection timed out'));

      await expect(
        executeWithRetry(mockQuery, { maxRetries: 2, initialDelayMs: 10, backoffFactor: 1 })
      ).rejects.toThrow(/ETIMEDOUT/);

      expect(mockQuery).toHaveBeenCalledTimes(3); // Initial attempt + 2 retries
    });
  });

  describe('AI Gateway candidate model resilience', () => {
    it('should accurately categorize and compute urgency via resilient fallback heuristics', async () => {
      const result = await aiService.analyzeGrievance({
        title: 'Emergency Wi-Fi router failure in examination hall',
        description: 'Internet connection is completely broken and down during online exams, urgent assistance needed asap'
      });

      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('urgency');
      expect(['High', 'Medium']).toContain(result.urgency);
      expect(result).toHaveProperty('frustration_index');
      expect(result.frustration_index).toBeGreaterThanOrEqual(1);
    });

    it('should transcribe audio using multimodal fallback without unhandled exceptions', async () => {
      const mockBase64 = Buffer.from('test audio sample').toString('base64');
      const transcription = await aiService.transcribeAudio(mockBase64, 'audio/webm');

      expect(transcription).toHaveProperty('transcript');
      expect(typeof transcription.transcript).toBe('string');
      expect(transcription.transcript.length).toBeGreaterThan(0);
      expect(transcription).toHaveProperty('title_suggestion');
    });
  });
});
