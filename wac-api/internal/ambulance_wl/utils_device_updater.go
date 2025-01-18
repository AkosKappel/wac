package ambulance_wl

import (
	"net/http"

	"github.com/AkosKappel/wac/wac-api/internal/db_service"
	"github.com/gin-gonic/gin"
)

type deviceUpdater = func(
	ctx *gin.Context,
	device *DeviceListEntry,
) (updatedDevice *DeviceListEntry, responseContent interface{}, status int)

func updateDeviceFunc(ctx *gin.Context, updater deviceUpdater) {
	value, exists := ctx.Get("db_service")
	if !exists {
		ctx.JSON(
			http.StatusInternalServerError,
			gin.H{
				"status":  "Internal Server Error",
				"message": "db_service not found",
				"error":   "db_service not found",
			})
		return
	}

	db, ok := value.(db_service.DbService[DeviceListEntry])
	if !ok {
		ctx.JSON(
			http.StatusInternalServerError,
			gin.H{
				"status":  "Internal Server Error",
				"message": "db_service context is not of type db_service.DbService",
				"error":   "cannot cast db_service context to db_service.DbService",
			})
		return
	}

	deviceId := ctx.Param("entryId")

	device, err := db.FindDocument(ctx, deviceId)

	switch err {
	case nil:
		// continue
	case db_service.ErrNotFound:
		ctx.JSON(
			http.StatusNotFound,
			gin.H{
				"status":  "Not Found",
				"message": "Device not found",
				"error":   err.Error(),
			},
		)
		return
	default:
		ctx.JSON(
			http.StatusBadGateway,
			gin.H{
				"status":  "Bad Gateway",
				"message": "Failed to load device from database",
				"error":   err.Error(),
			})
		return
	}

	if !ok {
		ctx.JSON(
			http.StatusInternalServerError,
			gin.H{
				"status":  "Internal Server Error",
				"message": "Failed to cast device from database",
				"error":   "Failed to cast device from database",
			})
		return
	}

	updatedDevice, responseObject, status := updater(ctx, device)

	if updatedDevice != nil {
		err = db.UpdateDocument(ctx, deviceId, updatedDevice)
	} else {
		err = nil // redundant but for clarity
	}

	switch err {
	case nil:
		if responseObject != nil {
			ctx.JSON(status, responseObject)
		} else {
			ctx.AbortWithStatus(status)
		}
	case db_service.ErrNotFound:
		ctx.JSON(
			http.StatusNotFound,
			gin.H{
				"status":  "Not Found",
				"message": "Device was deleted while processing the request",
				"error":   err.Error(),
			},
		)
	default:
		ctx.JSON(
			http.StatusBadGateway,
			gin.H{
				"status":  "Bad Gateway",
				"message": "Failed to update device in database",
				"error":   err.Error(),
			})
	}

}
