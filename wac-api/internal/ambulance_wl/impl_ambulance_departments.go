package ambulance_wl

import (
	"net/http"
	"slices"
	"strings"

	"github.com/AkosKappel/wac/wac-api/internal/db_service"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

// GetDepartments - Provides the hospital departments
func (this *implAmbulanceDepartmentsAPI) GetDepartments(ctx *gin.Context) {
	departments, err := this.Departments.FindDocuments(ctx)
	if err != nil {
		respondError(ctx, http.StatusBadGateway, "Failed to load departments from database", err)
		return
	}
	slices.SortFunc(departments, func(a, b *Department) int { return strings.Compare(a.Name, b.Name) })
	ctx.JSON(http.StatusOK, departments)
}

// GetDepartment - Provides one department
func (this *implAmbulanceDepartmentsAPI) GetDepartment(ctx *gin.Context) {
	switch department, err := this.Departments.FindDocument(ctx, ctx.Param("code")); err {
	case nil:
		ctx.JSON(http.StatusOK, department)
	case db_service.ErrNotFound:
		respondError(ctx, http.StatusNotFound, "Department not found", nil)
	default:
		respondError(ctx, http.StatusBadGateway, "Failed to load department from database", err)
	}
}

// CreateDepartment - Creates a department
func (this *implAmbulanceDepartmentsAPI) CreateDepartment(ctx *gin.Context) {
	var department Department
	if err := ctx.ShouldBindJSON(&department); err != nil {
		respondError(ctx, http.StatusBadRequest, "Invalid request body", nil)
		return
	}
	if message := validateDepartment(&department); message != "" {
		respondError(ctx, http.StatusBadRequest, message, nil)
		return
	}
	switch err := this.Departments.CreateDocument(ctx, department.Code, &department); err {
	case nil:
		ctx.JSON(http.StatusCreated, department)
	case db_service.ErrConflict:
		respondError(ctx, http.StatusConflict, "A department with this code already exists", nil)
	default:
		respondError(ctx, http.StatusBadGateway, "Failed to create department in database", err)
	}
}

// UpdateDepartment - Updates a department
func (this *implAmbulanceDepartmentsAPI) UpdateDepartment(ctx *gin.Context) {
	code := ctx.Param("code")
	var department Department
	if err := ctx.ShouldBindJSON(&department); err != nil {
		respondError(ctx, http.StatusBadRequest, "Invalid request body", nil)
		return
	}
	if department.Code == "" {
		department.Code = code
	}
	if department.Code != code {
		respondError(ctx, http.StatusBadRequest, "Department code in the body does not match the URL", nil)
		return
	}
	if message := validateDepartment(&department); message != "" {
		respondError(ctx, http.StatusBadRequest, message, nil)
		return
	}
	updated, err := this.Departments.UpdateDocument(ctx, code, nil, bson.D{{Key: "$set", Value: bson.D{
		{Key: "name", Value: department.Name},
		{Key: "floor", Value: department.Floor},
		{Key: "head", Value: department.Head},
	}}})
	switch err {
	case nil:
	case db_service.ErrNotFound:
		respondError(ctx, http.StatusNotFound, "Department not found", nil)
		return
	default:
		respondError(ctx, http.StatusBadGateway, "Failed to update department in database", err)
		return
	}
	// devices keep a copy of the name, so lists show it without a lookup
	if err := this.DB.UpdateDocuments(ctx,
		bson.D{{Key: "department.code", Value: code}},
		bson.D{{Key: "$set", Value: bson.D{{Key: "department.name", Value: updated.Name}}}},
	); err != nil {
		respondError(ctx, http.StatusBadGateway, "Failed to rename the department on its devices", err)
		return
	}
	ctx.JSON(http.StatusOK, updated)
}

// DeleteDepartment - Deletes a department
func (this *implAmbulanceDepartmentsAPI) DeleteDepartment(ctx *gin.Context) {
	code := ctx.Param("code")
	inUse, err := this.DB.CountDocuments(ctx, bson.D{{Key: "department.code", Value: code}})
	if err != nil {
		respondError(ctx, http.StatusBadGateway, "Failed to check the devices of the department", err)
		return
	}
	if inUse > 0 {
		respondError(ctx, http.StatusConflict, "Devices still belong to this department", nil)
		return
	}
	switch err := this.Departments.DeleteDocument(ctx, code); err {
	case nil:
		ctx.AbortWithStatus(http.StatusNoContent)
	case db_service.ErrNotFound:
		respondError(ctx, http.StatusNotFound, "Department not found", nil)
	default:
		respondError(ctx, http.StatusBadGateway, "Failed to delete department from database", err)
	}
}
