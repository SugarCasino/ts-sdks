# @sugarcasino/sdk

## 0.1.0-beta.0

### Minor Changes

- [#2](https://github.com/SugarCasino/ts-sdks/pull/2) [`4cf7ebd`](https://github.com/SugarCasino/ts-sdks/commit/4cf7ebd680f475c36f11b0a5ae129d7b39e8a8f0) - Export `SUGAR_COINS` from `@sugarcasino/sdk` and `COIN_SIDES` and `PVP_COINFLIP_ACTIONS` from `@sugarcasino/sdk/games`. Derive `SugarCoin`, `CoinSide`, and `PvPCoinflipAction` from these readonly lists so validation and iteration use the same choices as the types.

  Represent game details for a union of games as a union of their detail shapes. Accept minimal event envelopes in the event parsers and reject unsupported game identifiers before decoding.

  Treat null and undefined object contents as missing. Preserve null-prototype registries and promise rejection behavior when validating optional inputs.

### Patch Changes

- [#3](https://github.com/SugarCasino/ts-sdks/pull/3) [`514628b`](https://github.com/SugarCasino/ts-sdks/commit/514628bb3fe99d53d2ea61e137133d6756076d1b) - Publish the SDK, MCP server, and Suifrens display library under the `@sugarcasino` npm scope. Update installations and imports to `@sugarcasino/sdk`, `@sugarcasino/mcp`, and `@sugarcasino/suifrens-display-system`, including their existing subpaths.

- [#5](https://github.com/SugarCasino/ts-sdks/pull/5) [`a03386f`](https://github.com/SugarCasino/ts-sdks/commit/a03386f61f9aa4821cd8c4e3cb0166aa03206b11) - Keep refreshed game parameters cached when an earlier concurrent read resolves or rejects.
