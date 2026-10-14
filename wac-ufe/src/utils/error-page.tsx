import { FunctionalComponent, h } from '@stencil/core';

interface ErrorPageProps {
  status?: number; // HTTP status; undefined = network error
  message?: string;
  onBack?: () => void;
}

export const ErrorPage: FunctionalComponent<ErrorPageProps> = ({ status, message, onBack }) => {
  const notFound = status === 404;
  return (
    <div class="error-page" role="alert">
      <div class="error-code">{notFound ? '404' : status >= 500 ? status : 'Ups'}</div>
      <md-icon class="error-icon">{notFound ? 'search_off' : 'cloud_off'}</md-icon>
      <h2>{notFound ? 'Stránka sa nenašla' : status ? 'Niečo sa pokazilo' : 'Server je nedostupný'}</h2>
      <p class="hint">
        {notFound
          ? 'Hľadaný záznam neexistuje alebo bol odstránený.'
          : status
            ? 'Na serveri nastala chyba. Skúste to prosím o chvíľu znova.'
            : 'Nepodarilo sa spojiť so serverom. Skontrolujte pripojenie a skúste to znova.'}
      </p>
      {message && <p class="error">{message}</p>}
      <div class="error-actions">
        {!notFound && (
          <md-outlined-button onClick={() => location.reload()}>
            <md-icon slot="icon">refresh</md-icon>
            Skúsiť znova
          </md-outlined-button>
        )}
        {onBack && (
          <md-filled-button onClick={onBack}>
            <md-icon slot="icon">arrow_back</md-icon>
            Späť na zoznam
          </md-filled-button>
        )}
      </div>
    </div>
  );
};
