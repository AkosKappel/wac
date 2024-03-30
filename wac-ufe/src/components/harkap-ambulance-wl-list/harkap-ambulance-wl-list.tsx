import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
// import { AmbulanceWaitingListApiFactory, WaitingListEntry } from '../../api/ambulance-wl';

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

  // private async getWaitingPatientsAsync(){
  //   try {
  //      const response = await
  //        AmbulanceWaitingListApiFactory(undefined, this.apiBase).
  //          getWaitingListEntries(this.ambulanceId)
  //      if (response.status < 299) {
  //        return response.data;
  //      } else {
  //        this.errorMessage = `Cannot retrieve list of waiting patients: ${response.statusText}`
  //      }
  //    } catch (err: any) {
  //      this.errorMessage = `Cannot retrieve list of waiting patients: ${err.message || "unknown"}`
  //    }
  //    return [];
  // }

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
          section: 'Radiológia',
          since: new Date(Date.now() - 30 * 60).toISOString(),
          estimatedStart: new Date(Date.now() + 30 * 60).toISOString(),
          estimatedDurationMinutes: 20,
          condition: 'Teploty'
      }, {
          name: 'CRP prístroj 1',
          section: 'Laboratórium',
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
        {this.errorMessage
          ? <div class="error">{this.errorMessage}</div>
          :
          <div class="container">
            <h1>
              Nemocnica HarKap - Zoznam zdravotníckeho vybavenia
            </h1>
            <md-elevated-button class="add-button" onclick={() => this.entryClicked.emit("@new")}>
              <span>Pridať nové zariadenie</span>
            </md-elevated-button>
            <md-list class="list">
              {this.waitingPatients.map((patient, index) =>
                <md-list-item class="list-item" onClick={ () => this.entryClicked.emit(index.toString())}>
                  <div slot="headline">{patient.name}</div>
                  <div slot="supporting-text">{"Oddelenie: " + patient.section}</div>
                  <md-icon slot="start">devices</md-icon>
                  <md-icon slot="end">chevron_right</md-icon>
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
