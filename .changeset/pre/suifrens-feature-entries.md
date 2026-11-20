---
'@sugarcasino/suifrens-display-system': minor
---

Use the root SuiFrenImage for both species and replace `SuiFrenImageInline` from `/image-inline` with `SuiFrenImage` from `/embed`. Replace /types imports with the corresponding feature entry or the root for image props. The animation entry exposes preset lookup and duration helpers alongside animation types. Species renderers, their props and low-level animation controls are now internal.

Support `renderOptions.viewport` in both image renderers. VIP crowns use their catalogue framing unless an explicit viewport overrides it, including when a custom image URL is supplied.
