import { AdminSettings, Ballot } from '../types';
import { cleanSpecialChars } from './csvHelper';

const STORAGE_KEY_ADMIN = 'skool_verkiesing_admin_settings_v1';
const STORAGE_KEY_BALLOTS = 'skool_verkiesing_ballots_v1';

function deepRepairObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return cleanSpecialChars(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => deepRepairObject(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const repaired: any = {};
    for (const key of Object.keys(obj)) {
      repaired[key] = deepRepairObject((obj as any)[key]);
    }
    return repaired as T;
  }
  return obj;
}

export const INITIAL_ADMIN_SETTINGS: AdminSettings = {
  adminPassword: 'OMAdmin123!',
  schoolLogoUrl: null,
  schoolName: '',
};

export const INITIAL_BALLOTS: Ballot[] = [];

export function getStoredAdminSettings(): AdminSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEY_ADMIN);
    if (data) {
      const parsed = JSON.parse(data);
      return deepRepairObject(parsed);
    }
  } catch (e) {
    console.error('Error reading admin settings from localStorage:', e);
  }
  return deepRepairObject(INITIAL_ADMIN_SETTINGS);
}

export function saveAdminSettings(settings: AdminSettings): void {
  try {
    const sanitized = deepRepairObject(settings);
    localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(sanitized));
  } catch (e) {
    console.error('Error saving admin settings:', e);
  }
}

export function getStoredBallots(): Ballot[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_BALLOTS);
    if (data) {
      const parsed = JSON.parse(data);
      return deepRepairObject(parsed);
    }
  } catch (e) {
    console.error('Error reading ballots from localStorage:', e);
  }
  return deepRepairObject(INITIAL_BALLOTS);
}

export function saveBallots(ballots: Ballot[]): void {
  try {
    const sanitized = deepRepairObject(ballots);
    localStorage.setItem(STORAGE_KEY_BALLOTS, JSON.stringify(sanitized));
  } catch (e) {
    console.error('Error saving ballots:', e);
  }
}

export function resetToDefaults(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_ADMIN);
    localStorage.removeItem(STORAGE_KEY_BALLOTS);
  } catch (e) {
    console.error('Error resetting storage:', e);
  }
}
