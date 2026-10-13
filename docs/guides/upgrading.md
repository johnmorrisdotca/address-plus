---
title: Upgrading from parse-address
section: upgrading
order: 12
description: Adopt the docs site while keeping existing parser contracts.
---

## Keep the imports you use

The root named exports and default `parser` object remain available. The original country and field entries keep their native API. This rollout does not change version, parse rules, table values or country isolation. The new `api.html` is an anchor index leading to individual pages; `docs/api.md` remains the generated complete Markdown reference. Local search and root llms files add ways to read the same package.

## Preserve compatibility deliberately

Read the complete [parse-address migration guide](../MIGRATING_FROM_PARSE_ADDRESS.md) and [original migration note](../../README.md#migrating-from-parse-address). Add validation/formatting separately from parsing, preserve nullable results and choose country modules explicitly. Do not treat a formatting or similarity result as a delivery registry result. Dynamic snake-case keys need explicit access in typed code.

## Update generated references

`docs:make` retains the complete native reference and expected answers. `docs:check` runs the shared examples, and `docs:legacy-check` verifies those answers and declarations. Keep source comments, country data sources and the [changelog](../../CHANGELOG.md) in the same reviewed branch. Added Japanese guides and site wording need review before release.
