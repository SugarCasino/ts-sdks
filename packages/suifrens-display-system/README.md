# `@sugarcasino/suifrens-display-system`

React components for rendering and animating Suifrens capys and bullsharks with accessories and outfits.

The capy and bullshark renderers and their accessory artwork come from Mysten Labs' [SuiFrens Display System](https://github.com/MystenLabs/suifrens-display-system). Sugar adds gestures, animation playback, VIP crowns, and runner and football kits. Both the original project and Sugar's adaptation use the [Apache License 2.0](LICENSE).

## Installation

```bash
pnpm add @sugarcasino/suifrens-display-system
```

Use ESM imports and install React and React DOM `^18.2.0 || ^19.0.0` as peer dependencies.

## Quick start

Pass the character's appearance to `SuiFrenImage`. A capy has `earShape`; a bullshark has `finStyle`.

```tsx
import { SuiFrenImage } from '@sugarcasino/suifrens-display-system';
import type { CapyAttributes } from '@sugarcasino/suifrens-display-system/attributes';

const attributes = {
	mainColor: '6fbbee',
	secondaryColor: 'e6fbff',
	skin: 'basic',
	expression: 'happy',
	earShape: 'default',
} satisfies CapyAttributes;

export function CapyAvatar() {
	return <SuiFrenImage attributes={attributes} renderSize={240} shadow />;
}
```

Colors are lowercase palette keys without a leading `#`. For a bullshark, use `BullsharkAttributes` with `finStyle: 'classic'`. The color, skin and expression fields stay the same. Import `SuiFrenAppearance` from `/attributes` to share those fields between species.

## Rendering and animation

Both entry points export `SuiFrenImage`. Import it from the package root for cacheable external SVG accessories, or from `/embed` to embed catalogue artwork and VIP crowns in the SVG.

```tsx
import { SuiFrenImage } from '@sugarcasino/suifrens-display-system/embed';

<SuiFrenImage attributes={attributes} renderSize={240} />;
```

Both renderers accept the same props. Set `detail="head"` for a portrait and pass catalogue entries or custom `SuiFrenAccessory` objects through `accessories`. The `gesture` prop accepts `thumbs_up`, `thumbs_down` or `point`. Held objects take precedence over gestures, and gestures don't affect portraits.

For ordinary accessories, set `renderOptions.assetSrc` to replace the catalogue artwork. The embedded renderer uses that source directly, so use an SVG data URL when the export needs to stand alone.

Use `AnimationPresetName` from `/animation` to validate built-in preset names, for example `const preset = 'walk' satisfies AnimationPresetName`. It covers every registered catalogue. The renderer can play core presets immediately and loads each deferred catalogue the first time you use one of its presets. The synchronous helpers in `/animation` use the full catalogue.

Choose one animation source, `preset` or `sequence`:

```tsx
<SuiFrenImage
	attributes={attributes}
	renderSize={240}
	animation={{ preset: 'walk', playback: { iterations: 'infinite' } }}
/>
```

Enable `shadow` on the image to display its ground shadow. On an `AnimationSequence`, the optional `shadow` field controls its behavior:

| Sequence `shadow` | Behavior |
| --- | --- |
| `'static'` (default) | The shadow stays fixed. |
| `'falling'` | The shadow follows the rotating body, as in the three death presets. |
| `'airborne'` | The shadow stays on the ground and shrinks and fades as the body moves above its resting height (negative body translation on the y-axis). Used by `jump` and `walkJumpSit`. |

Omit `animation` or pass `null` for a static image. Animations play once at their original speed by default. Set `playState` to control playback and change `trigger` to restart it. Import `AnimationConfig` and `PlaybackOptions` from `/animation`.

## Public exports

Use `SuiFrenImage` for both species. Import `SuiFrenImageProps` from the root and feature types from their respective entries.

| Entry point | Exports |
| --- | --- |
| `@sugarcasino/suifrens-display-system` | External SVG image renderer and image props |
| `@sugarcasino/suifrens-display-system/embed` | `SuiFrenImage` for embedded SVG accessories |
| `@sugarcasino/suifrens-display-system/accessories` | Accessory catalogue, slot lookup and VIP crowns |
| `@sugarcasino/suifrens-display-system/animation` | Preset lookup, duration and animation types |
| `@sugarcasino/suifrens-display-system/battle` | Battle sprite, health bar and duel script hook |
| `@sugarcasino/suifrens-display-system/kits` | Runner and football outfit helpers |
| `@sugarcasino/suifrens-display-system/colors` | Color palette |
| `@sugarcasino/suifrens-display-system/attributes` | Ear gene mappings and skin values |
| `@sugarcasino/suifrens-display-system/expressions` | Shared expression lists |

## Documentation and agent skills

- [Changelog](CHANGELOG.md)
- [Rendering and accessories skill](https://github.com/SugarCasino/agent-skills/tree/main/skills/suifrens-display)
- [Animation and duels skill](https://raw.githubusercontent.com/SugarCasino/agent-skills/main/skills/suifrens-animation/SKILL.md)

The included [agent skill](skills/suifrens-display-system/SKILL.md) loads its instructions from the `main` branch of [SugarCasino/agent-skills](https://github.com/SugarCasino/agent-skills). To install the full skills, run `npx skills add SugarCasino/agent-skills`.

## Development

From the repository root, using the Node.js version in `.node-version`:

```bash
pnpm install
pnpm --dir packages/suifrens-display-system run build
pnpm --dir packages/suifrens-display-system run test
pnpm --dir packages/suifrens-display-system run typecheck
pnpm --dir packages/suifrens-display-system run lint
```
