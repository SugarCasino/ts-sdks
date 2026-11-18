---
name: sugar-sdk
description: Integrate @sugar/sdk in TypeScript applications. Use for client setup, configuration, game transactions, event parsing, SweetHouse pools, NFTs, or referrals.
---

# @sugar/sdk

This package ships only a pointer to the full Sugar skills, which live on GitHub to keep the npm package small.

## Read the full skill

Fetch the full skill from `main`:

```
https://raw.githubusercontent.com/SugarCasino/agent-skills/main/skills/installation/SKILL.md
```

Read it completely before writing Sugar SDK integration code. Its links to `references/*.md` are relative to that URL, so fetch them from:

```
https://raw.githubusercontent.com/SugarCasino/agent-skills/main/skills/installation/references/<file>.md
```

Sugar agent skills are not versioned with the packages. Always use `main` for skills and references. Resolve links to other skills relative to the fetched document URL.

To browse the skill: https://github.com/SugarCasino/agent-skills/tree/main/skills/installation

## More

- Standard single-player game transactions: https://raw.githubusercontent.com/SugarCasino/agent-skills/main/skills/create-standard-games/SKILL.md
- PvP game flows: https://raw.githubusercontent.com/SugarCasino/agent-skills/main/skills/create-pvp-games/SKILL.md
- Event decoding and generated numeric values: https://raw.githubusercontent.com/SugarCasino/agent-skills/main/skills/event-parsing/SKILL.md
- Public pool deposits, redeem requests and delayed self-claims: https://raw.githubusercontent.com/SugarCasino/agent-skills/main/skills/sweethouse/SKILL.md
- NFT V1 catalog, ownership and minting: https://raw.githubusercontent.com/SugarCasino/agent-skills/main/skills/sugar-nft/SKILL.md
- Partner attribution and referral reward claims: https://raw.githubusercontent.com/SugarCasino/agent-skills/main/skills/referrals/SKILL.md
- Documentation: https://github.com/SugarCasino/ts-sdks/blob/main/packages/sdk/README.md
