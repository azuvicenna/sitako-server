import { Request, Response } from 'express';
import * as reportService from '@/services/librarian/report.service';
import type { DateRangeFilter, ReportFormat } from '@/types/report.types';
import { sendError, sendSuccess } from '@/utils/core/handler';

const buildDateFilter = (query: Record<string, unknown>): DateRangeFilter => {
  const startDateStr = typeof query.startDate === 'string' ? query.startDate : undefined;
  const endDateStr = typeof query.endDate === 'string' ? query.endDate : undefined;

  return {
    startDate: startDateStr ? new Date(`${startDateStr}T00:00:00.000Z`) : undefined,
    endDate: endDateStr ? new Date(`${endDateStr}T23:59:59.999Z`) : undefined,
  };
};

const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCirculationReportHandler = async (req: Request, res: Response) => {
  try {
    const filter = buildDateFilter(req.query);
    const format = (req.query.format as ReportFormat) || 'json';
    const today = getTodayDateString();

    if (format === 'xlsx') {
      const buffer = await reportService.exportCirculationExcel(filter);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="laporan-sirkulasi-${today}.xlsx"`,
      );
      return res.send(buffer);
    }

    if (format === 'csv') {
      const buffer = await reportService.exportCirculationCsv(filter);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="laporan-sirkulasi-${today}.csv"`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const buffer = await reportService.exportReportPdf(filter);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="laporan-sirkulasi-denda-${today}.pdf"`,
      );
      return res.send(buffer);
    }

    const data = await reportService.getCirculationReport(filter);
    return sendSuccess(res, { data });
  } catch (error) {
    return sendError(res, error, 'getCirculationReportHandler');
  }
};

export const getFineReportHandler = async (req: Request, res: Response) => {
  try {
    const filter = buildDateFilter(req.query);
    const format = (req.query.format as ReportFormat) || 'json';
    const today = getTodayDateString();

    if (format === 'xlsx') {
      const buffer = await reportService.exportFineExcel(filter);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="laporan-denda-${today}.xlsx"`);
      return res.send(buffer);
    }

    if (format === 'csv') {
      const buffer = await reportService.exportFineCsv(filter);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="laporan-denda-${today}.csv"`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const buffer = await reportService.exportReportPdf(filter);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="laporan-sirkulasi-denda-${today}.pdf"`,
      );
      return res.send(buffer);
    }

    const data = await reportService.getFineReport(filter);
    return sendSuccess(res, { data });
  } catch (error) {
    return sendError(res, error, 'getFineReportHandler');
  }
};
