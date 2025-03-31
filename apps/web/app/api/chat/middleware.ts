import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Middleware для отключения кеширования для API-запросов чата
export function addNoCacheHeaders(response: NextResponse): NextResponse {
  // Устанавливаем заголовки для отключения кеширования
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")
  return response
}

// Оборачиваем API-запрос, чтобы отключить кеширование
export function withNoCache<T>(
  handler: (req: NextRequest, params: any) => Promise<NextResponse<T>>,
) {
  return async function (
    req: NextRequest,
    params: any,
  ): Promise<NextResponse<T>> {
    const response = await handler(req, params)
    return addNoCacheHeaders(response)
  }
}
