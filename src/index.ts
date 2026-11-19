import { Cause, Effect, Exit, Schema } from 'effect'
import { SecureRandom } from 'effect/crypto'

const maxIdentifierLength = 128
const uuidVersion = 4

// oxlint-disable-next-line eslint/no-redeclare -- The public schema and its inferred type share a name.
const UserDefinedId = Schema.String.check(
  Schema.isMaxLength(maxIdentifierLength),
  Schema.isTrimmed(),
  Schema.isPattern(/^[A-Za-z0-9_-]+$/u),
)
type UserDefinedId = typeof UserDefinedId.Type

const decodeUserDefinedId = Schema.decodeExit(UserDefinedId)
const UUIDv4 = Schema.String.check(Schema.isUUID(uuidVersion))

type PrefixedSchema = Schema.TemplateLiteral<readonly [string, Schema.String]>
type PrefixedUUIDv4 = PrefixedSchema['Type']

const makePrefixedUUIDv4 = (
  prefix: UserDefinedId,
): { make: Effect.Effect<PrefixedUUIDv4, never, SecureRandom.SecureRandom>; schema: PrefixedSchema } => {
  const decodedPrefix = decodeUserDefinedId(prefix)
  if (Exit.isFailure(decodedPrefix)) {
    throw Cause.squash(decodedPrefix.cause)
  }

  const fixedPrefix = `${decodedPrefix.value}_`
  const schema = Schema.TemplateLiteral([fixedPrefix, UUIDv4])
  // oxlint-disable-next-line rules/require-top-level-decoder -- This schema captures the validated factory prefix; reuse its decoder across executions of make.
  const decode = Schema.decodeEffect(schema)
  const make = Effect.gen(function* () {
    const crypto = yield* SecureRandom.SecureRandom
    const uuid = yield* crypto.uuidV4()
    return yield* decode(`${fixedPrefix}${uuid}`).pipe(Effect.orDie)
  })
  // oxlint-disable-next-line eslint/sort-keys -- Keep the returned object's existing property order.
  return { schema, make }
}

export { makePrefixedUUIDv4, type PrefixedUUIDv4, UserDefinedId, UUIDv4 }
