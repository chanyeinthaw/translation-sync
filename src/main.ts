import { command } from '@/commands/main.js'
import { ConfigService } from '@/services/config/config.js'
import { TraduoraService } from '@/services/traduora/traduora.js'
import { Command } from '@effect/cli'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Console, Effect, Layer, pipe } from 'effect'

const cli = Command.run(command, {
  name: 'Translation Sync',
  version: 'v1000.0.0',
})

const program = pipe(
  cli(process.argv),
  Effect.catchTag('ConfigError', (e) => {
    switch (e.type) {
      case 'LoadError':
        return Console.error('Failed to load config file at ', e.options!.path)
      case 'NotLoaded':
        return Console.error('Config not loaded')
      case 'ParseError':
        return Console.error('Error parsing config', e.options!.cause)
    }
  }),
  Effect.catchTag('TraduoraError', (e) => {
    switch (e.type) {
      case 'FailedToAuthenticate':
        return Console.error('Failed to authenticate with Traduora.')
      case 'FailedToValidate':
        return Console.error('Failed to validate locales.')
      case 'InvalidLocales':
        return Console.error('Invalid locales. Available:', e.responseContent)
      case 'InvalidAuthResponse':
        return Console.error('Invalid auth response: ', e.responseContent)
      case 'InvalidTranslationsResponse':
        return Console.error(
          'Invalid translations response: ',
          e.responseContent
        )
    }
  }),
  // surpress these errors because they are default outputed by Command library
  Effect.catchTags({
    MissingValue: () => Effect.void,
    CommandMismatch: () => Effect.void,
  }),
  Effect.catchAll((e) => {
    return Console.error('Something went wrong!\n', e)
  })
)

const dependencies = Layer.mergeAll(
  NodeContext.layer,
  ConfigService.Default,
  TraduoraService.Default
)

const executable = program.pipe(Effect.provide(dependencies))
NodeRuntime.runMain(executable)
