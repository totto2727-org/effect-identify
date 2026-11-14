import { Effect, Schema } from 'effect'
import { SecureRandom } from 'effect/crypto'

export const UserDefinedId = Schema.String.check(
  Schema.isMaxLength(128),
  Schema.isTrimmed(),
  Schema.isPattern(/^[A-Za-z0-9_-]+$/),
)
export type UserDefinedId = typeof UserDefinedId.Type

export const decodeUserDefinedId = Schema.decodeUnknownSync(UserDefinedId)

export const UUIDv4 = Schema.String.check(Schema.isUUID(4))

export function makePrefixedUUIDv4(prefix: UserDefinedId) {
  const fixedPrefix = decodeUserDefinedId(prefix) + '_'
  const schema = Schema.TemplateLiteral([fixedPrefix, UUIDv4])
  const decode = Schema.decodeUnknownEffect(schema)
  const make = Effect.fn('Identity.makePrefixedUUIDv4')(function* () {
    const crypto = yield* SecureRandom.SecureRandom
    const uuid = yield* crypto.uuidV4()
    return yield* decode(fixedPrefix + uuid).pipe(Effect.orDie)
  })()
  return { schema, make }
}

export type PrefixedUUIDv4 = ReturnType<typeof makePrefixedUUIDv4>['schema']['Type']
