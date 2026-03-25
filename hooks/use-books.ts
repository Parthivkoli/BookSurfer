'use client';

import useSWR from 'swr';
import { Book, BookSearchParams } from '@/types/book';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    error.info = await res.json().catch(() => null);
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export function useSearchBooks(params: BookSearchParams) {
  const queryString = new URLSearchParams(params as any).toString();
  const { data, error, isLoading } = useSWR<{books: Book[], totalItems: number}>(
    `/api/books/search?${queryString}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, 
    }
  );

  return {
    data,
    isLoading,
    isError: error
  };
}

export function useBookDetails(id: string | null) {
  const { data, error, isLoading } = useSWR<Book>(
    id ? `/api/books/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, 
    }
  );

  return {
    book: data,
    isLoading,
    isError: error
  };
}
