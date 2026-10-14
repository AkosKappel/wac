package ambulance_wl

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestGetDepartments(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	AddRoutes(engine, Dependencies{})

	r := call(engine, "GET", "/api/departments", "")
	var got []Department
	json.Unmarshal(r.Body.Bytes(), &got)
	if r.Code != http.StatusOK || len(got) != len(departments) || got[0].Code == "" {
		t.Fatalf("got %d: %s", r.Code, r.Body.String())
	}
}
