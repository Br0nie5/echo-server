import path from 'path'

import type { EchoError } from '@echo/utilities'
import fastifyStatic from '@fastify/static'
import type { FastifyReply } from 'fastify'

import type { ServerConfig } from '../shared/config/backConfig.js'
import type { FilesService } from '../shared/services/files.service.js'

import type { EchoServer } from './types/echoServer.js'

const INDEX_HTML_FILE_NAME = 'index.html'

/**
 * Serves the built frontend under `appRoutePrefix`.
 *
 * The frontend is built with relative URLs, so it can be reached at any path behind a reverse
 * proxy: `index.html`, read through `filesService`, is answered with a `<base>` saying where it
 * really is (`basePath` followed by `appRoutePrefix`), for its URLs to resolve against it. It is
 * answered to the prefix itself and to any unknown path under it (SPA routing). Anything else gets
 * a 404 `EchoError`, a path that only starts like the prefix (`/application` for `/app`) included.
 */
export const registerFrontend = async (
  server: EchoServer,
  { frontendDistDirPath, basePath, appRoutePrefix }: ServerConfig,
  filesService: FilesService
): Promise<void> => {
  await server.register(fastifyStatic, {
    root: frontendDistDirPath,
    prefix: appRoutePrefix,
    index: false,
    allowedPath: (pathName) => pathName !== `/${INDEX_HTML_FILE_NAME}`
  })

  const isFrontendPath = (url: string): boolean => {
    const urlPath = url.split('?')[0]

    return urlPath === appRoutePrefix || urlPath.startsWith(`${appRoutePrefix}/`)
  }

  const getIndexHtml = async (): Promise<string> => {
    const indexHtml = await filesService.getFileContent(
      path.join(frontendDistDirPath, INDEX_HTML_FILE_NAME)
    )

    return indexHtml.replace(
      /<head[^>]*>/i,
      (headTag) => `${headTag}<base href="${basePath}${appRoutePrefix}/">`
    )
  }

  const sendIndexHtml = async (reply: FastifyReply): Promise<FastifyReply> =>
    reply.type('text/html; charset=utf-8').send(await getIndexHtml())

  // @fastify/static answers a directory with a 403 when it is not to serve its index.html.
  server.get(`${appRoutePrefix}/`, { schema: { hide: true } }, async (_request, reply) =>
    sendIndexHtml(reply)
  )

  server.setNotFoundHandler(async (request, reply) => {
    if (isFrontendPath(request.url)) {
      return sendIndexHtml(reply)
    }

    const error: EchoError = { statusCode: 404, message: 'Not found.' }
    return reply.status(error.statusCode).send(error)
  })
}
