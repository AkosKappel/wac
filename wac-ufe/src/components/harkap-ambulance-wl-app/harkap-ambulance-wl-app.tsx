import { Component, Host, Prop, State, h } from '@stencil/core';
import { ErrorPage } from '../../utils/error-page';
import { navigateTo, watchRelativePath } from '../../utils/utils';

declare global {
  interface Window {
    navigation: any;
  }
}

@Component({
  tag: 'harkap-ambulance-wl-app',
  styleUrls: ['harkap-ambulance-wl-app.css', '../../utils/shared.css'],
  shadow: true,
})
export class HarkapAmbulanceWlApp {
  @State() private relativePath = '';
  @Prop() basePath: string = '';
  @Prop() apiBase: string;

  private unwatch: () => void;

  connectedCallback() {
    this.unwatch = watchRelativePath(this.basePath, path => (this.relativePath = path));
  }

  disconnectedCallback() {
    this.unwatch?.();
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

    const navigate = (path: string) => navigateTo(this.basePath, path);

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
