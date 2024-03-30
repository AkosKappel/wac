import { Component, Host, State, h } from '@stencil/core';

@Component({
  tag: 'harkap-ambulance-log-list',
  styleUrl: 'harkap-ambulance-log-list.css',
  shadow: true,
})
export class HarkapAmbulanceLogList {
  @State() errorMessage: string;

  waitingPatients: any[];

  private async getWaitingPatientsAsync(){
    return await Promise.resolve(
      [{
          name: 'Použitie',
          section: 'Chirurgia',
          since: new Date(Date.now() - 10 * 60).toISOString(),
          estimatedStart: new Date(Date.now() + 65 * 60).toISOString(),
          estimatedDurationMinutes: 15,
          condition: 'Kontrola'
      }, {
          name: 'Operácia',
          section: 'Radiológia',
          since: new Date(Date.now() - 30 * 60).toISOString(),
          estimatedStart: new Date(Date.now() + 30 * 60).toISOString(),
          estimatedDurationMinutes: 20,
          condition: 'Teploty'
      }, {
          name: 'Vyšetrenie krvi',
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
            <md-list class="list">
              {this.waitingPatients.map((patient) =>
                <md-list-item class="list-item">
                  <div slot="headline">{patient.name}</div>
                  <div slot="supporting-text">{"Štart: " + patient.estimatedStart}</div>
                  <div slot="supporting-text">{"Trvanie: " + patient.estimatedDurationMinutes + " min"}</div>
                </md-list-item>
              )}
            </md-list>
          </div>
        }
      </Host>
    );
  }

}
