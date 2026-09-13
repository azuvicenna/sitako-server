import { randomUUID } from "crypto";
import { readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import * as typst from "typst";

export async function compileTypstFile(
  templateName: string,
  data: Record<string, string>,
): Promise<string> {
  const templatesDir = path.resolve(process.cwd(), "src", "templates");
  const filePath = path.resolve(templatesDir, templateName);

  if (!filePath.startsWith(templatesDir)) {
    throw new Error("Akses template tidak valid");
  }

  let content = await readFile(filePath, "utf-8");

  for (const [key, value] of Object.entries(data)) {
    content = content.replaceAll(`#${key}`, () => value);
  }

  const fileId = `${Date.now()}_${randomUUID().slice(0, 8)}`;
  const outputPath = filePath.replace(/\.typ$/, `_${fileId}.pdf`);
  const tempFilePath = filePath.replace(/\.typ$/, `_${fileId}_temp.typ`);

  await writeFile(tempFilePath, content, "utf-8");

  try {
    await typst.compile(tempFilePath, outputPath);
    return outputPath;
  } finally {
    await unlink(tempFilePath).catch(() => {});
  }
}
