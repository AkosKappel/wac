package ambulance_wl

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/AkosKappel/wac/wac-api/internal/db_service"
	"github.com/gin-gonic/gin"
)

// Runs the API against a real MongoDB given by the usual AMBULANCE_API_MONGODB_* variables,
// for example a throwaway container:
//
//	docker run -d --rm --name ambulance-test-mongo -p 127.0.0.1:27099:27017 \
//	  -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=test mongo:8.0
//	AMBULANCE_API_MONGODB_PORT=27099 AMBULANCE_API_MONGODB_PASSWORD=test go test ./...
func newIntegrationEngine(t *testing.T) *gin.Engine {
	if os.Getenv("AMBULANCE_API_MONGODB_PASSWORD") == "" {
		t.Skip("set AMBULANCE_API_MONGODB_* to run the MongoDB integration test")
	}
	gin.SetMode(gin.TestMode)
	collection := fmt.Sprintf("test-%d", time.Now().UnixNano())
	db := db_service.NewMongoService[DeviceListEntry](db_service.MongoServiceConfig{
		DbName:     "ambulance-test",
		Collection: collection,
	})
	departments := db_service.NewMongoService[Department](db_service.MongoServiceConfig{
		DbName:     "ambulance-test",
		Collection: collection + "-departments",
		KeyField:   "code",
	})
	t.Cleanup(func() {
		db.Disconnect(context.Background())
		departments.Disconnect(context.Background())
	})

	engine := gin.New()
	AddRoutes(engine, Dependencies{DB: db, Departments: departments})
	for _, department := range []string{
		`{"code": "int", "name": "Interné", "floor": "1"}`,
		`{"code": "x", "name": "X"}`,
	} {
		if r := call(engine, "POST", "/api/departments", department); r.Code != http.StatusCreated {
			t.Fatalf("creating a department: %d %s", r.Code, r.Body.String())
		}
	}
	return engine
}

