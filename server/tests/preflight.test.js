/* global describe, it, expect, jest */
const { runPreflight } = require('../../scripts/preflight-check');

jest.setTimeout(30000);

describe('Production Pre-Flight Audit Tool', () => {
  it('should execute preflight audit without crashing and return boolean status', async () => {
    const passed = await runPreflight();
    expect(typeof passed).toBe('boolean');
  }, 30000);
});
