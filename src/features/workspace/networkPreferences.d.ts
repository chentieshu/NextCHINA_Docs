import type { NetworkSettings } from './networkEngine.js';
export const SETTINGS_KEY: string;
export const DEFAULT_NETWORK_SETTINGS: Readonly<NetworkSettings>;
export function normalizeNetworkSettings(input: unknown, groupIds?: string[]): NetworkSettings;
export function readNetworkSettings(groupIds: string[]): NetworkSettings;
export function writeNetworkSettings(settings: NetworkSettings, groupIds: string[]): void;
