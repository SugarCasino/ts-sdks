# @sugarcasino/mcp

## 0.0.1-beta.0

### Patch Changes

- [#5](https://github.com/SugarCasino/ts-sdks/pull/5) [`a03386f`](https://github.com/SugarCasino/ts-sdks/commit/a03386f61f9aa4821cd8c4e3cb0166aa03206b11) - Decode supported binary simulation events once when preparing dry-run summaries.

- [#3](https://github.com/SugarCasino/ts-sdks/pull/3) [`514628b`](https://github.com/SugarCasino/ts-sdks/commit/514628bb3fe99d53d2ea61e137133d6756076d1b) - Publish the SDK, MCP server, and Suifrens display library under the `@sugarcasino` npm scope. Update installations and imports to `@sugarcasino/sdk`, `@sugarcasino/mcp`, and `@sugarcasino/suifrens-display-system`, including their existing subpaths.

- [#2](https://github.com/SugarCasino/ts-sdks/pull/2) [`4cf7ebd`](https://github.com/SugarCasino/ts-sdks/commit/4cf7ebd680f475c36f11b0a5ae129d7b39e8a8f0) - Validate saved session-wallet metadata and browser callback payloads before using them, ignoring malformed wallet entries. Keep tool schemas and handler types aligned, and validate network and coin-side inputs against the SDK's supported choices. Invalid coin-side errors identify the field and its allowed values.

  Handle rejected local HTTP request handlers without unhandled promises. Use nullish checks for absent inputs while preserving JSON null values and promise rejection behavior in tools.

- Updated dependencies [[`4cf7ebd`](https://github.com/SugarCasino/ts-sdks/commit/4cf7ebd680f475c36f11b0a5ae129d7b39e8a8f0), [`514628b`](https://github.com/SugarCasino/ts-sdks/commit/514628bb3fe99d53d2ea61e137133d6756076d1b), [`a03386f`](https://github.com/SugarCasino/ts-sdks/commit/a03386f61f9aa4821cd8c4e3cb0166aa03206b11)]:
  - @sugarcasino/sdk@0.1.0-beta.0
