package ambulance_wl

import (
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"
)

// Limits keep documents small; the same values are in the OpenAPI spec and the UI.
const (
	maxNameLength     = 100
	maxDeviceIdLength = 50
	maxDepartmentName = 100
	maxDepartmentCode = 50
	maxPrice          = 100_000_000
	maxLogTextLength  = 1000
	maxLogsPerDevice  = 200
)

// validateText trims value and returns a message when it is empty or longer than max.
func validateText(value *string, field string, max int) string {
	*value = strings.TrimSpace(*value)
	switch {
	case *value == "":
		return field + " is required"
	case utf8.RuneCountInString(*value) > max:
		return fmt.Sprintf("%s can have at most %d characters", field, max)
	}
	return ""
}

// validateDevice normalises the device and returns a message for the first invalid field,
// or "" when the device is valid.
func validateDevice(device *DeviceListEntry) string {
	if message := validateText(&device.Name, "Name", maxNameLength); message != "" {
		return message
	}
	if message := validateText(&device.DeviceId, "Device ID", maxDeviceIdLength); message != "" {
		return message
	}
	if device.Price < 0 || device.Price > maxPrice {
		return fmt.Sprintf("Price must be between 0 and %d", maxPrice)
	}
	if message := validateText(&device.Department.Name, "Department name", maxDepartmentName); message != "" {
		return message
	}
	device.Department.Code = strings.TrimSpace(device.Department.Code)
	if utf8.RuneCountInString(device.Department.Code) > maxDepartmentCode {
		return fmt.Sprintf("Department code can have at most %d characters", maxDepartmentCode)
	}
	if len(device.LogList) > maxLogsPerDevice {
		return fmt.Sprintf("A device can have at most %d log entries", maxLogsPerDevice)
	}
	for i := range device.LogList {
		if message := validateLog(&device.LogList[i]); message != "" {
			return message
		}
	}
	return ""
}

// validateLog normalises the log entry and returns a message when it is invalid.
func validateLog(entry *DeviceLog) string {
	if entry.Id == "" || entry.Id == "@new" {
		entry.Id = uuid.NewString()
	}
	return validateText(&entry.Text, "Text", maxLogTextLength)
}
