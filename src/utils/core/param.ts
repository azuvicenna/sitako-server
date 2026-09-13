export const resolveParam = (param?: string | string[]): string => {
  const value = Array.isArray(param) ? param[0] : param;
  return typeof value === "string" ? value.trim() : "";
};
