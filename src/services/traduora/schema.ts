import { Schema } from "effect";

export class AuthResponse extends Schema.Class<AuthResponse>('AuthResponse')({
  access_token: Schema.NonEmptyString,
  expires_in: Schema.NonEmptyString,
}) {}

class Translation extends Schema.Class<Translation>('Translation')({
  locale: Schema.Struct({
    code: Schema.NonEmptyString,
  }),
}) {}

export class TranslationsResponse extends Schema.Class<TranslationsResponse>(
  'TranslationsResponse'
)({
  data: Schema.Array(Translation),
}) {}
