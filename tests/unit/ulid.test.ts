import { generateId } from '@/utils/generators/ulid';

jest.unmock('ulid');

describe('generateId', () => {
  it('should return a valid ULID string of 26 characters', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id).toHaveLength(26);
  });

  it('should generate unique IDs on multiple calls', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
