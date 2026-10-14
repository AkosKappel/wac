import { createStore } from '@stencil/store';

export type Language = 'sk' | 'en';
export type Theme = 'system' | 'light' | 'dark';

const LANGUAGES: Language[] = ['sk', 'en'];
const THEMES: Theme[] = ['system', 'light', 'dark'];

// storage can be blocked (private mode, cookies off); the settings then last for the visit
function load<T extends string>(key: string, allowed: T[]): T | undefined {
  try {
    const value = localStorage.getItem(key) as T;
    return allowed.includes(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // keep the setting in memory only
  }
}

/** Slovak for visitors whose browser prefers Slovak or Czech, English for everyone else. */
export function preferredLanguage(browserLanguages: readonly string[]): Language {
  return browserLanguages.some(l => /^(sk|cs)\b/i.test(l)) ? 'sk' : 'en';
}

const darkQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : undefined;

export const settings = createStore({
  language: load('language', LANGUAGES) ?? preferredLanguage(navigator.languages ?? [navigator.language ?? '']),
  theme: load('theme', THEMES) ?? ('system' as Theme),
  systemDark: darkQuery?.matches ?? false,
});

darkQuery?.addEventListener?.('change', ev => (settings.state.systemDark = ev.matches));

/** The theme actually shown: the chosen one, or the system's for "system". */
export function activeTheme(): 'light' | 'dark' {
  const { theme, systemDark } = settings.state;
  return theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
}

function applyToDocument() {
  document.documentElement.lang = settings.state.language;
  // native controls and scrollbars follow the theme
  document.documentElement.style.colorScheme = activeTheme();
}

applyToDocument();
settings.onChange('language', language => {
  save('language', language);
  applyToDocument();
});
settings.onChange('theme', theme => {
  save('theme', theme);
  applyToDocument();
});
settings.onChange('systemDark', applyToDocument);

export function nextTheme(theme: Theme): Theme {
  return THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
}
