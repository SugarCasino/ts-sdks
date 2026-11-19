// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

export const WHITESPACE_PATTERN: RegExp = /\s+/gu;
export const BETWEEN_TAGS_WHITESPACE_PATTERN: RegExp = />\s+</gu;
export const SVG_WRAPPER_PATTERN: RegExp = /^<svg[^>]*>|<\/svg>$/gu;

export const HEX_COLOR_PATTERN: RegExp = /^#[0-9a-f]{6}$/iu;
export const TEAM_CODE_PATTERN: RegExp = /^[A-Z0-9]{1,4}$/u;
export const SVG_ATTRIBUTE_PATTERN: RegExp = / ([\w:-]+)="([^"]*)"/gu;
export const TEMPLATE_VARIABLE_PATTERN: RegExp = /\{\{(\w+)\}\}/gu;
export const PATTERN_SLOT_PATTERN: RegExp = /<g data-pattern-slot="(\w+)">\s*<\/g>/gu;
export const UNSAFE_ID_CHARACTER_PATTERN: RegExp = /[^\w-]/gu;
