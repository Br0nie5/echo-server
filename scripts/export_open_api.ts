import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { buildServer } from '../echo_backend/src/server.js'

// Get current script file path
const __filename = fileURLToPath(import.meta.url)
// Get current script directory
const __dirname = path.dirname(__filename)

/** Boots the server and writes its OpenAPI document to `openApi.json`, the input of the types generation. */
async function exportOpenApi(): Promise<void> {
  const server = await buildServer()
  await server.ready()

  const openApi = server.swagger()

  // Build absolute path relative to the script file
  const outputPath = path.join(__dirname, '../openApi.json')

  fs.writeFileSync(outputPath, JSON.stringify(openApi, null, 2))

  console.log('✅ OpenAPI JSON exported to openApi.json')
  process.exit(0)
}

exportOpenApi()
