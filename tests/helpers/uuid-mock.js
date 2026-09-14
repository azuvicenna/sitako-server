// Mock untuk package uuid — digunakan oleh services yang generate ID
module.exports = {
  v4: () => 'mock-uuid-v4-test-id',
  v1: () => 'mock-uuid-v1-test-id',
};
