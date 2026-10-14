export function format(first: string, middle: string, last: string): string {
  return (first || '') + (middle ? ` ${middle}` : '') + (last ? ` ${last}` : '');
}

/** Reports the current path relative to basePath now and on every navigation. Returns an unsubscribe function. */
export function watchRelativePath(basePath: string, onChange: (relativePath: string) => void): () => void {
  const baseUri = new URL(basePath, document.baseURI || '/').pathname;
  const report = (path: string) => onChange(path.startsWith(baseUri) ? path.slice(baseUri.length) : '');
  const listener = (ev: any) => {
    if (ev.canIntercept) {
      ev.intercept();
    }
    report(new URL(ev.destination.url).pathname);
  };
  window.navigation?.addEventListener('navigate', listener);
  report(location.pathname);
  return () => window.navigation?.removeEventListener('navigate', listener);
}

/** Navigates to a path relative to basePath. */
export function navigateTo(basePath: string, path: string) {
  window.navigation.navigate(new URL(path, new URL(basePath, document.baseURI)).pathname);
}

/** Converts an ISO timestamp to the local "YYYY-MM-DDTHH:mm" value used by datetime-local inputs. */
export function toLocalDateTimeInput(iso: string): string {
  const d = iso ? new Date(iso) : new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/** focusout handler: shows a field's validation error once the user leaves it, with a Slovak message for empty required fields. */
export function validateOnBlur(ev: FocusEvent) {
  const field = ev.target as any;
  if (!field.reportValidity) {
    return;
  }
  field.setCustomValidity('');
  if (field.validity?.valueMissing) {
    field.setCustomValidity('Toto pole je povinné.');
  }
  field.reportValidity();
}
