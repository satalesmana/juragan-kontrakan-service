export interface PaginationOptions {
  page: number
  limit: number
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
}

export function parsePaginationQuery(query: Record<string, string | string[]>): PaginationOptions {
  const page = Math.max(1, parseInt(String(query.page ?? 1), 10))
  const maxLimit = parseInt(process.env.APP_MAX_LIMIT ?? '100', 10)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(query.limit ?? 20), 10)))
  const sort = typeof query.sort === 'string' && query.sort ? query.sort : undefined
  const order = (query.order === 'asc' || query.order === 'desc') ? query.order : 'asc'
  const search = typeof query.search === 'string' && query.search ? query.search : undefined

  return { page, limit, sort, order, search }
}

export function getSkip(page: number, limit: number): number {
  return (page - 1) * limit
}

export function buildSortOption(sortField: string, order: 'asc' | 'desc'): Record<string, 1 | -1> {
  return { [sortField]: order === 'asc' ? 1 : -1 }
}

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } } {
  return {
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
