package ambulance_wl

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// departments is fixed reference data; docker/mongo/seed.js uses the same codes.
var departments = []Department{
	{Code: "aro", Name: "ARO"},
	{Code: "chir", Name: "Chirurgia"},
	{Code: "dets", Name: "Detské"},
	{Code: "int", Name: "Interné"},
	{Code: "kar", Name: "Kardiológia"},
	{Code: "lab", Name: "Laboratórium"},
	{Code: "ort", Name: "Ortopedické"},
	{Code: "ped", Name: "Pediatrické"},
	{Code: "rad", Name: "Rádiológia"},
	{Code: "urg", Name: "Urgentný príjem"},
}

// GetDepartments - Provides the hospital departments
func (this *implAmbulanceDepartmentsAPI) GetDepartments(ctx *gin.Context) {
	ctx.JSON(http.StatusOK, departments)
}
