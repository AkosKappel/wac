package ambulance_wl

import (
	"log"
	"net/http"

	"github.com/AkosKappel/wac/wac-api/internal/db_service"
	"github.com/gin-gonic/gin"
)

// Dependencies holds what the handlers need; main creates it once and passes it to AddRoutes.
type Dependencies struct {
	DB db_service.DbService[DeviceListEntry]
}

// respondError logs err and answers with a short message; internal details stay in the log.
func respondError(ctx *gin.Context, status int, message string, err error) {
	if err != nil {
		log.Printf("%s %s: %s: %v", ctx.Request.Method, ctx.Request.URL.Path, message, err)
	}
	ctx.JSON(status, gin.H{
		"status":  http.StatusText(status),
		"message": message,
	})
}

// syncLogDeviceIds fills the device ID of each log entry from its device, so the stored
// copy never goes stale when the device ID changes.
func syncLogDeviceIds(device *DeviceListEntry) {
	for i := range device.LogList {
		device.LogList[i].DeviceId = device.DeviceId
	}
}
