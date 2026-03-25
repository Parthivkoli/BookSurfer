// lib/validations/search.ts
import { z } from 'zod';

export const bookSearchSchema = z.object({
  query: z.string()
    .min(1, 'Search query required')
    .max(200, 'Search query too long')
    .refine((val) => val.trim().length > 0, 'Search query cannot be empty'),
  category: z.string().optional(),
  sortBy: z.enum(['relevance', 'newest', 'popular']).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export type BookSearchData = z.infer<typeof bookSearchSchema>;
