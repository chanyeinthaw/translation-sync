import { Data } from 'effect'

export class TraduoraError extends Data.TaggedError('TraduoraError')<{
  type:
    | 'FailedToAuthenticate'
    | 'FailedToValidate'
    | 'InvalidLocales'
    | 'InvalidAuthResponse'
    | 'InvalidTranslationsResponse'
  statusCode?: number
  responseContent?: string
}> {}
