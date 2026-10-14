import { nextTheme, preferredLanguage } from './settings';

describe('preferredLanguage', () => {
  it('picks Slovak for Slovak and Czech browsers', () => {
    expect(preferredLanguage(['sk-SK', 'en'])).toEqual('sk');
    expect(preferredLanguage(['de', 'cs'])).toEqual('sk');
  });

  it('picks English for everyone else', () => {
    expect(preferredLanguage(['en-US'])).toEqual('en');
    expect(preferredLanguage(['skr'])).toEqual('en');
    expect(preferredLanguage([])).toEqual('en');
  });
});

describe('nextTheme', () => {
  it('cycles system, light, dark', () => {
    expect(nextTheme('system')).toEqual('light');
    expect(nextTheme('light')).toEqual('dark');
    expect(nextTheme('dark')).toEqual('system');
  });
});
