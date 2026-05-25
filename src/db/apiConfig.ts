import { DEFAULT_API_BASE, DEFAULT_SERVER_URL, API_BASE_SETTING_KEY } from '../config';
import { getSetting } from './sqlite';

export async function getApiBaseUrl(): Promise<string> {
  const custom = await getSetting(API_BASE_SETTING_KEY);
  if (custom?.trim()) {
    return custom.trim().replace(/\/$/, '');
  }
  return DEFAULT_API_BASE;
}

export async function getServerUrl(): Promise<string> {
  const base = await getApiBaseUrl();
  return base.replace(/\/api\/?$/, '') || DEFAULT_SERVER_URL;
}
