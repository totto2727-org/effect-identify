# @totto2727/effect-identify

Minimal identifier schemas and prefixed UUIDv4 generation for Effect.

## Usage

Provide secure randomness at your application's composition root:

```ts
import { decodeUserDefinedId, makePrefixedUUIDv4 } from '@totto2727/effect-identify'
import { Effect } from 'effect'
import { SecureRandom } from 'effect/crypto'

const userId = makePrefixedUUIDv4(decodeUserDefinedId('user'))
const id = await Effect.runPromise(userId.make.pipe(Effect.provide(SecureRandom.layerWebCrypto)))
// user_<UUIDv4>
```

## Prerequisites and setup

Use an ESM project with Node.js 24 or newer and Effect 4.1.4 or newer within major version 4.
Install with Vite+ when the package is available on npm:

```bash
vp add @totto2727/effect-identify effect@^4.1.4
```

This repository is currently private and registry publication is disabled.

## API

### `UserDefinedId` and `type UserDefinedId`

An Effect string schema and its inferred type.
Accepts 1 to 128 ASCII letters, digits, underscores, or hyphens.
Rejects whitespace, control characters, path separators, and Unicode characters without normalizing input.
The inferred type is `string`, not a brand, so use the decoder for runtime validation.

### `decodeUserDefinedId(value: unknown): UserDefinedId`

Validates synchronously and returns the unchanged string.
Throws a schema error for invalid input.

### `UUIDv4`

An Effect string schema checked with `Schema.isUUID(4)`.

### `makePrefixedUUIDv4(prefix: UserDefinedId)`

Validates the prefix synchronously and appends one underscore, including when the prefix already ends in an underscore.
Returns:

- `schema`: A template-literal schema for the fixed prefix followed by a UUIDv4.
- `make`: A reusable effect generating one validated identifier per execution. Requires the caller's `SecureRandom.SecureRandom` service and retrieves that service each time it runs.

The library does not provide a randomness layer or select a runtime.
Effect 4.1.4 exposes this service as `SecureRandom` from `effect/crypto`.
Unexpected generated values that fail schema validation become defects rather than typed failures.

```ts
import { makePrefixedUUIDv4 } from '@totto2727/effect-identify'
import { Effect } from 'effect'
import { SecureRandom } from 'effect/crypto'

const jobId = makePrefixedUUIDv4('job')
const program = jobId.make.pipe(Effect.provide(SecureRandom.layerWebCrypto))
const first = await Effect.runPromise(program)
const second = await Effect.runPromise(program)
```

### `type PrefixedUUIDv4`

The output type derived from the factory's `schema`.
It is currently inferred as `string`, not a brand or a compile-time guarantee of a particular prefix or UUID version.
Use the returned schema to validate external identifiers for a specific prefix.

## Development

See [AGENTS.md](./AGENTS.md) for maintenance instructions.

## License

MIT

_This README was generated from the [share-artifact skill](https://raw.githubusercontent.com/totto2727-org/agent/refs/heads/main/plugins/totto2727-coding/skills/share-artifact/SKILL.md) and [README template](https://raw.githubusercontent.com/totto2727-org/agent/refs/heads/main/plugins/totto2727-coding/skills/share-artifact/readme/template.md)._
