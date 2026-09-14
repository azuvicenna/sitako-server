import { generateTransactionCode } from '@/utils/generators/transaction-code';

describe('generateTransactionCode', () => {
  it('should return a code with the correct default format and length', () => {
    const code = generateTransactionCode();
    expect(code).toMatch(/^TRX-\d{8}-[A-Z0-9]{6}$/);
  });

  it('should handle custom length parameter', () => {
    const code = generateTransactionCode(10);
    expect(code).toMatch(/^TRX-\d{8}-[A-Z0-9]{10}$/);
  });

  it('should generate unique codes on multiple calls', () => {
    const code1 = generateTransactionCode();
    const code2 = generateTransactionCode();
    expect(code1).not.toBe(code2);
  });
});
