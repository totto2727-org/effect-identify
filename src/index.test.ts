import { Effect, Schema } from 'effect'
import { SecureRandom } from 'effect/crypto'
import { expect, test } from 'vite-plus/test'

import { makePrefixedUUIDv4, UserDefinedId, UUIDv4 } from './index.ts'
import * as Identify from './index.ts'

const decodeUserDefinedId = Schema.decodeUnknownSync(UserDefinedId)

test.each(['a', 'AZaz09_-', 'a'.repeat(128)])('accepts ASCII identifier %s', (value) => {
  expect(decodeUserDefinedId(value)).toBe(value)
  expect(Schema.decodeUnknownSync(UserDefinedId)(value)).toBe(value)
})

test.each([
  '',
  'a'.repeat(129),
  ' a',
  'a ',
  'a b',
  '\t',
  'a\n',
  'a\r',
  'a\0',
  'a/b',
  'a\\b',
  '.',
  '日本語',
  'é',
  'Ａ',
  '😀',
  1,
  null,
  undefined,
])('rejects invalid identifier %j', (value) => {
  expect(() => decodeUserDefinedId(value)).toThrow()
})

test.each(['', 'a'.repeat(129), ' a', 'a/b', '日本語'])('rejects invalid prefix synchronously %j', (prefix) => {
  expect(() => makePrefixedUUIDv4(prefix)).toThrow()
})

const uuid = '123e4567-e89b-42d3-a456-426614174000'

test('accepts UUIDv4', () => {
  expect(Schema.decodeUnknownSync(UUIDv4)(uuid)).toBe(uuid)
  expect(Schema.decodeUnknownSync(makePrefixedUUIDv4('test').schema)(`test_${uuid}`)).toBe(`test_${uuid}`)
})

test('exports the standalone UUIDv4 schema alongside the identifier API', () => {
  expect(Object.keys(Identify).sort()).toEqual(['UUIDv4', 'UserDefinedId', 'makePrefixedUUIDv4'])
  expect(Identify.UUIDv4).toBe(UUIDv4)
})

test.each(['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-42d3-7456-426614174000', 'not-a-uuid'])(
  'rejects non-v4 UUID %s',
  (value) => {
    expect(() => Schema.decodeUnknownSync(UUIDv4)(value)).toThrow()
    expect(() => Schema.decodeUnknownSync(makePrefixedUUIDv4('test').schema)(`test_${value}`)).toThrow()
  },
)

test('schema accepts only the configured prefix and a UUIDv4', () => {
  const { schema } = makePrefixedUUIDv4('user_')
  const decode = Schema.decodeUnknownSync(schema)
  expect(decode(`user__${uuid}`)).toBe(`user__${uuid}`)
  expect(() => decode(`other_${uuid}`)).toThrow()
  expect(() => decode('user__not-a-uuid')).toThrow()
})

test('make generates valid prefixed UUIDv4 through an externally supplied real service', async () => {
  const { schema, make } = makePrefixedUUIDv4('user')
  const value = await Effect.runPromise(make.pipe(Effect.provide(SecureRandom.layerWebCrypto)))
  expect(value).toMatch(/^user_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  expect(Schema.decodeUnknownSync(schema)(value)).toBe(value)
})

test('make is reusable and each execution generates a new identifier', async () => {
  const factory = makePrefixedUUIDv4('job')
  expect(Object.keys(factory).sort()).toEqual(['make', 'schema'])
  const { schema, make } = factory
  const program = make.pipe(Effect.provide(SecureRandom.layerWebCrypto))
  const first = await Effect.runPromise(program)
  const second = await Effect.runPromise(program)
  expect(Schema.decodeUnknownSync(schema)(first)).toBe(first)
  expect(Schema.decodeUnknownSync(schema)(second)).toBe(second)
  expect(first).not.toBe(second)
})

test('the same make effect uses the randomness service supplied for each execution', async () => {
  const { make, schema } = makePrefixedUUIDv4('injected')
  const firstService = SecureRandom.make((size) => new Uint8Array(size).fill(1))
  const secondService = SecureRandom.make((size) => new Uint8Array(size).fill(2))
  const first = await Effect.runPromise(make.pipe(Effect.provideService(SecureRandom.SecureRandom, firstService)))
  const second = await Effect.runPromise(make.pipe(Effect.provideService(SecureRandom.SecureRandom, secondService)))
  expect(first).toBe('injected_01010101-0101-4101-8101-010101010101')
  expect(second).toBe('injected_02020202-0202-4202-8202-020202020202')
  expect(Schema.decodeUnknownSync(schema)(first)).toBe(first)
  expect(Schema.decodeUnknownSync(schema)(second)).toBe(second)
})
