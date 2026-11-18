// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { composePartTransform } from '../../../src/helpers/animation/compose-part-transform.js';
import type { AnimationPart, PartPose } from '../../../src/types/animation.type.js';
import { parseMatrix } from '../../../src/utils/matrix.js';

// Native capy and bullshark arms share these shoulder seams and mirrored bases.
test.each([
	['leftArm', 2.9166107177734375, 1002.9],
	['rightArm', -2.9166107177734375, 1880.95],
] as const)('%s keeps its shoulder fixed through the victory lift', (part, scaleX, originX) => {
	const local = { x: 76.45, y: 13.65 };
	const scaleY = 2.9166107177734375;
	const shoulder = { x: originX + scaleX * local.x, y: 1719.3 + scaleY * local.y };
	const base = `matrix(${scaleX},0,0,${scaleY},${originX},1719.3)`;
	for (const rotate of [-145, -135, -115, -24, 0, 24, 90, 120, 135, 140]) {
		const poses = new Map<AnimationPart, PartPose>([[part, { rotate }]]);
		const [a, b, c, d, e, f] = parseMatrix(composePartTransform(part, base, poses))!;
		expect(a * local.x + c * local.y + e).toBeCloseTo(shoulder.x, 3);
		expect(b * local.x + d * local.y + f).toBeCloseTo(shoulder.y, 3);
	}
});

test('the fin rotates around its attachment point while inheriting head movement', () => {
	const result = parseMatrix(
		composePartTransform(
			'fin',
			undefined,
			new Map([
				['fin', { rotate: 90 }],
				['head', { translate: { x: 3, y: 4 } }],
			]),
		),
	)!;
	// A rotation leaves its pivot fixed; head translation uses four SVG units per pose unit.
	expect(result[0] * 1008 + result[2] * 1486 + result[4]).toBeCloseTo(1020);
	expect(result[1] * 1008 + result[3] * 1486 + result[5]).toBeCloseTo(1502);
});

test('the bullshark tail swings around its root as the torso moves', () => {
	const scale = 2.9166107177734375;
	const base = `matrix(${scale},0,0,${scale},468.15,1761.65)`;
	const body = { rotate: 12, translate: { x: 6, y: -3 } };
	const root = { x: 240, y: 150 };
	const poses = new Map<AnimationPart, PartPose>([['body', body]]);
	const position = () => {
		const [a, b, c, d, e, f] = parseMatrix(composePartTransform('tail', base, poses))!;
		return { x: a * root.x + c * root.y + e, y: b * root.x + d * root.y + f };
	};
	const neutral = position();
	for (const rotate of [-10, -4, 3, 10]) {
		poses.set('tail', { rotate });
		expect(position().x).toBeCloseTo(neutral.x, 3);
		expect(position().y).toBeCloseTo(neutral.y, 3);
	}
});
