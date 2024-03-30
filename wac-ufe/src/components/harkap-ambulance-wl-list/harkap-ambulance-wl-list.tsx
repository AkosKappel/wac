import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { AmbulanceWaitingListApiFactory, WaitingListEntry } from '../../api/ambulance-wl';

@Component({
  tag: 'harkap-ambulance-wl-list',
  styleUrl: 'harkap-ambulance-wl-list.css',
  shadow: true,
})
export class HarkapAmbulanceWlList {
  @Event({ eventName: "entry-clicked" }) entryClicked: EventEmitter<string>;
  @Prop() apiBase: string;
  @Prop() ambulanceId: string;
  @State() errorMessage: string;

  waitingPatients: any[];

  private async getWaitingPatientsAsync(){
    try {
       const response = await
         AmbulanceWaitingListApiFactory(undefined, this.apiBase).
           getWaitingListEntries(this.ambulanceId)
       if (response.status < 299) {
         return response.data;
       } else {
         this.errorMessage = `Cannot retrieve list of waiting patients: ${response.statusText}`
       }
     } catch (err: any) {
       this.errorMessage = `Cannot retrieve list of waiting patients: ${err.message || "unknown"}`
     }
     return [];
  }

  async componentWillLoad() {
    this.waitingPatients = await this.getWaitingPatientsAsync();
  }

  render() {
    return (
      <Host>
        {this.errorMessage
          ? <div class="error">{this.errorMessage}</div>
          :
          <div>
            <h1>
              Nemocnica HarKap - Zoznam zdravotníckeho vybavenia
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
          </div>
        }
      </Host>
    );
  }

  // private isoDateToLocale(iso:string) {
  //   if(!iso) return '';
  //   return new Date(Date.parse(iso)).toLocaleTimeString()
  // }
}
