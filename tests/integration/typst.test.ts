import * as fs from 'fs/promises';
import * as typst from 'typst';
import * as crypto from 'crypto';
import { compileTypstFile } from '@/utils/services/typst';

jest.mock('fs/promises');
jest.mock('typst');
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: () => '',
}));

describe('compileTypstFile Unit Test', () => {
  let dateSpy: jest.SpyInstance;

  beforeAll(() => {
    dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1000000000);
  });

  afterAll(() => {
    dateSpy.mockRestore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should replace template variables, compile pdf, and cleanup temp file', async () => {
    const mockContent = 'Halo #nama, tagihanmu #total.';
    const mockData = { nama: 'Budi', total: '50000' };

    (fs.readFile as jest.Mock).mockResolvedValue(mockContent);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
    (typst.compile as jest.Mock).mockResolvedValue(undefined);

    const result = await compileTypstFile('invoice.typ', mockData);

    expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('invoice.typ'), 'utf-8');
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/invoice_1000000000.*temp\.typ$/),
      'Halo Budi, tagihanmu 50000.',
      'utf-8',
    );
    expect(typst.compile).toHaveBeenCalledWith(
      expect.stringMatching(/invoice_1000000000.*temp\.typ$/),
      expect.stringMatching(/invoice_1000000000.*\.pdf$/),
    );
    expect(fs.unlink).toHaveBeenCalledWith(expect.stringMatching(/invoice_1000000000.*temp\.typ$/));
    expect(result).toMatch(/invoice_1000000000.*\.pdf$/);
  });

  it('should always delete temp file even if compilation fails', async () => {
    (fs.readFile as jest.Mock).mockResolvedValue('Template error');
    (typst.compile as jest.Mock).mockRejectedValue(new Error('Typst Error'));
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);

    await expect(compileTypstFile('error.typ', {})).rejects.toThrow('Typst Error');

    expect(fs.unlink).toHaveBeenCalledWith(expect.stringMatching(/error_1000000000.*temp\.typ$/));
  });
});
