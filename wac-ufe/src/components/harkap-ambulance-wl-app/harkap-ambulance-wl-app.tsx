import { Component, Host, Prop, State, h } from '@stencil/core';
import { ErrorPage } from '../../utils/error-page';

declare global {
  interface Window {
    navigation: any;
  }
}

@Component({
  tag: 'harkap-ambulance-wl-app',
  styleUrls: ['harkap-ambulance-wl-app.css', '../../utils/error-page.css'],
  shadow: true,
})
export class HarkapAmbulanceWlApp {
  @State() private relativePath = '';
  @Prop() basePath: string = '';
  @Prop() apiBase: string;

  componentWillLoad() {
    const baseUri = new URL(this.basePath, document.baseURI || '/').pathname;

    const toRelative = (path: string) => {
      if (path.startsWith(baseUri)) {
        this.relativePath = path.slice(baseUri.length);
      } else {
        this.relativePath = '';
      }
    };

    window.navigation?.addEventListener('navigate', (ev: Event) => {
      if ((ev as any).canIntercept) {
        (ev as any).intercept();
      }
      let path = new URL((ev as any).destination.url).pathname;
      toRelative(path);
    });

    toRelative(location.pathname);
  }

  render() {
    let element = 'list';
    let entryId = '@new';

    if (this.relativePath.startsWith('entry/')) {
      element = 'editor';
      entryId = this.relativePath.split('/')[1];
    } else if (!['', 'list', 'list/'].includes(this.relativePath)) {
      element = 'not-found';
    }

    const navigate = (path: string) => {
      const absolute = new URL(path, new URL(this.basePath, document.baseURI)).pathname;
      window.navigation.navigate(absolute);
    };

    return (
      <Host>
        {element === 'not-found' ? (
          <ErrorPage status={404} onBack={() => navigate('./list')} />
        ) : element === 'editor' ? (
          <harkap-ambulance-wl-editor
            entry-id={entryId}
            base-path={this.basePath}
            api-base={this.apiBase}
            oneditor-closed={() => navigate('./list')}
          ></harkap-ambulance-wl-editor>
        ) : (
          <div>
            <harkap-ambulance-wl-list
              api-base={this.apiBase}
              onentry-clicked={(ev: CustomEvent<string>) => navigate('./entry/' + ev.detail)}
            ></harkap-ambulance-wl-list>
          </div>
        )}
      </Host>
    );
  }
}
