import {
  getDashboardSummaryRepo,
  getTodaySummaryRepo,
  getTodayTransactionsRepo,
  getWeeklyStatisticsRepo,
} from "@/repositories/librarian/dashboard.repository";
import { withCache } from "@/utils/data/repository";

const dayFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
});

export const getDashboardSummaryService = async () => {
  return getDashboardSummaryRepo();
};

export const getTodayTransactionsService = async (
  page: number,
  limit: number,
  status: string,
) => {
  const statusKey = status || "Semua";

  const [paginatedData, summaryData] = await Promise.all([
    getTodayTransactionsRepo(page, limit, statusKey),
    getTodaySummaryRepo(),
  ]);

  return {
    ...paginatedData,
    summary: summaryData,
  };
};

export const getWeeklyStatisticsService = async () => {
  return withCache("dashboard:statistics:weekly", 300, async () => {
    const rawData = await getWeeklyStatisticsRepo();

    const now = new Date();
    const stats = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - i));

      return {
        tanggal: date.toISOString().split("T")[0],
        hari: dayFormatter.format(date),
        total: 0,
      };
    });

    const statsMap = new Map(stats.map((item) => [item.tanggal, item]));
    let totalBorrows = 0;

    for (const trx of rawData) {
      const dateStr = trx.createdAt.toISOString().split("T")[0];
      const dayStat = statsMap.get(dateStr);

      if (dayStat) {
        dayStat.total += 1;
        totalBorrows += 1;
      }
    }

    const average = Math.round(totalBorrows / 7);

    return {
      statistik: stats,
      rataRata: average,
    };
  });
};
