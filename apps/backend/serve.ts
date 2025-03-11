import { startServer } from "./src/server"

console.log("HEY MAN", process.env.PORT)
console.log("r2 access key", process.env.R2_ACCESS_KEY_ID)
startServer(process.env.PORT ? parseInt(process.env.PORT) : 80)
