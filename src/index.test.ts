// oxlint-disable rules/no-effect-runtime-run -- Each test is an independent consumer runtime boundary.
import { Effect, Schema } from 'effect'
import { SecureRandom } from 'effect/crypto'
import { describe, expect, test } from 'vite-plus/test'

// oxlint-disable-next-line rules/no-import-from-barrel-package -- These tests exercise the public entry point rather than its internals.
import { makePrefixedUUIDv4, UserDefinedId, UUIDv4 } from './index.ts'
// oxlint-disable-next-line rules/no-import-from-barrel-package -- The public export test checks the entire namespace.
import * as Identify from './index.ts'

const isUserDefinedId = Schema.is(UserDefinedId)
const isUUIDv4 = Schema.is(UUIDv4)
const maxIdentifierLength = 128
const oversizedIdentifier = 'a'.repeat(maxIdentifierLength + 1)
const uuid = '123e4567-e89b-42d3-a456-426614174000'

// oxlint-disable-next-line unicorn/no-null -- Exercise null supplied by a JavaScript consumer.
const missingIdentifiers = [null, undefined]

describe('user-defined identifiers', () => {
  test.each(['a', 'AZaz09_-', 'a'.repeat(maxIdentifierLength)])('accepts ASCII identifier %s', (value) => {
    expect(isUserDefinedId(value)).toBe(true)
  })

  test.each([
    '',
    oversizedIdentifier,
    ' a',
    'a ',
    'a b',
    '\t',
    'a\n',
    'a\r',
    'a\0',
    'a/b',
    String.raw`a\b`,
    '.',
    '日本語',
    'é',
    'Ａ',
    '😀',
    1,
    ...missingIdentifiers,
  ])('rejects invalid identifier %j', (value) => {
    expect(isUserDefinedId(value)).toBe(false)
  })
})

describe('unprefixed and prefixed UUID validation', () => {
  test('exports the standalone UUIDv4 schema alongside the identifier API', () => {
    expect(Object.keys(Identify).toSorted()).toStrictEqual(['UUIDv4', 'UserDefinedId', 'makePrefixedUUIDv4'])
    expect(Identify.UUIDv4).toBe(UUIDv4)
  })

  test('accepts UUIDv4', () => {
    expect(isUUIDv4(uuid)).toBe(true)
    expect(Schema.is(makePrefixedUUIDv4('test').schema)(`test_${uuid}`)).toBe(true)
  })

  test.each(['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-42d3-7456-426614174000', 'not-a-uuid'])(
    'rejects non-v4 UUID %s',
    (value) => {
      expect(isUUIDv4(value)).toBe(false)
      expect(Schema.is(makePrefixedUUIDv4('test').schema)(`test_${value}`)).toBe(false)
    },
  )

  test('schema accepts only the configured prefix and a UUIDv4', () => {
    const { schema } = makePrefixedUUIDv4('user_')
    const isPrefixedUUIDv4 = Schema.is(schema)
    expect(isPrefixedUUIDv4(`user__${uuid}`)).toBe(true)
    expect(isPrefixedUUIDv4(`other_${uuid}`)).toBe(false)
    expect(isPrefixedUUIDv4('user__not-a-uuid')).toBe(false)
  })
})

describe('prefixed UUID generation', () => {
  test.each(['', oversizedIdentifier, ' a', 'a/b', '日本語'])('rejects invalid prefix synchronously %j', (prefix) => {
    expect(() => makePrefixedUUIDv4(prefix)).toThrow(Schema.SchemaError)
  })

  test('make generates valid prefixed UUIDv4 through an externally supplied real service', async () => {
    const { make, schema } = makePrefixedUUIDv4('user')
    const value = await Effect.runPromise(make.pipe(Effect.provide(SecureRandom.layerWebCrypto)))
    expect(value).toMatch(/^user_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u)
    expect(Schema.is(schema)(value)).toBe(true)
  })

  test('make is reusable and each execution generates a new identifier', async () => {
    const factory = makePrefixedUUIDv4('job')
    expect(Object.keys(factory)).toStrictEqual(['schema', 'make'])
    const { make, schema } = factory
    const isPrefixedUUIDv4 = Schema.is(schema)
    const program = make.pipe(Effect.provide(SecureRandom.layerWebCrypto))
    const first = await Effect.runPromise(program)
    const second = await Effect.runPromise(program)
    expect(isPrefixedUUIDv4(first)).toBe(true)
    expect(isPrefixedUUIDv4(second)).toBe(true)
    expect(first).not.toBe(second)
  })

  test('the same make effect uses the randomness service supplied for each execution', async () => {
    const { make, schema } = makePrefixedUUIDv4('injected')
    const isPrefixedUUIDv4 = Schema.is(schema)
    const firstService = SecureRandom.make((size) => new Uint8Array(size).fill(1))
    const secondService = SecureRandom.make((size) => new Uint8Array(size).fill(2))
    const first = await Effect.runPromise(make.pipe(Effect.provideService(SecureRandom.SecureRandom, firstService)))
    const second = await Effect.runPromise(make.pipe(Effect.provideService(SecureRandom.SecureRandom, secondService)))
    expect(first).toBe('injected_01010101-0101-4101-8101-010101010101')
    expect(second).toBe('injected_02020202-0202-4202-8202-020202020202')
    expect(isPrefixedUUIDv4(first)).toBe(true)
    expect(isPrefixedUUIDv4(second)).toBe(true)
  })
})
