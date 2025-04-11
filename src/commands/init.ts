import { Command, Options } from '@effect/cli'
import { FileSystem } from '@effect/platform'
import { Console, Effect, Schema } from 'effect'
import { CONFIG_FILE_NAME } from '../constants.js'
import { Config } from '../services/config/config.js'

const options = {
  host: Options.text('host')
    .pipe(Options.withDescription('Traduora host URL.'))
    .pipe(Options.withSchema(Schema.URL)),
  projectId: Options.text('project-id')
    .pipe(Options.withDescription('Traduora project ID.'))
    .pipe(Options.withSchema(Schema.NonEmptyString)),
  clientId: Options.text('client-id')
    .pipe(Options.withDescription('Traduora client ID.'))
    .pipe(Options.withSchema(Schema.NonEmptyString)),
  clientSecret: Options.text('client-secret')
    .pipe(Options.withDescription('Traduora client secret.'))
    .pipe(Options.withSchema(Schema.NonEmptyString)),
  locales: Options.text('locales')
    .pipe(Options.withDescription('Comma-separated list of locales.'))
    .pipe(Options.withDefault('en')),
  outputDir: Options.text('output')
    .pipe(Options.withDescription('Output directory.'))
    .pipe(Options.withDefault('messages')),
}

export const init = Command.make('init', options, (options) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const existsDefaultConfig = yield* fs.exists(CONFIG_FILE_NAME)

    if (existsDefaultConfig) {
      return yield* Console.log(
        `Configuration file already exists at ${CONFIG_FILE_NAME}`
      )
    }

    const config = new Config({
      host: options.host,
      projectId: options.projectId,
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      locales: options.locales.split(','),
      outputDir: options.outputDir,
    })
    const yamlContent = yield* config.stringify()
    yield* fs.writeFileString(CONFIG_FILE_NAME, yamlContent, {
      flag: 'w',
    })

    yield* Console.log(`Configuration file created at ${CONFIG_FILE_NAME}`)
  })
)
