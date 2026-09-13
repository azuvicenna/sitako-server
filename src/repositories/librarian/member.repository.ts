import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { withCacheAndPagination } from "@/utils/data/repository";
import { clearCacheByPattern } from "@/utils/core/cache";
import { invalidateDashboardCache } from "./dashboard.repository";

export type MemberInsert = typeof members.$inferInsert;
export type MemberSelect = typeof members.$inferSelect;

const clearMemberCache = async () => {
  await Promise.all([
    clearCacheByPattern("member:*"),
    invalidateDashboardCache(),
  ]);
};

export const findMembersWithPagination = async (
  statusActive: string,
  page: number = 1,
  limit: number = 10,
  search: string = "",
) => {
  const trimmedSearch = search.trim();
  const cacheKey = `member:status:${statusActive}:search:${trimmedSearch}:page:${page}:limit:${limit}`;

  return withCacheAndPagination(
    cacheKey,
    page,
    limit,
    async (offset, limit) => {
      const conditions = [];

      if (statusActive !== "Semua") {
        conditions.push(eq(members.status_aktif, statusActive === "true"));
      }

      if (trimmedSearch) {
        const searchPattern = `%${trimmedSearch}%`;
        conditions.push(
          or(
            ilike(members.nama, searchPattern),
            ilike(members.nis, searchPattern),
            ilike(members.email, searchPattern),
            ilike(members.telepon, searchPattern),
          ),
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [data, [countResult]] = await Promise.all([
        db
          .select({
            id: members.id,
            nama: members.nama,
            nis: members.nis,
            email: members.email,
            telepon: members.telepon,
            foto: members.foto,
            status_aktif: members.status_aktif,
            createdAt: members.createdAt,
          })
          .from(members)
          .where(whereClause)
          .orderBy(desc(members.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ total: count() }).from(members).where(whereClause),
      ]);

      return { data, total: Number(countResult?.total ?? 0) };
    },
  );
};

export const findMemberById = async (id: string) => {
  const [member] = await db
    .select({
      id: members.id,
      nama: members.nama,
      nis: members.nis,
      email: members.email,
      telepon: members.telepon,
      foto: members.foto,
      status_aktif: members.status_aktif,
      createdAt: members.createdAt,
    })
    .from(members)
    .where(eq(members.id, id))
    .limit(1);

  return member ?? null;
};

export const findMemberRawById = async (
  id: string,
): Promise<MemberSelect | null> => {
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, id))
    .limit(1);

  return member ?? null;
};

export const insertMember = async (
  data: MemberInsert,
): Promise<MemberSelect> => {
  const [created] = await db.insert(members).values(data).returning();

  if (created) {
    await clearMemberCache();
  }

  return created;
};

export const updateMemberById = async (
  id: string,
  data: Partial<MemberInsert>,
): Promise<MemberSelect | null> => {
  const [updated] = await db
    .update(members)
    .set(data)
    .where(eq(members.id, id))
    .returning();

  if (updated) {
    await clearMemberCache();
  }

  return updated ?? null;
};

export const removeMemberById = async (
  id: string,
): Promise<MemberSelect | null> => {
  const [deleted] = await db
    .delete(members)
    .where(eq(members.id, id))
    .returning();

  if (deleted) {
    await clearMemberCache();
  }

  return deleted ?? null;
};
