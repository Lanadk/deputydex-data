import { config } from "dotenv"
import { existsSync } from "fs"

// Charger .env.local en local
if (!process.env.DB_URL && existsSync('.env.local')) {
    config({ path: '.env.local' })
    console.log('📄 Variables chargées depuis .env.local')
}