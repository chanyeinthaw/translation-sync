import {
  FetchHttpClient,
  FileSystem,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from '@effect/platform'
import { NodeContext } from '@effect/platform-node'
import { Effect, Either, pipe, Ref, SynchronizedRef } from 'effect'
import path from 'path'
import { ConfigService } from '../config/config.js'
import { TraduoraError } from './errors.js'
import { AuthResponse, TranslationsResponse } from './schema.js'

export class TraduoraService extends Effect.Service<TraduoraService>()(
  'TraduoraSevice',
  {
    effect: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      const accessToken = yield* Ref.make<string | null>(null)
      const client = yield* HttpClient.HttpClient

      const authHeaderEffect = Effect.gen(function* () {
        const accessTokenValue = (yield* Ref.get(accessToken))!

        return HttpClientRequest.setHeader(
          'Authorization',
          `Bearer ${accessTokenValue}`
        )
      })

      return {
        authenticate: Effect.gen(function* () {
          const config = yield* ConfigService.pipe(
            Effect.flatMap((config) => config.get)
          )

          const url = config.host
          url.pathname = '/api/v1/auth/token'

          const request = yield* HttpClientRequest.post(url).pipe(
            HttpClientRequest.bodyJson({
              grant_type: 'client_credentials',
              client_id: config.clientId,
              client_secret: config.clientSecret,
            })
          )
          const response = yield* client.execute(request)

          if (response.status !== 200) {
            return yield* new TraduoraError({
              type: 'FailedToAuthenticate',
              statusCode: response.status,
              responseContent: yield* response.text,
            })
          }

          const responseResult = yield* pipe(
            response,
            HttpClientResponse.schemaBodyJson(AuthResponse),
            Effect.either
          )

          if (Either.isLeft(responseResult))
            return yield* new TraduoraError({
              type: 'InvalidAuthResponse',
              statusCode: response.status,
              responseContent: yield* response.text,
            })

          yield* Ref.set(accessToken, responseResult.right.access_token)
        }),

        validateLocales: Effect.gen(function* () {
          const config = yield* ConfigService.pipe(
            Effect.flatMap((config) => config.get)
          )
          const url = config.host
          url.pathname = `/api/v1/projects/${config.projectId}/translations`

          const request = HttpClientRequest.get(url).pipe(
            yield* authHeaderEffect
          )
          const response = yield* client.execute(request)
          if (response.status !== 200)
            return yield* new TraduoraError({
              type: 'FailedToValidate',
              statusCode: response.status,
              responseContent: yield* response.text,
            })

          const responseResult = yield* pipe(
            response,
            HttpClientResponse.schemaBodyJson(TranslationsResponse),
            Effect.either
          )

          if (Either.isLeft(responseResult))
            return yield* new TraduoraError({
              type: 'InvalidTranslationsResponse',
              statusCode: response.status,
              responseContent: yield* response.text,
            })

          const availableLocales = responseResult.right.data.map(
            (ts) => ts.locale.code
          )
          const hasInvalidLocales = config.locales.some((locale) => {
            return availableLocales.indexOf(locale) < 0
          })

          if (!hasInvalidLocales) return

          return yield* new TraduoraError({
            type: 'InvalidLocales',
            responseContent: availableLocales.join(', '),
          })
        }),

        downloadLocales: Effect.gen(function* () {
          const config = yield* ConfigService.pipe(
            Effect.flatMap((config) => config.get)
          )
          const url = config.host
          url.pathname = `/api/v1/projects/${config.projectId}/exports`
          const request = HttpClientRequest.get(url).pipe(
            yield* authHeaderEffect
          )

          const locales = yield* SynchronizedRef.make<Map<string, unknown>>(
            new Map()
          )

          const effects = config.locales.map((locale) =>
            downloadLocale(client, request, locale).pipe(
              Effect.flatMap((data) =>
                SynchronizedRef.updateEffect(locales, (locales) =>
                  Effect.gen(function* () {
                    locales.set(locale, data)

                    return locales
                  })
                )
              )
            )
          )

          yield* Effect.all(effects, {
            concurrency: 'unbounded',
          })

          return yield* SynchronizedRef.get(locales)
        }),

        writeLocales: (locales: Map<string, unknown>) =>
          Effect.gen(function* () {
            const config = yield* ConfigService.pipe(
              Effect.flatMap((config) => config.get)
            )
            if ((yield* fs.exists(config.outputDir)) !== true)
              yield* fs.makeDirectory(config.outputDir)

            const effects = []
            for (const [locale, content] of locales.entries()) {
              effects.push(
                fs.writeFileString(
                  path.join(config.outputDir, `${locale}.json`),
                  JSON.stringify(content, null, 2),
                  {
                    flag: 'w',
                  }
                )
              )
            }

            yield* Effect.all(effects, {
              concurrency: 'unbounded',
            })
          }),
      }
    }),
    dependencies: [NodeContext.layer, FetchHttpClient.layer],
  }
) {}

function downloadLocale(
  client: HttpClient.HttpClient,
  request: HttpClientRequest.HttpClientRequest,
  locale: string
) {
  return Effect.gen(function* () {
    const req = request.pipe(
      HttpClientRequest.setUrlParams({
        locale: locale,
        format: 'jsonnested',
      })
    )

    const response = yield* client.execute(req)

    return yield* response.json
  })
}
