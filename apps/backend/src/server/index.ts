import { serve } from "bun"
import { setupRoutes } from "../routes"

export const startServer = (port: number) => {
  const server = serve({
    port,
    fetch: (req) => setupRoutes(req),
  })

  console.log(`Server running at http://localhost:${server.port}`)

  return server
}
