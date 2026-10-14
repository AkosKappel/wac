package ambulance_wl

import (
	"net/http"
	"slices"
	"time"

	"github.com/AkosKappel/wac/wac-api/internal/db_service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
)

// findLog returns the log entry with the given id, or nil.
func findLog(device *DeviceListEntry, logId string) *DeviceLog {
	syncLogDeviceIds(device)
	i := slices.IndexFunc(device.LogList, func(log DeviceLog) bool { return log.Id == logId })
	if i < 0 {
		return nil
	}
	return &device.LogList[i]
}

// findDevice loads the device from the URL and answers with an error when that fails.
func findDevice(ctx *gin.Context, db db_service.DbService[DeviceListEntry]) (*DeviceListEntry, bool) {
	device, err := db.FindDocument(ctx, ctx.Param("entryId"))
	switch err {
	case nil:
		return device, true
	case db_service.ErrNotFound:
		respondError(ctx, http.StatusNotFound, "Device not found", nil)
	default:
		respondError(ctx, http.StatusBadGateway, "Failed to load device from database", err)
	}
	return nil, false
}

func (this *implAmbulanceDeviceLogListAPI) GetDeviceLogs(ctx *gin.Context) {
	db, ok := dbService(ctx)
	if !ok {
		return
	}
	device, ok := findDevice(ctx, db)
	if !ok {
		return
	}
	syncLogDeviceIds(device)
	logs := device.LogList
	if logs == nil {
		logs = []DeviceLog{}
	}
	ctx.JSON(http.StatusOK, logs)
}

func (this *implAmbulanceDeviceLogListAPI) GetDeviceLog(ctx *gin.Context) {
	db, ok := dbService(ctx)
	if !ok {
		return
	}
	device, ok := findDevice(ctx, db)
	if !ok {
		return
	}
	entry := findLog(device, ctx.Param("logId"))
	if entry == nil {
		respondError(ctx, http.StatusNotFound, "Log entry not found", nil)
		return
	}
	ctx.JSON(http.StatusOK, entry)
}

func (this *implAmbulanceDeviceLogListAPI) CreateDeviceLog(ctx *gin.Context) {
	db, ok := dbService(ctx)
	if !ok {
		return
	}

	var entry DeviceLog
	if err := ctx.ShouldBindJSON(&entry); err != nil {
		respondError(ctx, http.StatusBadRequest, "Invalid request body", nil)
		return
	}
	if entry.Id == "" || entry.Id == "@new" {
		entry.Id = uuid.NewString()
	}
	if entry.CreatedAt.IsZero() {
		entry.CreatedAt = time.Now().UTC()
	}

	device, err := db.UpdateDocument(ctx, ctx.Param("entryId"),
		bson.D{{Key: "logList.id", Value: bson.D{{Key: "$ne", Value: entry.Id}}}},
		bson.D{{Key: "$push", Value: bson.D{{Key: "logList", Value: entry}}}},
	)
	switch err {
	case nil:
		ctx.JSON(http.StatusOK, findLog(device, entry.Id))
	case db_service.ErrNotFound:
		// either the device is missing or it already has a log with this id
		if _, ok := findDevice(ctx, db); ok {
			respondError(ctx, http.StatusConflict, "Log entry already exists", nil)
		}
	default:
		respondError(ctx, http.StatusBadGateway, "Failed to save log entry in database", err)
	}
}

func (this *implAmbulanceDeviceLogListAPI) UpdateDeviceLog(ctx *gin.Context) {
	db, ok := dbService(ctx)
	if !ok {
		return
	}

	logId := ctx.Param("logId")
	var entry DeviceLog
	if err := ctx.ShouldBindJSON(&entry); err != nil {
		respondError(ctx, http.StatusBadRequest, "Invalid request body", nil)
		return
	}
	if entry.Id != "" && entry.Id != logId {
		respondError(ctx, http.StatusBadRequest, "Log id in the body does not match the URL", nil)
		return
	}

	set := bson.D{{Key: "logList.$.text", Value: entry.Text}}
	if !entry.CreatedAt.IsZero() {
		set = append(set, bson.E{Key: "logList.$.createdAt", Value: entry.CreatedAt})
	}
	device, err := db.UpdateDocument(ctx, ctx.Param("entryId"),
		bson.D{{Key: "logList.id", Value: logId}},
		bson.D{{Key: "$set", Value: set}},
	)
	switch err {
	case nil:
		ctx.JSON(http.StatusOK, findLog(device, logId))
	case db_service.ErrNotFound:
		respondError(ctx, http.StatusNotFound, "Device or log entry not found", nil)
	default:
		respondError(ctx, http.StatusBadGateway, "Failed to update log entry in database", err)
	}
}

func (this *implAmbulanceDeviceLogListAPI) DeleteDeviceLog(ctx *gin.Context) {
	db, ok := dbService(ctx)
	if !ok {
		return
	}

	logId := ctx.Param("logId")
	_, err := db.UpdateDocument(ctx, ctx.Param("entryId"),
		bson.D{{Key: "logList.id", Value: logId}},
		bson.D{{Key: "$pull", Value: bson.D{{Key: "logList", Value: bson.D{{Key: "id", Value: logId}}}}}},
	)
	switch err {
	case nil:
		ctx.AbortWithStatus(http.StatusNoContent)
	case db_service.ErrNotFound:
		respondError(ctx, http.StatusNotFound, "Device or log entry not found", nil)
	default:
		respondError(ctx, http.StatusBadGateway, "Failed to delete log entry from database", err)
	}
}
