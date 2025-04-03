import { Book, BookSearchParams } from "@/types/book";

export interface LightNovel {
  id: string;
  title: string;
  genre: string;
  source: "lnmtl" | "royalroad" | "webnovel";
  url: string;
}

export async function searchLNMTL(params: BookSearchParams): Promise<Book[]> {
  // TODO: Implement LNMTL search
  return [];
}

export async function searchRoyalRoad(params: BookSearchParams): Promise<Book[]> {
  // TODO: Implement RoyalRoad search
  return [];
}

export async function searchWebnovel(params: BookSearchParams): Promise<Book[]> {
  // TODO: Implement Webnovel search
  return [];
} 