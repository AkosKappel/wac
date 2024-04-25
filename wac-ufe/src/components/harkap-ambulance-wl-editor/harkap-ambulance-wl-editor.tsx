import { Component, Host, Prop, State, h, EventEmitter, Event } from '@stencil/core';
import { AmbulanceDeviceListApiFactory, DeviceListEntry } from '../../api/ambulance-wl';

@Component({
  tag: 'harkap-ambulance-wl-editor',
  styleUrl: 'harkap-ambulance-wl-editor.css',
  shadow: true,
})
export class HarkapAmbulanceWlEditor {
  @State() private relativePath = "";
  @Prop() entryId: string;
  @Prop() basePath: string = "";
  @Prop() apiBase: string;
  @State() entry: DeviceListEntry;
   @State() errorMessage:string;
   @State() isValid: boolean;

  private formElement: HTMLFormElement;

  private async getDeviceEntryAsync(): Promise<DeviceListEntry> {
    if(this.entryId === "@new") {
         this.isValid = false;
         this.entry = {
           id: "@new",
           name: "",
           deviceId: "",
           warrantyUntil: "",
           department: { name: "" },
           price: 0,
         };
         return this.entry;
    }

      if (!this.entryId ) {
         this.isValid = false;
         return undefined
      }
      try {
         const response
             = await AmbulanceDeviceListApiFactory(undefined, this.apiBase)
               .getDeviceListEntry(this.entryId)

         if (response.status < 299) {
            this.entry = response.data;
            this.isValid = true;
         } else {
            this.errorMessage = `Cannot retrieve list of devices: ${response.statusText}`
         }
      } catch (err: any) {
         this.errorMessage = `Cannot retrieve list of devices: ${err.message || "unknown"}`
      }
      return undefined;
  }

  async componentWillLoad() {
    this.getDeviceEntryAsync();

    const baseUri = new URL(this.basePath, document.baseURI || "/").pathname;

     const toRelative = (path: string) => {
       if (path.startsWith(baseUri)) {
         this.relativePath = path.slice(baseUri.length)
       } else {
         this.relativePath = ""
       }
     }

     window.navigation?.addEventListener("navigate", (ev: Event) => {
       if ((ev as any).canIntercept) { (ev as any).intercept(); }
       let path = new URL((ev as any).destination.url).pathname;
       toRelative(path);
     });

     toRelative(location.pathname)
   }

  @Event({eventName: "editor-closed"}) editorClosed: EventEmitter<string>;

  render() {
    let element = "list"
    // let entryId = "@new-log"

    if ( this.relativePath.startsWith("entry-log/"))
    {
      element = "editor";
      // entryId = this.relativePath.split("/")[1]
    }

    // const navigate = (path:string) => {
    //   const absolute = new URL(path, new URL(this.basePath, document.baseURI)).pathname;
    //   window.navigation.navigate(absolute)
    // }

    if(this.errorMessage) {
      return (
      <Host>
         <div class="error">{this.errorMessage}</div>
      </Host>
      )
   }
    return (
      <Host>
        <form ref={el => this.formElement = el}>
          <md-filled-text-field
            required value={this.entry?.name}
            oninput={ (ev: InputEvent) => {
               if(this.entry) {this.entry.name = this.handleInputEvent(ev)}
            }}
            label="Názov zariadenia"
            >
            <md-icon slot="leading-icon">devices</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            required value={this.entry?.deviceId}
            oninput={ (ev: InputEvent) => {
               if(this.entry) {this.entry.deviceId = this.handleInputEvent(ev)}
            }}
            label="Registračné číslo zariadenia" >
            <md-icon slot="leading-icon">pin</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            required value={this.entry?.warrantyUntil}
            oninput={ (ev: InputEvent) => {
               if(this.entry) {this.entry.warrantyUntil = this.handleInputEvent(ev)}
            }}
            label="Záruka do">
            <md-icon slot="leading-icon">watch_later</md-icon>
          </md-filled-text-field>

          <md-filled-select
            value={this.entry?.department?.name}
            oninput = { (ev: InputEvent) => {
               if(this.entry) {this.entry.department.name = this.handleInputEvent(ev)}
            } }
            label="Oddelenie">
            <md-icon slot="leading-icon">local_hospital</md-icon>
            <md-select-option value="chir">
              <div slot="headline">Chirurgia</div>
            </md-select-option>
            <md-select-option value="gyn">
              <div slot="headline">Gynekológia</div>
            </md-select-option>
            <md-select-option value="dets">
              <div slot="headline">Detské</div>
            </md-select-option>
          </md-filled-select>


          <md-filled-text-field
            required value={this.entry?.price}
            oninput={ (ev: InputEvent) => {
                if(this.entry) {this.entry.price = parseFloat(this.handleInputEvent(ev))}
            }}
            label="Cena zariadenia" >
            <md-icon slot="leading-icon">euro</md-icon>
          </md-filled-text-field>
        </form>

        <md-divider></md-divider>
        <div class="actions">
          <md-filled-tonal-button id="delete" disabled={!this.entry || this.entry?.id === "@new" }
            onClick={() => this.deleteEntry()} >
            <md-icon slot="icon">delete</md-icon>
            Zmazať
          </md-filled-tonal-button>
          <span class="stretch-fill"></span>
          <md-outlined-button id="cancel"
            onClick={() => this.editorClosed.emit("cancel")}>
            Zrušiť
          </md-outlined-button>
          <md-filled-button id="confirm" disabled={ !this.isValid }
            onClick={() => this.updateEntry() }
          >
            <md-icon slot="icon">save</md-icon>
            Uložiť
          </md-filled-button>
        </div>
        {this.entryId !== "@new" ? <div class="device-log">
          <h2>
            Prevádzkový log zariadenia {this.entryId}
          </h2>
          {/* { element === "editor"
            ? <harkap-ambulance-log-editor>
              </harkap-ambulance-log-editor>
            : <div> */}
              <harkap-ambulance-log-list device-id={this.entryId} api-base={this.apiBase}>
              </harkap-ambulance-log-list>
            {/* </div>
          } */}
        </div> : null}
      </Host>
    );
  }

  private handleInputEvent( ev: InputEvent): string {
   const target = ev.target as HTMLInputElement;
   // check validity of elements
   this.isValid = true;
   for (let i = 0; i < this.formElement.children.length; i++) {
      const element = this.formElement.children[i]
      if ("reportValidity" in element) {
      const valid = (element as HTMLInputElement).reportValidity();
      this.isValid &&= valid;
      }
   }
   return target.value
  }

  private async updateEntry() {
   try {
       const api = AmbulanceDeviceListApiFactory(undefined, this.apiBase);
         const response
            = this.entryId === "@new"
            ? await api.createDeviceListEntry(this.entry)
            : await api.updateDeviceListEntry(this.entryId, this.entry);
       if (response.status < 299) {
         this.editorClosed.emit("store")
       } else {
         this.errorMessage = `Cannot store entry: ${response.statusText}`
       }
     } catch (err: any) {
       this.errorMessage = `Cannot store entry: ${err.message || "unknown"}`
     }
  }

  private async deleteEntry() {
   try {
      const response = await AmbulanceDeviceListApiFactory(undefined, this.apiBase)
         .deleteDeviceListEntry(this.entryId)
      if (response.status < 299) {
      this.editorClosed.emit("delete")
      } else {
      this.errorMessage = `Cannot delete entry: ${response.statusText}`
      }
   } catch (err: any) {
      this.errorMessage = `Cannot delete entry: ${err.message || "unknown"}`
   }
}
}
