package ambulance_wl

import (
	"strconv"
	"time"
)

// deviceChanges lists the fields that differ between the stored device and its update,
// as text for the change history. Log entries are left out: the log is a history itself.
func deviceChanges(stored, updated *DeviceListEntry) []FieldChange {
	day := func(t time.Time) string { return t.UTC().Format(time.DateOnly) }
	price := func(p float64) string { return strconv.FormatFloat(p, 'f', -1, 64) }
	days := func(d int32) string {
		if d == 0 {
			return ""
		}
		return strconv.Itoa(int(d))
	}
	fields := []FieldChange{
		{"name", stored.Name, updated.Name},
		{"deviceId", stored.DeviceId, updated.DeviceId},
		{"warrantyUntil", day(stored.WarrantyUntil), day(updated.WarrantyUntil)},
		{"price", price(stored.Price), price(updated.Price)},
		{"department", stored.Department.Name, updated.Department.Name},
		{"serviceIntervalDays", days(stored.ServiceIntervalDays), days(updated.ServiceIntervalDays)},
	}
	changes := []FieldChange{}
	for _, field := range fields {
		if field.From != field.To {
			changes = append(changes, field)
		}
	}
	return changes
}

// latestService is the time of the newest service log entry, or zero without one.
func latestService(logs []DeviceLog) time.Time {
	var latest time.Time
	for _, log := range logs {
		if log.Type == SERVICE && log.CreatedAt.After(latest) {
			latest = log.CreatedAt
		}
	}
	return latest
}
