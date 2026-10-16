package ambulance_wl

import (
	"strings"
	"testing"
	"time"
)

func TestValidateDevice(t *testing.T) {
	valid := func() DeviceListEntry {
		return DeviceListEntry{Name: " EKG ", DeviceId: "1-ekg", WarrantyUntil: time.Now(), Price: 10, Department: Department{Code: "int"}}
	}
	cases := []struct {
		name   string
		change func(*DeviceListEntry)
		want   string
	}{
		{"valid", func(*DeviceListEntry) {}, ""},
		{"blank name", func(d *DeviceListEntry) { d.Name = "  " }, "Name is required"},
		{"long name", func(d *DeviceListEntry) { d.Name = strings.Repeat("é", maxNameLength+1) }, "Name can have at most 100 characters"},
		{"no device ID", func(d *DeviceListEntry) { d.DeviceId = "" }, "Device ID is required"},
		{"no warranty date", func(d *DeviceListEntry) { d.WarrantyUntil = time.Time{} }, "Warranty date is required"},
		{"negative price", func(d *DeviceListEntry) { d.Price = -1 }, "Price must be between 0 and 100000000"},
		{"no department", func(d *DeviceListEntry) { d.Department = Department{} }, "Department is required"},
		{"negative service interval", func(d *DeviceListEntry) { d.ServiceIntervalDays = -1 }, "Service interval must be between 1 and 3650 days"},
		{"unknown log type", func(d *DeviceListEntry) { d.LogList = []DeviceLog{{Text: "x", Type: "party"}} }, "Unknown log entry type"},
		{"too many logs", func(d *DeviceListEntry) { d.LogList = make([]DeviceLog, maxLogsPerDevice+1) }, "A device can have at most 200 log entries"},
		{"empty log text", func(d *DeviceListEntry) { d.LogList = []DeviceLog{{Text: " "}} }, "Text is required"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			device := valid()
			c.change(&device)
			if got := validateDevice(&device); got != c.want {
				t.Errorf("got %q, want %q", got, c.want)
			}
		})
	}

	device := valid()
	device.LogList = []DeviceLog{{Id: "@new", Text: "ok"}}
	validateDevice(&device)
	if device.Name != "EKG" || device.LogList[0].Id == "@new" {
		t.Errorf("not normalised: name %q, log id %q", device.Name, device.LogList[0].Id)
	}
}

func TestValidateDepartment(t *testing.T) {
	cases := map[string]struct {
		department Department
		want       string
	}{
		"valid":          {Department{Code: "kar", Name: " Kardiológia ", Floor: "2"}, ""},
		"uppercase code": {Department{Code: "KAR", Name: "x"}, "Code must be 1 to 50 lowercase letters, digits or dashes"},
		"no code":        {Department{Name: "x"}, "Code must be 1 to 50 lowercase letters, digits or dashes"},
		"no name":        {Department{Code: "kar"}, "Name is required"},
		"long floor":     {Department{Code: "kar", Name: "x", Floor: strings.Repeat("1", maxFloorLength+1)}, "Floor can have at most 20 characters"},
	}
	for name, c := range cases {
		t.Run(name, func(t *testing.T) {
			if got := validateDepartment(&c.department); got != c.want {
				t.Errorf("got %q, want %q", got, c.want)
			}
		})
	}
}

func TestValidateLogDefaultsToOther(t *testing.T) {
	entry := DeviceLog{Text: "x"}
	if validateLog(&entry); entry.Type != OTHER {
		t.Errorf("type = %q, want other", entry.Type)
	}
}

func TestLatestService(t *testing.T) {
	day := func(d int) time.Time { return time.Date(2026, 1, d, 0, 0, 0, 0, time.UTC) }
	logs := []DeviceLog{{Type: SERVICE, CreatedAt: day(5)}, {Type: REPAIR, CreatedAt: day(9)}, {Type: SERVICE, CreatedAt: day(3)}}
	if got := latestService(logs); !got.Equal(day(5)) {
		t.Errorf("got %v, want the 5th", got)
	}
}
