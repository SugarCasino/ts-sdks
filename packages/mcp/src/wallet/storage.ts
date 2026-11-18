// Copyright (c) Sugar
// SPDX-License-Identifier: Apache-2.0

import { chmod, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const SUGAR_MCP_DATA_DIRECTORY: string = join(homedir(), '.sugar-mcp');

export async function ensureSugarMcpDataDirectory(): Promise<string> {
	await mkdir(SUGAR_MCP_DATA_DIRECTORY, { recursive: true, mode: 0o700 });
	await chmod(SUGAR_MCP_DATA_DIRECTORY, 0o700);
	return SUGAR_MCP_DATA_DIRECTORY;
}
