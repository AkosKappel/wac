package ambulance_wl

import (
	"strings"
	"testing"
)

func TestValidateDevice(t *testing.T) {
	valid := func() DeviceListEntry {
		return DeviceListEntry{Name: " EKG ", DeviceId: "1-ekg", Price: 10, Department: Department{Name: "Interné"}}
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
		{"negative price", func(d *DeviceListEntry) { d.Price = -1 }, "Price must be between 0 and 100000000"},
		{"no department", func(d *DeviceListEntry) { d.Department = Department{} }, "Department name is required"},
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
