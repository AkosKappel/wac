import { t } from './i18n';

export function format(first: string, middle: string, last: string): string {
  return (first || '') + (middle ? ` ${middle}` : '') + (last ? ` ${last}` : '');
}

/** The page a path belongs to: a log entry opens inside its device's page. */
export function pageKey(path: string): string {
  return path.replace(/\/log\/.*$/, '');
}

/** Reports the current path relative to basePath now and on every navigation. Returns an unsubscribe function. */
export function watchRelativePath(basePath: string, onChange: (relativePath: string) => void): () => void {
  const baseUri = new URL(basePath, document.baseURI || '/').pathname;
  const report = (path: string) => onChange(path.startsWith(baseUri) ? path.slice(baseUri.length) : '');
  const listener = (ev: any) => {
    const path = new URL(ev.destination.url).pathname;
    // the API and its docs page are served by nginx, downloads are not page changes,
    // and a reload (the error page's retry button) must really load the page again
    if (!ev.canIntercept || ev.downloadRequest || ev.navigationType === 'reload' || /^\/api(-docs)?(\/|$)/.test(path)) {
      return;
    }
    // A new page starts at the top (back and forward restore the old position); filters only
    // change the query and a log entry opens inside the device page, so those keep the scroll.
    ev.intercept({ scroll: pageKey(path) === pageKey(location.pathname) ? 'manual' : 'after-transition' });
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

/**
 * Navigates to a path relative to basePath. Browsers without the Navigation API
 * (Baseline only since 2026, e.g. Safari before 26.2) load the page normally.
 */
export function navigateTo(basePath: string, path: string) {
  if (window.navigation) {
    window.navigation.navigate(hrefTo(basePath, path));
  } else {
    location.assign(hrefTo(basePath, path));
  }
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
