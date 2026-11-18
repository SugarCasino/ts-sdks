// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { readFile } from 'node:fs/promises';
import { RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';

export const SUGAR_MCP_APP_RESOURCE_URI = 'ui://sugar/transaction-inspector.html';

export const NFT_IMAGE_RESOURCE_DOMAINS = [
	'https://sugar-mainnet-nft.s3.eu-west-1.amazonaws.com',
] as const;

type SugarMcpAppResourceMeta = {
	ui: {
		csp: {
			connectDomains: Array<string>;
			resourceDomains: Array<(typeof NFT_IMAGE_RESOURCE_DOMAINS)[number]>;
		};
		prefersBorder: boolean;
	};
};

export function createSugarMcpAppResourceMeta(): SugarMcpAppResourceMeta {
	return {
		ui: {
			csp: {
				connectDomains: [],
				resourceDomains: [...NFT_IMAGE_RESOURCE_DOMAINS],
			},
			prefersBorder: true,
		},
	};
}

function hasErrorCode({ error, code }: { error: unknown; code: string }): boolean {
	return error instanceof Error && 'code' in error && (error as { code: unknown }).code === code;
}

async function readSugarMcpAppHtml(): Promise<string> {
	try {
		return await readFile(new URL('../../dist/app/index.html', import.meta.url), 'utf8');
	} catch (error) {
		if (!hasErrorCode({ error, code: 'ENOENT' })) {
			throw error;
		}
		throw new Error('Unable to find bundled Sugar MCP App HTML.', {
			cause: error,
		});
	}
}

export async function createSugarMcpAppResourceResult(): Promise<{
	contents: Array<{
		uri: string;
		mimeType: string;
		text: string;
		_meta: SugarMcpAppResourceMeta;
	}>;
}> {
	return {
		contents: [
			{
				uri: SUGAR_MCP_APP_RESOURCE_URI,
				mimeType: RESOURCE_MIME_TYPE,
				text: await readSugarMcpAppHtml(),
				_meta: createSugarMcpAppResourceMeta(),
			},
		],
	};
}
