import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'harkap-ambulance-log-editor',
  styleUrl: 'harkap-ambulance-log-editor.css',
  shadow: true,
})
export class HarkapAmbulanceLogEditor {

  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }

}
