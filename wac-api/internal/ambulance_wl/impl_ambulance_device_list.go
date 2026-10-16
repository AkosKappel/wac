package ambulance_wl

import (
	"net/http"
	"time"

	"github.com/AkosKappel/wac/wac-api/internal/db_service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
)

// CreateDeviceListEntry - Saves new entry into Device list
func (this *implAmbulanceDeviceListAPI) CreateDeviceListEntry(ctx *gin.Context) {

	device := DeviceListEntry{}
	if err := ctx.ShouldBindJSON(&device); err != nil {
		respondError(ctx, http.StatusBadRequest, "Invalid request body", nil)
		return
	}
	if message := validateDevice(&device); message != "" {
		respondError(ctx, http.StatusBadRequest, message, nil)
		return
	}
	if !this.resolveDepartment(ctx, &device) {
		return
	}
	if device.Id == "" {
		device.Id = uuid.New().String()
	}
	// both are kept by the server: lastServiceAt from service log entries, history from updates
	device.LastServiceAt = latestService(device.LogList)
	device.History = nil
	syncLogDeviceIds(&device)

	switch err := this.DB.CreateDocument(ctx, device.Id, &device); err {
	case nil:
		ctx.JSON(http.StatusCreated, device)
	case db_service.ErrConflict:
		respondError(ctx, http.StatusConflict, "Device already exists", nil)
	default:
		respondError(ctx, http.StatusBadGateway, "Failed to create device in database", err)
	}
}

// DeleteDeviceListEntry - Deletes specific entry
func (this *implAmbulanceDeviceListAPI) DeleteDeviceListEntry(ctx *gin.Context) {

	switch err := this.DB.DeleteDocument(ctx, ctx.Param("entryId")); err {
	case nil:
		ctx.AbortWithStatus(http.StatusNoContent)
	case db_service.ErrNotFound:
		respondError(ctx, http.StatusNotFound, "Device not found", nil)
	default:
		respondError(ctx, http.StatusBadGateway, "Failed to delete device from database", err)
	}
}

// GetDeviceListEntries - Provides the ambulance Device list
func (this *implAmbulanceDeviceListAPI) GetDeviceListEntries(ctx *gin.Context) {

	devices, err := this.DB.FindDocuments(ctx)
	if err != nil {
		respondError(ctx, http.StatusBadGateway, "Failed to load devices from database", err)
		return
	}
	for _, device := range devices {
		syncLogDeviceIds(device)
	}
	ctx.JSON(http.StatusOK, devices)
}

// GetDeviceListEntry - Provides details about Device list entry
func (this *implAmbulanceDeviceListAPI) GetDeviceListEntry(ctx *gin.Context) {

	device, err := this.DB.FindDocument(ctx, ctx.Param("entryId"))
	switch err {
	case nil:
		syncLogDeviceIds(device)
		ctx.JSON(http.StatusOK, device)
	case db_service.ErrNotFound:
		respondError(ctx, http.StatusNotFound, "Device not found", nil)
	default:
		respondError(ctx, http.StatusBadGateway, "Failed to load device from database", err)
	}
}

// UpdateDeviceListEntry - Updates specific entry
func (this *implAmbulanceDeviceListAPI) UpdateDeviceListEntry(ctx *gin.Context) {
	deviceId := ctx.Param("entryId")
	device := DeviceListEntry{}
	if err := ctx.ShouldBindJSON(&device); err != nil {
		respondError(ctx, http.StatusBadRequest, "Invalid request body", nil)
		return
	}
	if device.Id != "" && device.Id != deviceId {
		respondError(ctx, http.StatusBadRequest, "Device id in the body does not match the URL", nil)
		return
	}
	if message := validateDevice(&device); message != "" {
		respondError(ctx, http.StatusBadRequest, message, nil)
		return
	}
	if !this.resolveDepartment(ctx, &device) {
		return
	}
	stored, err := this.DB.FindDocument(ctx, deviceId)
	switch err {
	case nil:
	case db_service.ErrNotFound:
		respondError(ctx, http.StatusNotFound, "Device not found", nil)
		return
	default:
		respondError(ctx, http.StatusBadGateway, "Failed to load device from database", err)
		return
	}

	// the log list changes only through the log endpoints, so saving a device that was
	// loaded earlier cannot drop log entries added in the meantime
	update := bson.D{{Key: "$set", Value: bson.D{
		{Key: "name", Value: device.Name},
		{Key: "deviceId", Value: device.DeviceId},
		{Key: "warrantyUntil", Value: device.WarrantyUntil},
		{Key: "price", Value: device.Price},
		{Key: "department", Value: device.Department},
		{Key: "serviceIntervalDays", Value: device.ServiceIntervalDays},
	}}}
	if changes := deviceChanges(stored, &device); len(changes) > 0 {
		record := ChangeRecord{ChangedAt: time.Now().UTC(), Changes: changes}
		// $slice keeps only the newest entries, so the history cannot grow without limit
		update = append(update, bson.E{Key: "$push", Value: bson.D{{Key: "history", Value: bson.D{
			{Key: "$each", Value: []ChangeRecord{record}},
			{Key: "$slice", Value: -maxHistory},
		}}}})
	}
	updated, err := this.DB.UpdateDocument(ctx, deviceId, nil, update)
	switch err {
	case nil:
		syncLogDeviceIds(updated)
		ctx.JSON(http.StatusOK, updated)
	case db_service.ErrNotFound:
		respondError(ctx, http.StatusNotFound, "Device not found", nil)
	default:
		respondError(ctx, http.StatusBadGateway, "Failed to update device in database", err)
	}
}

// resolveDepartment replaces the device's department with the stored one, so devices only
// refer to existing departments and carry their current name. It answers with an error and
// returns false when that fails.
func (this *implAmbulanceDeviceListAPI) resolveDepartment(ctx *gin.Context, device *DeviceListEntry) bool {
	department, err := this.Departments.FindDocument(ctx, device.Department.Code)
	switch err {
	case nil:
		device.Department = Department{Code: department.Code, Name: department.Name}
		return true
	case db_service.ErrNotFound:
		respondError(ctx, http.StatusBadRequest, "Unknown department", nil)
	default:
		respondError(ctx, http.StatusBadGateway, "Failed to load department from database", err)
	}
	return false
}
