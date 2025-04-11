import { init } from '@/commands/init.js'
import { CONFIG_FILE_NAME } from '@/constants.js'
import { ConfigService } from '@/services/config/config.js'
import { TraduoraService } from '@/services/traduora/traduora.js'
import { Command, Options } from '@effect/cli'
import { Console, Effect, pipe } from 'effect'

const configPath = Options.file('config', {
  exists: 'yes',
})
  .pipe(
    Options.withDescription(
      'Path to config file. Defaults to translation-sync.yaml'
    )
  )
  .pipe(Options.withAlias('c'))
  .pipe(Options.withDefault(CONFIG_FILE_NAME))

const main = Command.make(
  'translation-sync',
  { configPath },
  ({ configPath }) =>
    Effect.gen(function* () {
      const configService = yield* ConfigService
      yield* configService.load(configPath)

      const traduora = yield* TraduoraService
      yield* traduora.authenticate
      yield* traduora.validateLocales

      yield* pipe(
        traduora.downloadLocales,
        Effect.flatMap(traduora.writeLocales)
      )

      yield* Console.log('Translations synced successfully!')
    })
)

export const command = main.pipe(Command.withSubcommands([init]))
