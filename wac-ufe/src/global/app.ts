import '@material/web/list/list';
import '@material/web/list/list-item';
import '@material/web/icon/icon';
import '@material/web/textfield/outlined-text-field';
import '@material/web/select/outlined-select';
import '@material/web/select/select-option';
import '@material/web/button/filled-button';
import '@material/web/button/text-button';
import '@material/web/button/outlined-button';
import '@material/web/iconbutton/icon-button';
import '@material/web/dialog/dialog';

// Stencil runs this once on load; the imports above register the Material components.
// The service worker makes the app installable and usable offline; not on the dev server
// (ports 333x), where it would serve old builds.
export default function () {
  if ('serviceWorker' in navigator && !/^33[3-9][0-9]$/.test(location.port)) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.warn('service worker not registered', err));
  }
}
