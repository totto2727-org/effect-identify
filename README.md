# @totto2727/effect-identify

Minimal identifier schemas and prefixed UUIDv4 generation for Effect.

## Usage

Provide secure randomness at your application's composition root:

```ts
import { makePrefixedUUIDv4 } from '@totto2727/effect-identify'
import { Effect } from 'effect'
import { SecureRandom } from 'effect/crypto'

const userId = makePrefixedUUIDv4('user')
const id = await Effect.runPromise(userId.make.pipe(Effect.provide(SecureRandom.layerWebCrypto)))
// user_<UUIDv4>
```

## Prerequisites and setup

Use an ESM project with Node.js 24 or newer and Effect 4.1.4 or newer within major version 4.
Install with:

```bash
vp add @totto2727/effect-identify effect@^4.1.4
```

## API

### `UserDefinedId`

A string schema for 1 to 128 ASCII letters, digits, underscores, or hyphens.

```ts
import { UserDefinedId } from '@totto2727/effect-identify'
import { Schema } from 'effect'

const id = Schema.decodeUnknownSync(UserDefinedId)('my-project_01')
```

### `UUIDv4`

An Effect string schema that validates unprefixed UUID version 4 values, including the UUID variant.
It is the same schema used as the UUID component of each prefixed identifier.
Validation does not generate an identifier or require a randomness service.

```ts
import { UUIDv4 } from '@totto2727/effect-identify'
import { Schema } from 'effect'

const uuid = Schema.decodeUnknownSync(UUIDv4)('123e4567-e89b-42d3-a456-426614174000')
```

### `PrefixedUUIDv4`

`makePrefixedUUIDv4(prefix: UserDefinedId)` returns a `schema` for `<prefix>_<UUIDv4>` and a reusable `make` effect.
`PrefixedUUIDv4` is the schema-derived output type.
Provide secure randomness when running `make`, and use the returned schema to validate external identifiers for that prefix.

```ts
import { makePrefixedUUIDv4, type PrefixedUUIDv4 } from '@totto2727/effect-identify'
import { Effect, Schema } from 'effect'
import { SecureRandom } from 'effect/crypto'

const jobId = makePrefixedUUIDv4('job')
const id: PrefixedUUIDv4 = await Effect.runPromise(jobId.make.pipe(Effect.provide(SecureRandom.layerWebCrypto)))

const decodeJobId = Schema.decodeUnknownSync(jobId.schema)
const restored = decodeJobId('job_123e4567-e89b-42d3-a456-426614174000')
```

## Development

See [AGENTS.md](./AGENTS.md) for maintenance instructions.

## License

MIT

_This README was generated from the [share-artifact skill](https://raw.githubusercontent.com/totto2727-org/agent/refs/heads/main/plugins/totto2727-coding/skills/share-artifact/SKILL.md) and [README template](https://raw.githubusercontent.com/totto2727-org/agent/refs/heads/main/plugins/totto2727-coding/skills/share-artifact/readme/template.md)._
