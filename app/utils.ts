export const normalizeProductId = (id: string) => {
  return id.split("_")[0];
};

export const sanitizeDescription = (input?: string): string => {
  if (!input) return "";

  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")

    .replace(/<br\s*\/?>/gi, "\n")

    .replace(/<\/?[^>]+>/g, "")

    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
};
