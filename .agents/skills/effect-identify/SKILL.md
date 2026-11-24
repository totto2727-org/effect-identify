---
name: effect-identify
description: Choose or validate an identifier schema and generate prefixed UUIDv4 values with @totto2727/effect-identify.
---

# Effect identifiers

Choose the schema from the existing wire contract: `UserDefinedId` checks the allowed characters and length, `UUIDv4` checks an unprefixed UUID, and `makePrefixedUUIDv4(prefix).schema` rejects IDs for another prefix. Do not use `UserDefinedId` alone to verify that an ID belongs to a particular resource kind.

Validation needs no randomness. Only run the factory's `make` effect when allocating a new ID; provide `SecureRandom` at the application boundary, not in a decoder. See the [public API and consumer examples](https://github.com/totto2727-org/effect-identify/blob/main/README.md#api).
