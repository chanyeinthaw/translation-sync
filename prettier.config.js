/**
 * @type {import('prettier').Options}
 */
const config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,

  plugins: ['prettier-plugin-organize-imports'],
}

export default config