func call(engine *gin.Engine, method, path, body string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(method, path, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	engine.ServeHTTP(recorder, request)
	return recorder
}

func TestIntegration(t *testing.T) {
	engine := newIntegrationEngine(t)
	const devices = "/api/device-list/entries"
	const device = `{"id": "d1", "name": "EKG", "deviceId": "1-ekg", "warrantyUntil": "2030-01-01T00:00:00Z", "price": 1234.56, "department": {"name": "Interné", "code": "int"}}`

	expect := func(t *testing.T, r *httptest.ResponseRecorder, status int) {
		t.Helper()
		if r.Code != status {
			t.Fatalf("got %d, want %d: %s", r.Code, status, r.Body.String())
		}
	}

	t.Run("empty list is an empty array", func(t *testing.T) {
		r := call(engine, "GET", devices, "")
		expect(t, r, http.StatusOK)
		if r.Body.String() != "[]" {
			t.Fatalf("got %s, want []", r.Body.String())
		}
	})

	t.Run("create and reject a duplicate id", func(t *testing.T) {
		expect(t, call(engine, "POST", devices, device), http.StatusCreated)
		expect(t, call(engine, "POST", devices, device), http.StatusConflict)
	})

	t.Run("concurrent log entries are all kept", func(t *testing.T) {
		var wg sync.WaitGroup
		for i := range 20 {
			wg.Add(1)
			go func() {
				defer wg.Done()
				expect(t, call(engine, "POST", devices+"/d1/logs", fmt.Sprintf(`{"id": "l%d", "text": "log %d", "deviceId": ""}`, i, i)), http.StatusOK)
			}()
		}
		wg.Wait()

		r := call(engine, "GET", devices+"/d1/logs", "")
		expect(t, r, http.StatusOK)
		var logs []DeviceLog
		json.Unmarshal(r.Body.Bytes(), &logs)
		if len(logs) != 20 {
			t.Fatalf("got %d logs, want 20", len(logs))
		}
		if logs[0].DeviceId != "1-ekg" {
			t.Errorf("log deviceId = %q, want the device's 1-ekg", logs[0].DeviceId)
		}
		expect(t, call(engine, "POST", devices+"/d1/logs", `{"id": "l0", "text": "again", "deviceId": ""}`), http.StatusConflict)
		expect(t, call(engine, "POST", devices+"/missing/logs", `{"text": "x", "deviceId": ""}`), http.StatusNotFound)
	})

	t.Run("device update keeps its id and its logs", func(t *testing.T) {
		expect(t, call(engine, "PUT", devices+"/d1", `{"name": "EKG 2", "deviceId": "2-ekg", "warrantyUntil": "2030-01-01T00:00:00Z", "price": 10, "department": {"code": "int"}}`), http.StatusOK)
		expect(t, call(engine, "PUT", devices+"/d1", `{"id": "other", "name": "EKG 2", "deviceId": "2-ekg"}`), http.StatusBadRequest)

		r := call(engine, "GET", devices+"/d1", "")
		expect(t, r, http.StatusOK)
		var stored DeviceListEntry
		json.Unmarshal(r.Body.Bytes(), &stored)
		if stored.Id != "d1" || stored.Name != "EKG 2" || len(stored.LogList) != 20 {
			t.Fatalf("got id %q, name %q, %d logs", stored.Id, stored.Name, len(stored.LogList))
		}
		if stored.LogList[0].DeviceId != "2-ekg" {
			t.Errorf("log deviceId = %q, want 2-ekg after the device changed", stored.LogList[0].DeviceId)
		}
		if len(stored.History) != 1 || len(stored.History[0].Changes) != 3 {
			t.Errorf("history = %+v, want one record with name, deviceId and price", stored.History)
		}
	})

	t.Run("departments", func(t *testing.T) {
		expect(t, call(engine, "POST", "/api/departments", `{"code": "int", "name": "Again"}`), http.StatusConflict)
		expect(t, call(engine, "POST", "/api/departments", `{"code": "Bad Code", "name": "x"}`), http.StatusBadRequest)
		expect(t, call(engine, "POST", devices, `{"name": "x", "deviceId": "x", "warrantyUntil": "2030-01-01T00:00:00Z", "department": {"code": "nope"}}`), http.StatusBadRequest)

		// a new name reaches the devices of the department
		expect(t, call(engine, "PUT", "/api/departments/int", `{"name": "Interná klinika", "floor": "3"}`), http.StatusOK)
		r := call(engine, "GET", devices+"/d1", "")
		if !strings.Contains(r.Body.String(), `"Interná klinika"`) {
			t.Errorf("device kept the old department name: %s", r.Body.String())
		}
		expect(t, call(engine, "DELETE", "/api/departments/int", ""), http.StatusConflict)
		expect(t, call(engine, "POST", "/api/departments", `{"code": "empty", "name": "Empty"}`), http.StatusCreated)
		expect(t, call(engine, "DELETE", "/api/departments/empty", ""), http.StatusNoContent)
		expect(t, call(engine, "GET", "/api/departments/empty", ""), http.StatusNotFound)
	})

	t.Run("service plan", func(t *testing.T) {
		const plan = `{"name": "EKG 2", "deviceId": "2-ekg", "warrantyUntil": "2030-01-01T00:00:00Z", "price": 10, "serviceIntervalDays": 30, "department": {"code": "int"}}`
		expect(t, call(engine, "PUT", devices+"/d1", plan), http.StatusOK)
		dueIds := func(days int) []string {
			r := call(engine, "GET", fmt.Sprintf("/api/maintenance/due?days=%d", days), "")
			expect(t, r, http.StatusOK)
			var items []MaintenanceItem
			json.Unmarshal(r.Body.Bytes(), &items)
			ids := []string{}
			for _, item := range items {
				ids = append(ids, item.Id)
			}
			return ids
		}
		if got := dueIds(0); len(got) != 1 || got[0] != "d1" {
			t.Fatalf("never serviced device not due: %v", got)
		}

		// a service ten days ago moves the next one 20 days ahead
		serviced := time.Now().Add(-10 * 24 * time.Hour).UTC().Format(time.RFC3339)
		expect(t, call(engine, "POST", devices+"/d1/logs", `{"id": "s1", "text": "service", "deviceId": "", "type": "service", "createdAt": "`+serviced+`"}`), http.StatusOK)
		// an older service does not move it back
		expect(t, call(engine, "POST", devices+"/d1/logs", `{"id": "s2", "text": "old service", "deviceId": "", "type": "service", "createdAt": "2020-01-01T00:00:00Z"}`), http.StatusOK)
		if got := dueIds(10); len(got) != 0 {
			t.Errorf("due within 10 days after a service: %v", got)
		}
		if got := dueIds(30); len(got) != 1 {
			t.Errorf("not due within 30 days: %v", got)
		}
		expect(t, call(engine, "GET", "/api/maintenance/due?days=999", ""), http.StatusBadRequest)
		expect(t, call(engine, "POST", devices+"/d1/logs", `{"text": "x", "deviceId": "", "type": "party"}`), http.StatusBadRequest)
	})

	t.Run("stats", func(t *testing.T) {
		r := call(engine, "GET", "/api/stats", "")
		expect(t, r, http.StatusOK)
		var stats Stats
		json.Unmarshal(r.Body.Bytes(), &stats)
		if stats.DeviceCount != 1 || stats.TotalValue != 10 || stats.Warranty.Ok != 1 || len(stats.Departments) != 1 || stats.Departments[0].Name != "Interná klinika" {
			t.Errorf("unexpected stats: %+v", stats)
		}
		if len(stats.LogsPerMonth) == 0 || stats.LogsPerMonth[len(stats.LogsPerMonth)-1].Count < 20 {
			t.Errorf("log entries of this month missing: %+v", stats.LogsPerMonth)
		}
	})

	t.Run("log update uses the id from the URL", func(t *testing.T) {
		expect(t, call(engine, "PUT", devices+"/d1/logs/l3", `{"text": "edited", "deviceId": ""}`), http.StatusOK)
		expect(t, call(engine, "PUT", devices+"/d1/logs/l3", `{"id": "l4", "text": "edited", "deviceId": ""}`), http.StatusBadRequest)
		expect(t, call(engine, "PUT", devices+"/d1/logs/nope", `{"text": "edited", "deviceId": ""}`), http.StatusNotFound)

		r := call(engine, "GET", devices+"/d1/logs/l3", "")
		expect(t, r, http.StatusOK)
		if !strings.Contains(r.Body.String(), `"edited"`) {
			t.Errorf("log not updated: %s", r.Body.String())
		}
	})

	t.Run("invalid input is rejected", func(t *testing.T) {
		expect(t, call(engine, "POST", devices, `{"name": " ", "deviceId": "x", "department": {"code": "x"}}`), http.StatusBadRequest)
		expect(t, call(engine, "PUT", devices+"/d1", `{"name": "x", "deviceId": "x", "warrantyUntil": "2030-01-01T00:00:00Z", "price": -5, "department": {"code": "x"}}`), http.StatusBadRequest)
		expect(t, call(engine, "POST", devices+"/d1/logs", `{"text": "", "deviceId": ""}`), http.StatusBadRequest)
		expect(t, call(engine, "PUT", devices+"/d1/logs/l3", `{"text": " ", "deviceId": ""}`), http.StatusBadRequest)
	})

	t.Run("a full log list takes no more entries", func(t *testing.T) {
		logs := make([]string, maxLogsPerDevice)
		for i := range logs {
			logs[i] = fmt.Sprintf(`{"id": "f%d", "text": "log", "deviceId": ""}`, i)
		}
		full := `{"id": "full", "name": "Full", "deviceId": "full", "warrantyUntil": "2030-01-01T00:00:00Z", "department": {"code": "x"}, "logList": [` + strings.Join(logs, ",") + `]}`
		expect(t, call(engine, "POST", devices, full), http.StatusCreated)
		expect(t, call(engine, "POST", devices+"/full/logs", `{"text": "one more", "deviceId": ""}`), http.StatusConflict)
	})

	t.Run("delete log and device", func(t *testing.T) {
		expect(t, call(engine, "DELETE", devices+"/d1/logs/l3", ""), http.StatusNoContent)
		expect(t, call(engine, "DELETE", devices+"/d1/logs/l3", ""), http.StatusNotFound)
		expect(t, call(engine, "DELETE", devices+"/d1", ""), http.StatusNoContent)
		expect(t, call(engine, "DELETE", devices+"/d1", ""), http.StatusNotFound)
	})
}
