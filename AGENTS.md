# @totto2727/effect-identify

## Repository structure

```text
src/identifiers.ts  Identifier schemas and prefixed UUIDv4 factory, all public exports
src/index.test.ts   Public-entry-point tests with externally provided secure randomness
vite.config.ts      Vite+ formatter, linter, tests, packaging, and tasks
package.json        Package identity and runtime/type export map
pnpm-lock.yaml            Sole dependency lock for pnpm
pnpm-workspace.yaml         pnpm installation policy and 24-hour release-age requirement
flake.nix           Development shells only
.github/workflows/  CI and main-push npm publication
```

## Development commands

### Execution rules

- Bootstrap Node.js 24, the pnpm version in `packageManager`, and Vite+ on `PATH` before running `nix develop` from the repository root.
- Use Vite+ for both formatting and linting, source type checks, tests, and library packaging.
- Keep formatter and linter exclusions synchronized with `.gitignore` through `@totto2727/gitignore-patterns` in `vite.config.ts` instead of adding duplicate ignore lists.
- Keep temporary consumers and package archives under ignored `tmp/` and out of commits.
- Keep `AGENTS.md` canonical without creating `CLAUDE.md`.

### Standard tasks

- `nix develop`: Enter the pinned nixfmt environment and run `vp config` using the externally available Vite+ CLI.
- `vp install --frozen-lockfile`: Install locked development dependencies.
- `vp run fix`: Apply Vite+ formatting and supported lint fixes with `vp check --fix`.
- `vp run check`: Verify formatting, lint rules, and inherited strictest source types through the cached `vp check` task.
- `vp run test`: Run tests through Vite+ once with task caching.
- `vp run build`: Build the ESM library and TypeScript declarations with `vp pack`, restoring `dist/**` on cache hits.
- `vp run ci`: Run check, test, and build in parallel.
- `vp pm pack -- --dry-run`: Inspect package contents after `vp pack` without publishing.
- `vp pm pack --pack-destination tmp`: Create a real consumer archive after creating `tmp/` and running `vp pack`.
- `actionlint .github/workflows/ci.yml .github/workflows/publish.yml`: Validate both workflow definitions without running publication. Supply actionlint separately when needed.

## Architecture

### CI and publication policy

- Keep the inherited CI and publication workflows unchanged by default.
- Publication runs on pushes to `main`, including merges. Do not add tag or release triggers.
- Change workflows only for an explicit user request or a demonstrated project requirement, and explain why the change is necessary.
- Publication setup does not justify unrelated CI changes.

### Public library boundary

- Keep public exports limited to `UserDefinedId`, `UUIDv4`, `makePrefixedUUIDv4`, and the schema-derived `PrefixedUUIDv4` type.
- Keep the prefix decoder internal. The standalone `UUIDv4` schema is public for validating unprefixed identifiers.
- Validate prefixes synchronously, before constructing effects.
- Keep secure randomness as an explicit injected service requirement on `make`. Do not provide a layer, select a runtime, or read global randomness inside the library. Consumers provide the service at their composition root.
- Return only `{ schema, make }`. The reusable `make` effect retrieves the caller's secure randomness service on each execution.
- Do not introduce a central identifier registry or application migrations.

- Export the consumer API from `src/identifiers.ts` and test that public entry point.
- Keep `package.json` export conditions aligned with `dist/index.js` and `dist/index.d.ts`, with `types` before `import`.
- This package is ESM-only. Do not imply CommonJS support without adding and validating that output.
- `vp check` checks source types, but does not prove declarations reach consumers. For export changes, install a real npm archive into an isolated consumer under `tmp/`, compile imports by package name with strict NodeNext resolution, check rejected invalid calls, and execute the built exports.

## Development tools

