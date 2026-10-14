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
//	  -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=test mongo:7.0
//	AMBULANCE_API_MONGODB_PORT=27099 AMBULANCE_API_MONGODB_PASSWORD=test go test ./...
func newIntegrationEngine(t *testing.T) *gin.Engine {
	if os.Getenv("AMBULANCE_API_MONGODB_PASSWORD") == "" {
		t.Skip("set AMBULANCE_API_MONGODB_* to run the MongoDB integration test")
	}
	gin.SetMode(gin.TestMode)
	db := db_service.NewMongoService[DeviceListEntry](db_service.MongoServiceConfig{
		DbName:     "ambulance-test",
		Collection: fmt.Sprintf("test-%d", time.Now().UnixNano()),
	})
	t.Cleanup(func() { db.Disconnect(context.Background()) })

	engine := gin.New()
	engine.Use(func(ctx *gin.Context) {
		ctx.Set("db_service", db)
		ctx.Next()
	})
	AddRoutes(engine)
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
	const device = `{"id": "d1", "name": "EKG", "deviceId": "1-ekg", "price": 1234.56, "department": {"name": "Interné", "code": "int"}}`

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
		expect(t, call(engine, "PUT", devices+"/d1", `{"name": "EKG 2", "deviceId": "2-ekg", "price": 10, "department": {"name": "Interné"}}`), http.StatusOK)
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
		expect(t, call(engine, "POST", devices, `{"name": " ", "deviceId": "x", "department": {"name": "x"}}`), http.StatusBadRequest)
		expect(t, call(engine, "PUT", devices+"/d1", `{"name": "x", "deviceId": "x", "price": -5, "department": {"name": "x"}}`), http.StatusBadRequest)
		expect(t, call(engine, "POST", devices+"/d1/logs", `{"text": "", "deviceId": ""}`), http.StatusBadRequest)
		expect(t, call(engine, "PUT", devices+"/d1/logs/l3", `{"text": " ", "deviceId": ""}`), http.StatusBadRequest)
	})

	t.Run("a full log list takes no more entries", func(t *testing.T) {
		logs := make([]string, maxLogsPerDevice)
		for i := range logs {
			logs[i] = fmt.Sprintf(`{"id": "f%d", "text": "log", "deviceId": ""}`, i)
		}
		full := `{"id": "full", "name": "Full", "deviceId": "full", "department": {"name": "x"}, "logList": [` + strings.Join(logs, ",") + `]}`
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
