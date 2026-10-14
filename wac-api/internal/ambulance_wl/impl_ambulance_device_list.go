package ambulance_wl

import (
	"net/http"

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
	if device.Id == "" {
		device.Id = uuid.New().String()
	}
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

	// the log list changes only through the log endpoints, so saving a device that was
	// loaded earlier cannot drop log entries added in the meantime
	updated, err := this.DB.UpdateDocument(ctx, deviceId, nil, bson.D{{Key: "$set", Value: bson.D{
		{Key: "name", Value: device.Name},
		{Key: "deviceId", Value: device.DeviceId},
		{Key: "warrantyUntil", Value: device.WarrantyUntil},
		{Key: "price", Value: device.Price},
		{Key: "department", Value: device.Department},
	}}})
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
