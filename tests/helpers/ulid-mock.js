// Mock untuk package ulid — digunakan oleh schema untuk generate ID
module.exports = {
  ulid: () => '01MOCK-ULID-TEST-ID',
  monotonicFactory: () => () => '01MOCK-ULID-TEST-ID',
};
