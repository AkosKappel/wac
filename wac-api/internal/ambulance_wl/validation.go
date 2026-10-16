package ambulance_wl

import (
	"fmt"
	"regexp"
	"slices"
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
	maxFloorLength    = 20
	maxHeadLength     = 100
	maxServiceDays    = 3650
	maxHistory        = 50
)

var departmentCode = regexp.MustCompile(`^[a-z0-9-]+$`)

var logTypes = []LogType{PURCHASE, INSTALLATION, SERVICE, CALIBRATION, REPAIR, OTHER}

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
	if device.WarrantyUntil.IsZero() {
		return "Warranty date is required"
	}
	if device.Price < 0 || device.Price > maxPrice {
		return fmt.Sprintf("Price must be between 0 and %d", maxPrice)
	}
	// the name comes from the department itself, see resolveDepartment
	device.Department.Code = strings.TrimSpace(device.Department.Code)
	if device.Department.Code == "" {
		return "Department is required"
	}
	if device.ServiceIntervalDays < 0 || device.ServiceIntervalDays > maxServiceDays {
		return fmt.Sprintf("Service interval must be between 1 and %d days", maxServiceDays)
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
	return validateLogFields(entry)
}

// validateLogFields checks the fields a log update can change.
func validateLogFields(entry *DeviceLog) string {
	if entry.Type == "" {
		entry.Type = OTHER
	}
	if !slices.Contains(logTypes, entry.Type) {
		return "Unknown log entry type"
	}
	return validateText(&entry.Text, "Text", maxLogTextLength)
}

// validateDepartment normalises the department and returns a message when it is invalid.
func validateDepartment(department *Department) string {
	department.Code = strings.TrimSpace(department.Code)
	if !departmentCode.MatchString(department.Code) || utf8.RuneCountInString(department.Code) > maxDepartmentCode {
		return fmt.Sprintf("Code must be 1 to %d lowercase letters, digits or dashes", maxDepartmentCode)
	}
	if message := validateText(&department.Name, "Name", maxDepartmentName); message != "" {
		return message
	}
	department.Floor = strings.TrimSpace(department.Floor)
	if utf8.RuneCountInString(department.Floor) > maxFloorLength {
		return fmt.Sprintf("Floor can have at most %d characters", maxFloorLength)
	}
	department.Head = strings.TrimSpace(department.Head)
	if utf8.RuneCountInString(department.Head) > maxHeadLength {
		return fmt.Sprintf("Head of department can have at most %d characters", maxHeadLength)
	}
	return ""
}
