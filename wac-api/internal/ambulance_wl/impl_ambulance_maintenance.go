package ambulance_wl

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

const defaultDueDays = 30

// GetMaintenanceDue - Devices due for service
func (this *implAmbulanceMaintenanceAPI) GetMaintenanceDue(ctx *gin.Context) {
	days := defaultDueDays
	if value := ctx.Query("days"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil || parsed < 0 || parsed > 365 {
			respondError(ctx, http.StatusBadRequest, "days must be a number from 0 to 365", nil)
			return
		}
		days = parsed
	}

	items := []MaintenanceItem{}
	if err := this.DB.Aggregate(ctx, maintenanceDuePipeline(days), &items); err != nil {
		respondError(ctx, http.StatusBadGateway, "Failed to load the service plan from database", err)
		return
	}
	ctx.JSON(http.StatusOK, items)
}

// maintenanceDuePipeline finds devices with a service interval whose next service
// (last service plus the interval, or now when never serviced) is at most days away.
func maintenanceDuePipeline(days int) mongo.Pipeline {
	inDays := func(start any, amount any) bson.D {
		return bson.D{{Key: "$dateAdd", Value: bson.D{{Key: "startDate", Value: start}, {Key: "unit", Value: "day"}, {Key: "amount", Value: amount}}}}
	}
	return mongo.Pipeline{
		{{Key: "$match", Value: bson.D{{Key: "serviceIntervalDays", Value: bson.D{{Key: "$gt", Value: 0}}}}}},
		// $dateAdd gives null without a last service
		{{Key: "$addFields", Value: bson.D{
			{Key: "nextServiceAt", Value: bson.D{{Key: "$ifNull", Value: bson.A{inDays("$lastServiceAt", "$serviceIntervalDays"), "$$NOW"}}}},
			{Key: "neverServiced", Value: bson.D{{Key: "$eq", Value: bson.A{bson.D{{Key: "$type", Value: "$lastServiceAt"}}, "missing"}}}},
		}}},
		{{Key: "$match", Value: bson.D{{Key: "$expr", Value: bson.D{{Key: "$lte", Value: bson.A{"$nextServiceAt", inDays("$$NOW", days)}}}}}}},
		{{Key: "$addFields", Value: bson.D{{Key: "overdue", Value: bson.D{{Key: "$or", Value: bson.A{
			"$neverServiced",
			bson.D{{Key: "$lt", Value: bson.A{"$nextServiceAt", "$$NOW"}}},
		}}}}}}},
		{{Key: "$sort", Value: bson.D{{Key: "nextServiceAt", Value: 1}, {Key: "name", Value: 1}}}},
		{{Key: "$project", Value: bson.D{
			{Key: "_id", Value: 0}, {Key: "id", Value: 1}, {Key: "name", Value: 1}, {Key: "deviceId", Value: 1},
			{Key: "department", Value: 1}, {Key: "serviceIntervalDays", Value: 1}, {Key: "lastServiceAt", Value: 1},
			{Key: "nextServiceAt", Value: 1}, {Key: "overdue", Value: 1},
		}}},
	}
}
