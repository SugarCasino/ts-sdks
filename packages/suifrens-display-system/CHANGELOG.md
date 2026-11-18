# @sugarcasino/suifrens-display-system

## 0.0.1-beta.0

### Patch Changes

- [#3](https://github.com/SugarCasino/ts-sdks/pull/3) [`514628b`](https://github.com/SugarCasino/ts-sdks/commit/514628bb3fe99d53d2ea61e137133d6756076d1b) - Publish the SDK, MCP server, and Suifrens display library under the `@sugarcasino` npm scope. Update installations and imports to `@sugarcasino/sdk`, `@sugarcasino/mcp`, and `@sugarcasino/suifrens-display-system`, including their existing subpaths.

- [#2](https://github.com/SugarCasino/ts-sdks/pull/2) [`4cf7ebd`](https://github.com/SugarCasino/ts-sdks/commit/4cf7ebd680f475c36f11b0a5ae129d7b39e8a8f0) - Keep accessory animation registration and soccer kit resolution correctly typed, including SVG refs and custom kits. Treat null and undefined optional rendering inputs as absent, and reuse a stable empty accessory-slot map for both species. Public exports and accessory artwork are unchanged.

  Load deferred animation presets from their registered catalogue, sharing each catalogue load across requests and retrying failed loads independently.