- **Vite+**: Both formatter and linter use the configuration in `vite.config.ts` through `vp check`. Tests use `vite-plus/test`. `vp pack` delegates library builds and declaration generation to tsdown. `vp build` invokes Vite production builds and does not natively emit declarations, so the cache-aware `build` task invokes `vp pack` without a declaration plugin.
- **Task caching**: Vite+ configuration tasks, including `fix`, cache by default. The `ci` dependency graph allows check, test, and build to run concurrently. Build inputs use automatic tracking except `dist/**`. Explicit `cache: { output: ["dist/**"] }` restores JavaScript and declarations on cache hits. Vite+ automatically declines to cache a `fix` run that reads and rewrites the same input, while unchanged runs can hit cache. Keep `dist/` ignored by the formatter and linter.
- **TypeScript**: `tsconfig.json` extends the caret-versioned presets `@tsconfig/strictest`, then `@tsconfig/node-ts`. It retains strictness including `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`, and inherits import-extension rewriting, erasable syntax, and verbatim module syntax. Rewriting enables TypeScript import extensions without a duplicate local flag. Local options are only ESNext, NodeNext, no-emit source checks, and Node types. NodeNext module resolution is inferred from the module setting. TypeScript discovers root and `src/` files without including built declarations or scratch consumers. Vite+ discovers tests under `src/` using its default test patterns.
- **Nix flakes**: Pin the development shell only. This library's default shell supplies only nixfmt and runs the externally available `vp config` to enable Git hooks. The `ci` shell supplies the same tools with an empty shell hook. Bootstrap Node.js 24, pnpm, and Vite+ externally before entering the shell. CI uses the shared TypeScript setup for these tools. Preserve the nixfmt-only shell. This library does not require a native application build or export a package/CLI overlay. Leave unrelated Bun CLIs unmanaged. pnpm installs dependencies, creates package archives, and supports the shared npm publication action.
- **GitHub Actions**: CI runs `setup-nix@main` with `dev-shell: ci`, then `setup-typescript@main`. The shared TypeScript setup selects pnpm through `packageManager`, and verification loads the hook-free environment with `eval "$(nix print-dev-env "$GITHUB_WORKSPACE#ci")"` and runs `vp run ci`. All tasks retain their default caching. Keep shared `totto2727-org/monorepo` actions on `@main`.

## Package-specific rules

- Keep all existing formatter defaults, including no semicolons, single quotes, print width 120, and preserved Markdown wrapping.
- Keep `files: ["dist"]` aligned with generated outputs. Use pnpm as the only package manager and update `pnpm-lock.yaml` with `vp install` when dependencies change. Keep the external pnpm toolchain aligned with `packageManager`. Update `flake.lock` only when Nix inputs change.
- Keep `pnpm-workspace.yaml`'s `minimumReleaseAge: 1440` and `minimumReleaseAgeStrict: true` for all new dependency resolutions, without exclusions. Keep the exact Vite+ 1.1.0 catalog entry and official `vite@*` alias and bundled `vitest@*` 5.0.3 overrides there. Preserve the other dependencies' caret ranges and review dependency lifecycle scripts before allowing them. When updating Vite+, match the alias to the installed `vite-plus` version and the `vitest` override to `vp toolchain vitest`. See [pnpm dependency policy](https://pnpm.io/settings#minimumreleaseage).
- Do not introduce `package.nix`, Nix package or CLI overlay outputs, CLI installation routes, or Nix build CI.
- Keep README usage consumer-focused, document all public exports, and use only supported dependency installation paths. Write registry setup for the configured package name, assuming publication.
- Publication CI is explicitly enabled in `publish.yml`, and the manifest is publishable. Before merging publication changes to `main`, require the owner's confirmation of npm trusted publishing for `totto2727-org/effect-identify` and workflow filename `publish.yml`. If an initial package publication is required to create registry settings, the owner must perform it manually. Prefer staging-only publisher permissions when available. The shared publisher stages versions; the owner reviews and approves them with 2FA before live publication. Never stage or approve merely to test CI. Match any configured environment with a protected workflow job environment. No environment is currently configured.
- Protect `main` and merge validated changes to trigger publication. Tag pushes, pull requests, GitHub releases, and manual dispatch do not publish. Never merge or publish merely to test CI.
- Use the hook-free Nix `ci` shell for setup, building, and publication so setup does not call `vp config` before Vite+ is installed.
- Before merging to `main`, review package metadata, third-party action pins, branch protection, and a real packed consumer.
- Retain job-scoped `id-token: write` and a GitHub-hosted runner. Do not add long-lived registry tokens. The publish workflow installs locked dependencies, runs `vp pack`, then calls `publish-npm@main` with the required `working-directory: .`. It must not duplicate pre-merge checks, tests, or dry runs.
- The shared publish action uses `vp pm stage publish -r --provenance` and filters private packages and versions already present on the registry. Use a new version for changed contents. Enabling CI does not authorize or perform a release. Never add registry tokens or publish as part of a coding task without authorization.

## Task-specific documentation

- When changing task dependencies or cache inputs/outputs: [Vite+ run configuration](https://viteplus.dev/config/run) and [automatic tracking](https://viteplus.dev/guide/automatic-data-tracking).
- When changing library packaging or declarations: [Vite+ pack guide](https://viteplus.dev/guide/pack).
- When comparing Vite production builds with library packaging: [Vite+ build guide](https://viteplus.dev/guide/build).
- When enabling registry publication: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) and [shared publish-npm action](https://github.com/totto2727-org/monorepo/blob/main/.github/actions/publish-npm/action.yaml).

_This AGENTS.md was generated from the [share-artifact skill](https://raw.githubusercontent.com/totto2727-org/agent/refs/heads/main/plugins/totto2727-coding/skills/share-artifact/SKILL.md) and [AGENTS template](https://raw.githubusercontent.com/totto2727-org/agent/refs/heads/main/plugins/totto2727-coding/skills/share-artifact/agents/template.md)._
