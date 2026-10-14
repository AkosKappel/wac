package ambulance_wl

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// departments is fixed reference data; docker/mongo/seed.js uses the same codes.
var departments = []Department{
	{Code: "chir", Name: "Chirurgia"},
	{Code: "dets", Name: "Detské"},
	{Code: "int", Name: "Interné"},
	{Code: "ort", Name: "Ortopedické"},
	{Code: "ped", Name: "Pediatrické"},
}

// GetDepartments - Provides the hospital departments
func (this *implAmbulanceDepartmentsAPI) GetDepartments(ctx *gin.Context) {
	ctx.JSON(http.StatusOK, departments)
}
