package ambulance_wl

import (
	"net/http"

	"slices"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Nasledujúci kód je kópiou vygenerovaného a zakomentovaného kódu zo súboru api_ambulance_conditions.go
func (this *implAmbulanceDeviceLogListAPI) GetDeviceLogs(ctx *gin.Context) {
	updateDeviceFunc(ctx, func(c *gin.Context, device *DeviceListEntry) (*DeviceListEntry, interface{}, int) {
		result := device.LogList
		if result == nil {
			result = []DeviceLog{}
		}
		// return nil device - no need to update it in db
		return nil, result, http.StatusOK
	})
}

func (this *implAmbulanceDeviceLogListAPI) CreateDeviceLog(ctx *gin.Context) {
	updateDeviceFunc(ctx, func(c *gin.Context, device *DeviceListEntry) (*DeviceListEntry, interface{}, int) {
		var entry DeviceLog

		if err := c.ShouldBindJSON(&entry); err != nil {
			return nil, gin.H{
				"status":  http.StatusBadRequest,
				"message": "Invalid request body",
				"error":   err.Error(),
			}, http.StatusBadRequest
		}

		if entry.DeviceId == "" {
			return nil, gin.H{
				"status":  http.StatusBadRequest,
				"message": "Device ID is required",
			}, http.StatusBadRequest
		}

		if entry.Id == "" || entry.Id == "@new" {
			entry.Id = uuid.NewString()
		}

		conflictIndx := slices.IndexFunc(device.LogList, func(log DeviceLog) bool {
			return entry.Id == log.Id
		})

		if conflictIndx >= 0 {
			return nil, gin.H{
				"status":  http.StatusConflict,
				"message": "Entry already exists",
			}, http.StatusConflict
		}

		device.LogList = append(device.LogList, entry)
		// entry was copied by value return reconciled value from the list
		entryIndx := slices.IndexFunc(device.LogList, func(log DeviceLog) bool {
			return entry.Id == log.Id
		})
		if entryIndx < 0 {
			return nil, gin.H{
				"status":  http.StatusInternalServerError,
				"message": "Failed to save entry",
			}, http.StatusInternalServerError
		}
		return device, device.LogList[entryIndx], http.StatusOK
	})
}

func (this *implAmbulanceDeviceLogListAPI) GetDeviceLog(ctx *gin.Context) {
	updateDeviceFunc(ctx, func(c *gin.Context, device *DeviceListEntry) (*DeviceListEntry, interface{}, int) {
		entryId := ctx.Param("logId")

		if entryId == "" {
			return nil, gin.H{
				"status":  http.StatusBadRequest,
				"message": "Log ID is required",
			}, http.StatusBadRequest
		}

		entryIndx := slices.IndexFunc(device.LogList, func(log DeviceLog) bool {
			return entryId == log.Id
		})

		if entryIndx < 0 {
			return nil, gin.H{
				"status":  http.StatusNotFound,
				"message": "Entry not found",
			}, http.StatusNotFound
		}

		// return nil ambulance - no need to update it in db
		return nil, device.LogList[entryIndx], http.StatusOK
	})
}

func (this *implAmbulanceDeviceLogListAPI) UpdateDeviceLog(ctx *gin.Context) {
	updateDeviceFunc(ctx, func(c *gin.Context, device *DeviceListEntry) (*DeviceListEntry, interface{}, int) {
		var entry DeviceLog

		if err := c.ShouldBindJSON(&entry); err != nil {
			return nil, gin.H{
				"status":  http.StatusBadRequest,
				"message": "Invalid request body",
				"error":   err.Error(),
			}, http.StatusBadRequest
		}

		if entry.Id == "" {
			return nil, gin.H{
				"status":  http.StatusBadRequest,
				"message": "Entry ID is required",
			}, http.StatusBadRequest
		}

		entryIndx := slices.IndexFunc(device.LogList, func(log DeviceLog) bool {
			return entry.Id == log.Id
		})

		if entryIndx < 0 {
			return nil, gin.H{
				"status":  http.StatusNotFound,
				"message": "Entry not found",
			}, http.StatusNotFound
		}

		device.LogList[entryIndx] = entry
		return device, entry, http.StatusOK
	})
}

func (this *implAmbulanceDeviceLogListAPI) DeleteDeviceLog(ctx *gin.Context) {
	updateDeviceFunc(ctx, func(c *gin.Context, device *DeviceListEntry) (*DeviceListEntry, interface{}, int) {
		logId := c.Param("logId")
		entryIndx := slices.IndexFunc(device.LogList, func(log DeviceLog) bool {
			return log.Id == logId
		})
		if entryIndx < 0 {
			return nil, gin.H{
				"status":  http.StatusNotFound,
				"message": "Entry not found",
			}, http.StatusNotFound
		}
		deleted := device.LogList[entryIndx]
		device.LogList = append(device.LogList[:entryIndx], device.LogList[entryIndx+1:]...)
		return device, deleted, http.StatusOK
	})
}
