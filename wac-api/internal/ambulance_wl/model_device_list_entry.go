/*
 * Device List Api
 *
 * Ambulance Device List management for Web-In-Cloud system
 *
 * API version: 1.0.0
 * Contact: <your_email>
 * Generated by: OpenAPI Generator (https://openapi-generator.tech)
 */

package ambulance_wl

import (
	"time"
)

type DeviceListEntry struct {

	// Unique id of the entry in this waiting list
	Id string `json:"id"`

	// Name of patient in waiting list
	Name string `json:"name"`

	// Unique identifier of the patient known to Web-In-Cloud system
	DeviceId string `json:"deviceId"`

	// Timestamp since when the patient entered the waiting list
	WarrantyUntil time.Time `json:"warrantyUntil,omitempty"`

	// Price of device
	Price float64 `json:"price,omitempty"`

	LogList []DeviceLog `json:"logList,omitempty"`

	Department Department `json:"department,omitempty"`
}
