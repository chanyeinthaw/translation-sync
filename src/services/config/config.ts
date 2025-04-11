import { FileSystem } from '@effect/platform'
import { NodeContext } from '@effect/platform-node'
import { Data, Effect, Ref, Schema } from 'effect'
import * as YAML from 'yaml'

export class Config extends Schema.Class<Config>('Config')({
  host: Schema.URL,

  projectId: Schema.NonEmptyString,
  clientId: Schema.NonEmptyString,
  clientSecret: Schema.NonEmptyString,

  locales: Schema.Array(Schema.NonEmptyString),
  outputDir: Schema.NonEmptyString,
}) {
  static parse(contents: string) {
    return Effect.gen(function* () {
      const unknownConfig = yield* Effect.try({
        try: () => YAML.parse(contents),
        catch: (e) => {
          return new ConfigError({
            type: 'ParseError',
            options: {
              content: contents,
              cause: e,
            },
          })
        },
      })
      return yield* Schema.decodeUnknownEither(Config)(unknownConfig).pipe(
        Effect.catchTag(
          'ParseError',
          (e) =>
            new ConfigError({
              type: 'ParseError',
              options: {
                content: contents,
                cause: e,
              },
            })
        )
      )
    })
  }

  stringify() {
    return Effect.sync(() => YAML.stringify(this))
  }
}

export class ConfigError extends Data.TaggedError('ConfigError')<{
  type: 'LoadError' | 'ParseError' | 'NotLoaded'
  options?: {
    path?: string
    content?: string
    cause?: unknown
  }
}> {}

export class ConfigService extends Effect.Service<ConfigService>()('Config', {
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const config = yield* Ref.make<Config | null>(null)

    return {
      load: (path: string) =>
        Effect.gen(function* () {
          const exists = yield* fs.exists(path)
          if (!exists)
            return yield* Effect.fail(
              new ConfigError({
                type: 'LoadError',
                options: {
                  path,
                },
              })
            )

          const contents = (yield* fs.readFile(path)).toString()
          const parsedConfig = yield* Config.parse(contents)
          yield* Ref.set(config, parsedConfig)

          return parsedConfig
        }),

      get: Effect.gen(function* () {
        const value = yield* Ref.get(config)

        if (value === null) {
          return yield* Effect.fail(
            new ConfigError({
              type: 'NotLoaded',
            })
          )
        }

        return value
      }),
    }
  }),
  dependencies: [NodeContext.layer],
}) {}
