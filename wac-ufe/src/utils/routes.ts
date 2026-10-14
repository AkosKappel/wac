export type Page = 'home' | 'devices' | 'device' | 'about' | 'not-found';

/** Old links (/list, /entry/<id>) point to the device list and detail under /devices. */
export function currentPath(relativePath: string): string {
  return relativePath.replace(/^list\/?$/, 'devices').replace(/^entry\//, 'devices/');
}

export function pageOf(path: string): Page {
  const clean = path.replace(/\/$/, '');
  if (clean === '') return 'home';
  if (clean === 'devices') return 'devices';
  if (/^devices\/[^/]+(\/log\/[^/]+)?$/.test(clean)) return 'device';
  if (clean === 'about') return 'about';
  return 'not-found';
}
