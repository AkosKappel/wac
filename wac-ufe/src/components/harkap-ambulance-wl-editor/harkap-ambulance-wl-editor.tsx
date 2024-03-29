 import { Component, Host, Prop, h, EventEmitter, Event } from '@stencil/core';


@Component({
  tag: 'harkap-ambulance-wl-editor',
  styleUrl: 'harkap-ambulance-wl-editor.css',
  shadow: true,
})
export class HarkapAmbulanceWlEditor {

   @Prop() entryId: string;

   @Event({eventName: "editor-closed"}) editorClosed: EventEmitter<string>;

  render() {
   return (
     <Host>
       <md-filled-text-field label="Názov zariadenia" >
         <md-icon slot="leading-icon">devices</md-icon>
       </md-filled-text-field>

       <md-filled-text-field label="Registračné číslo zariadenia" >
         <md-icon slot="leading-icon">pin</md-icon>
       </md-filled-text-field>

       <md-filled-text-field label="Záruka do">
         <md-icon slot="leading-icon">watch_later</md-icon>
       </md-filled-text-field>

       <md-filled-select label="Oddelenie">
         <md-icon slot="leading-icon">local_hospital</md-icon>
         <md-select-option value="folowup">
           <div slot="headline">Chirurgia</div>
         </md-select-option>
         <md-select-option value="nausea">
           <div slot="headline">Geriatria</div>
         </md-select-option>
         <md-select-option value="fever">
           <div slot="headline">Gynekológia</div>
         </md-select-option>
         <md-select-option value="ache-in-throat">
           <div slot="headline">Detské</div>
         </md-select-option>
       </md-filled-select>

       {/* <div class="duration-slider">
         <span class="label">Predpokladaná doba trvania:&nbsp; </span>
         <span class="label">{this.duration}</span>
         <span class="label">&nbsp;minút</span>
         <md-slider
           min="2" max="45" value={this.duration} ticks labeled
           oninput={this.handleSliderInput.bind(this)}></md-slider>
       </div> */}

       <md-filled-text-field label="Cena zariadenia" >
         <md-icon slot="leading-icon">euro</md-icon>
       </md-filled-text-field>

       <md-divider></md-divider>
       <div class="actions">
         <md-filled-tonal-button id="delete"
           onClick={() => this.editorClosed.emit("delete")}>
           <md-icon slot="icon">delete</md-icon>
           Zmazať
         </md-filled-tonal-button>
         <span class="stretch-fill"></span>
         <md-outlined-button id="cancel"
           onClick={() => this.editorClosed.emit("cancel")}>
           Zrušiť
         </md-outlined-button>
         <md-filled-button id="confirm"
           onClick={() => this.editorClosed.emit("store")}>
           <md-icon slot="icon">save</md-icon>
           Uložiť
         </md-filled-button>
       </div>
     </Host>
   );
 }

}
