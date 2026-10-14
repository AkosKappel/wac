import { t } from './i18n';

export function format(first: string, middle: string, last: string): string {
  return (first || '') + (middle ? ` ${middle}` : '') + (last ? ` ${last}` : '');
}

/** Reports the current path relative to basePath now and on every navigation. Returns an unsubscribe function. */
export function watchRelativePath(basePath: string, onChange: (relativePath: string) => void): () => void {
  const baseUri = new URL(basePath, document.baseURI || '/').pathname;
  const report = (path: string) => onChange(path.startsWith(baseUri) ? path.slice(baseUri.length) : '');
  const listener = (ev: any) => {
    const path = new URL(ev.destination.url).pathname;
    // the API and its docs page are served by nginx, downloads are not page changes
    if (!ev.canIntercept || ev.downloadRequest || /^\/api(-docs)?(\/|$)/.test(path)) {
      return;
    }
    ev.intercept();
    report(path);
  };
  window.navigation?.addEventListener('navigate', listener);
  report(location.pathname);
  return () => window.navigation?.removeEventListener('navigate', listener);
}

/** The absolute href of a path relative to basePath, for links. */
export function hrefTo(basePath: string, path: string): string {
  const url = new URL(path, new URL(basePath, document.baseURI));
  return url.pathname + url.search;
}

/** Navigates to a path relative to basePath. */
export function navigateTo(basePath: string, path: string) {
  window.navigation.navigate(hrefTo(basePath, path));
}

/** Converts an ISO timestamp to the local "YYYY-MM-DDTHH:mm" value used by datetime-local inputs. */
export function toLocalDateTimeInput(iso: string): string {
  const d = iso ? new Date(iso) : new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/** focusout handler: shows a field's validation error once the user leaves it, with a translated message for empty required fields. */
export function validateOnBlur(ev: FocusEvent) {
  const field = ev.target as any;
  if (!field.reportValidity) {
    return;
  }
  field.setCustomValidity('');
  if (field.validity?.valueMissing) {
    field.setCustomValidity(t().common.required);
  }
  field.reportValidity();
}

export type WarrantyStatus = 'ok' | 'expiring' | 'expired';

const EXPIRING_DAYS = 90;

/** Warranty state: expired, expiring within 90 days, or ok. */
export function warrantyStatus(warrantyUntil: string, now = new Date()): WarrantyStatus {
  const daysLeft = (new Date(warrantyUntil).getTime() - now.getTime()) / 86_400_000;
  return daysLeft < 0 ? 'expired' : daysLeft <= EXPIRING_DAYS ? 'expiring' : 'ok';
}
