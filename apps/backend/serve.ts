import { startServer } from "./src/server"

startServer(process.env.PORT ? parseInt(process.env.PORT) : 80)
