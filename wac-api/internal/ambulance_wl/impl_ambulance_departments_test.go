package ambulance_wl

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/mock"
)

func TestDeleteDepartment_InUse(t *testing.T) {
	devices := &DbServiceMock[DeviceListEntry]{}
	devices.On("CountDocuments", mock.Anything, mock.Anything).Return(int64(2), nil)
	departments := &DbServiceMock[Department]{}

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Params = []gin.Param{{Key: "code", Value: "kar"}}
	ctx.Request = httptest.NewRequest("DELETE", "/departments/kar", nil)

	sut := implAmbulanceDepartmentsAPI{Dependencies{DB: devices, Departments: departments}}
	sut.DeleteDepartment(ctx)

	if recorder.Code != http.StatusConflict {
		t.Fatalf("got %d, want 409", recorder.Code)
	}
	departments.AssertNotCalled(t, "DeleteDocument")
}

func TestUpdateDepartment_CodeMismatch(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Params = []gin.Param{{Key: "code", Value: "kar"}}
	ctx.Request = httptest.NewRequest("PUT", "/departments/kar", strings.NewReader(`{"code": "chir", "name": "Chirurgia"}`))

	sut := implAmbulanceDepartmentsAPI{Dependencies{}}
	sut.UpdateDepartment(ctx)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("got %d, want 400", recorder.Code)
	}
}
