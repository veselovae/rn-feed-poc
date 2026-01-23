import { XMLParser } from "fast-xml-parser";
import { Product } from "./types";

const FEED_URL = process.env.EXPO_PUBLIC_FEED_URL;

export async function fetchFeedXml(): Promise<string> {
  if (!FEED_URL) {
    throw new Error("EXPO_PUBLIC_FEED_URL is not defined");
  }

  const res = await fetch(FEED_URL, {
    method: "GET",
    headers: {
      Accept: "application/xml,text/xml,*/*",
      "User-Agent": "Mozilla/5.0 (Mobile; ReactNative PoC)",
    },
  });

  if (!res.ok) {
    const text = await safeReadText(res);
    throw new Error(
      `Failed to fetch feed XML: ${res.status} ${res.statusText}\n${text}`,
    );
  }

  return await res.text();
}

async function safeReadText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export function parseProductsFromXml(xml: string): Product[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    trimValues: true,
  });

  const obj = parser.parse(xml);

  return obj?.yml_catalog?.shop?.offers?.offer;
}
