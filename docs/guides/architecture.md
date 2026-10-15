---
title: Architecture and generated data
section: explanation
order: 10
description: Keep country isolation, authoritative writers and checks together.
---

## Follow the data boundaries

The root parser and utilities use shared types and the existing US/Canadian/Japanese data. AU, GB, FR and DE are separate optional country entries supplied through `countries`. The form-field entry bundles all built-in countries for its browser control; importing a country module does not import that control. The registration entry has the intentional browser registration side effect. Both native field entries remain safe to import on a server.

## Generate tables from their source

`*.data.ts` files belong to the JP and country data writers. Documentation examples come from those writers too. Their `--docs-only` path refreshes stored public example comments offline, retaining source dates, data values and ordering. Normal data generation still follows the documented sources/licences and requires its own data review.

## Keep both documentation checks

The shared site strictly typechecks real package imports and runs examples, showing their output. The native checker still compares every original expected-answer comment and verifies that comments/examples reach published declarations. Its evaluator recognizes imported bindings and the final logged value; existing expected answers are retained. Country isolation, schemas, `tsd`, installed ESM/CommonJS packages and real browser behavior remain separate gates. Read the original [source conventions](../../AGENTS.md), [country design](../COUNTRIES.md), [test coverage](../TEST_COVERAGE.md) and [test schemas](../test-schema.md).
