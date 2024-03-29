import { Component, Event, EventEmitter, Host, h } from '@stencil/core';

@Component({
  tag: 'harkap-ambulance-wl-list',
  styleUrl: 'harkap-ambulance-wl-list.css',
  shadow: true,
})
export class HarkapAmbulanceWlList {
   @Event({ eventName: "entry-clicked"}) entryClicked: EventEmitter<string>;

  waitingPatients: any[];

  private async getWaitingPatientsAsync(){
    return await Promise.resolve(
      [{
          name: 'Magnetická rezonancia',
          section: 'Chirurgia',
          since: new Date(Date.now() - 10 * 60).toISOString(),
          estimatedStart: new Date(Date.now() + 65 * 60).toISOString(),
          estimatedDurationMinutes: 15,
          condition: 'Kontrola'
      }, {
          name: 'Röntgen',
          section: 'Detské',
          since: new Date(Date.now() - 30 * 60).toISOString(),
          estimatedStart: new Date(Date.now() + 30 * 60).toISOString(),
          estimatedDurationMinutes: 20,
          condition: 'Teploty'
      }, {
          name: 'CRP prístroj 1',
          section: 'Chirurgia',
          since: new Date(Date.now() - 72 * 60).toISOString(),
          estimatedStart: new Date(Date.now() + 5 * 60).toISOString(),
          estimatedDurationMinutes: 15,
          condition: 'Bolesti hrdla'
      }]
    );
  }

  async componentWillLoad() {
    this.waitingPatients = await this.getWaitingPatientsAsync();
  }

  render() {
    return (
      <Host>
        <h1>
          Nemocnica HarKap - zoznam zdravotníckeho vybavenia
        </h1>
        <md-list class="list">
          {this.waitingPatients.map((patient, index) =>
            <md-list-item class="list-item" onClick={ () => this.entryClicked.emit(index.toString())}>
              <div slot="headline">{patient.name}</div>
              <div slot="supporting-text">{"Oddelenie: " + patient.section}</div>
                <md-icon slot="start">devices</md-icon>
            </md-list-item>
          )}
        </md-list>
      </Host>
    );
  }

  // private isoDateToLocale(iso:string) {
  //   if(!iso) return '';
  //   return new Date(Date.parse(iso)).toLocaleTimeString()
  // }
}
