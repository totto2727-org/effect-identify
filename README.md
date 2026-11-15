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
Install with Vite+ when the package is available on npm:

```bash
vp add @totto2727/effect-identify effect@^4.1.4
```

Publication CI is enabled for pushes of `v*` tags only, not branch pushes, pull requests, GitHub releases, or manual dispatch.
Enabling CI does not publish this package or confirm npm authorization.
Before the first release tag, the owner must configure [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) for package `@totto2727/effect-identify`, GitHub owner `totto2727-org`, repository `effect-identify`, and workflow filename `publish.yml`.
Allow direct publishing, not staged-only publishing, because the shared action performs a provenance-enabled direct publish.
No GitHub environment is configured, so leave the trusted publisher environment unset unless a matching protected job environment is added.
If npm requires an initial publication before registry settings are available, the owner must perform that bootstrap manually.
After trusted publishing is confirmed, protect release tags and push a `v<version>` tag matching `package.json` from a validated commit, using a new version for changed contents.
The workflow installs locked dependencies, builds the archive, and invokes the shared publisher with job-scoped OIDC permissions on a GitHub-hosted runner, without registry tokens.
The hook-free Nix `ci` shell avoids calling `vp config` before the TypeScript setup installs Vite+.
GitHub repository visibility is managed separately in infra and does not authorize npm publication.

## API

### `UserDefinedId` and `type UserDefinedId`

An Effect string schema and its inferred type.
Accepts 1 to 128 ASCII letters, digits, underscores, or hyphens.
Rejects whitespace, control characters, path separators, and Unicode characters without normalizing input.
The inferred type is `string`, not a brand, so use `Schema.decodeUnknownSync(UserDefinedId)` to validate external input.
The prefix factory also validates its input synchronously.

### `UUIDv4`

An Effect string schema that validates unprefixed UUID version 4 values, including the UUID variant.
It is the same schema used as the UUID component of each prefixed identifier.
Validation does not generate an identifier or require a randomness service.

```ts
import { UUIDv4 } from '@totto2727/effect-identify'
import { Schema } from 'effect'

const uuid = Schema.decodeUnknownSync(UUIDv4)('123e4567-e89b-42d3-a456-426614174000')
```

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
