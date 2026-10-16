import { FunctionalComponent, h } from '@stencil/core';
import { t } from './i18n';

interface ErrorPageProps {
  status?: number; // HTTP status; undefined = network error
  message?: string;
  onBack?: () => void;
}

export const ErrorPage: FunctionalComponent<ErrorPageProps> = ({ status, message, onBack }) => {
  const notFound = status === 404;
  const m = t().errors;
  return (
    <div class="error-page" role="alert">
      <div class="error-code" aria-hidden="true">
        {notFound ? '404' : status >= 500 ? status : m.oops}
      </div>
      <md-icon class="error-icon" aria-hidden="true">
        {notFound ? 'search_off' : 'cloud_off'}
      </md-icon>
      <h1>{notFound ? m.notFoundTitle : status ? m.serverTitle : m.offlineTitle}</h1>
      <p class="hint">{notFound ? m.notFoundHint : status ? m.serverHint : m.offlineHint}</p>
      {message && <p class="error">{message}</p>}
      <div class="error-actions">
        {!notFound && (
          <md-outlined-button onClick={() => location.reload()}>
            <md-icon slot="icon">refresh</md-icon>
            {m.retry}
          </md-outlined-button>
        )}
        {onBack && (
          <md-filled-button onClick={onBack}>
            <md-icon slot="icon">arrow_back</md-icon>
            {m.backToList}
          </md-filled-button>
        )}
      </div>
    </div>
  );
};

/** Placeholder rows shown while a list is loading. */
export const SkeletonRows: FunctionalComponent<{ count?: number }> = ({ count = 3 }) =>
  Array.from({ length: count }, () => (
    <div class="skeleton-row" aria-hidden="true">
      <span class="skeleton"></span>
      <div class="skeleton-lines">
        <span class="skeleton"></span>
        <span class="skeleton"></span>
      </div>
    </div>
  ));
