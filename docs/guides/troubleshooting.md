---
title: Troubleshooting and FAQ
section: troubleshooting
order: 11
description: Interpret missing results, country selection and form validity.
---

## Understand missing values

A parser can return null. Postal and municipality lookups may return null, undefined or an empty collection according to their reference; these mean no matching known result, not permission to guess a region. A batch keeps null at the failed index. A field’s `address` is null for empty/unparseable input; `validation` is null when empty or disabled. Optional parsed fields are absent until found. Narrow results before passing them to a formatter or country validator.

## Resolve country and type choices

AU/GB/FR/DE require their modules supplied to the root parser; a `country` string alone does not import tables. Read country-specific fields instead of casting every result to a US shape. `useSnakeCase` changes runtime keys while the existing static interface describes camel-case keys; the [parsing guide](parsing.md) shows explicit dynamic access. Preserve leading zeros and full-width normalization choices.

## Diagnose a form

Required empty fields are invalid; optional empty fields can be valid. Disabling checks still permits local parsing. A disabled field does not submit; an iframe cannot submit a field into its parent form. Use the native element in the form and read `checkValidity`/`reportValidity`. If text is not included in an event or setup URL, that is the documented private-value boundary; use trusted local getters/callbacks to access it. See [field details](form-field-and-embeds.md).
