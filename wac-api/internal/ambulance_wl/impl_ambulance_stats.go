package ambulance_wl

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// expiringDays matches the amber warranty badge in the UI
const expiringDays = 90

// GetStats - Totals for the overview
func (this *implAmbulanceStatsAPI) GetStats(ctx *gin.Context) {
	var facets []struct {
		Totals []struct {
			Count int32   `bson:"count"`
			Value float64 `bson:"value"`
		} `bson:"totals"`
		Warranty     []WarrantyStats   `bson:"warranty"`
		Departments  []DepartmentStats `bson:"departments"`
		LogsPerMonth []MonthCount      `bson:"logsPerMonth"`
	}
	if err := this.DB.Aggregate(ctx, statsPipeline(time.Now()), &facets); err != nil {
		respondError(ctx, http.StatusBadGateway, "Failed to compute statistics in database", err)
		return
	}

	stats := Stats{Departments: []DepartmentStats{}, LogsPerMonth: []MonthCount{}}
	// $facet always returns one document; each facet is empty for an empty collection
	if len(facets) == 1 {
		facet := facets[0]
		if len(facet.Totals) == 1 {
			stats.DeviceCount, stats.TotalValue = facet.Totals[0].Count, facet.Totals[0].Value
		}
		if len(facet.Warranty) == 1 {
			stats.Warranty = facet.Warranty[0]
		}
		stats.Departments = append(stats.Departments, facet.Departments...)
		stats.LogsPerMonth = append(stats.LogsPerMonth, facet.LogsPerMonth...)
	}
	ctx.JSON(http.StatusOK, stats)
}

// statsPipeline computes every number of the overview in one aggregation over the devices.
func statsPipeline(now time.Time) mongo.Pipeline {
	price := bson.D{{Key: "$ifNull", Value: bson.A{"$price", 0}}}
	soon := bson.D{{Key: "$dateAdd", Value: bson.D{{Key: "startDate", Value: "$$NOW"}, {Key: "unit", Value: "day"}, {Key: "amount", Value: expiringDays}}}}
	count := func(condition bson.D) bson.D {
		return bson.D{{Key: "$sum", Value: bson.D{{Key: "$cond", Value: bson.A{condition, 1, 0}}}}}
	}
	// the first day of the month eleven months ago, so the chart covers twelve months
	since := time.Date(now.Year(), now.Month()-11, 1, 0, 0, 0, 0, time.UTC)

	return mongo.Pipeline{{{Key: "$facet", Value: bson.D{
		{Key: "totals", Value: bson.A{
			bson.D{{Key: "$group", Value: bson.D{{Key: "_id", Value: nil}, {Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}}, {Key: "value", Value: bson.D{{Key: "$sum", Value: price}}}}}},
		}},
		{Key: "warranty", Value: bson.A{
			bson.D{{Key: "$group", Value: bson.D{
				{Key: "_id", Value: nil},
				{Key: "expired", Value: count(bson.D{{Key: "$lt", Value: bson.A{"$warrantyUntil", "$$NOW"}}})},
				{Key: "expiring", Value: count(bson.D{{Key: "$and", Value: bson.A{
					bson.D{{Key: "$gte", Value: bson.A{"$warrantyUntil", "$$NOW"}}},
					bson.D{{Key: "$lte", Value: bson.A{"$warrantyUntil", soon}}},
				}}})},
				{Key: "ok", Value: count(bson.D{{Key: "$gt", Value: bson.A{"$warrantyUntil", soon}}})},
			}}},
		}},
		{Key: "departments", Value: bson.A{
			bson.D{{Key: "$group", Value: bson.D{
				{Key: "_id", Value: "$department.code"},
				{Key: "name", Value: bson.D{{Key: "$first", Value: "$department.name"}}},
				{Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}},
				{Key: "totalValue", Value: bson.D{{Key: "$sum", Value: price}}},
				{Key: "averageValue", Value: bson.D{{Key: "$avg", Value: price}}},
			}}},
			bson.D{{Key: "$sort", Value: bson.D{{Key: "totalValue", Value: -1}, {Key: "name", Value: 1}}}},
			bson.D{{Key: "$project", Value: bson.D{{Key: "_id", Value: 0}, {Key: "code", Value: "$_id"}, {Key: "name", Value: 1}, {Key: "count", Value: 1}, {Key: "totalValue", Value: 1}, {Key: "averageValue", Value: 1}}}},
		}},
		{Key: "logsPerMonth", Value: bson.A{
			bson.D{{Key: "$unwind", Value: "$logList"}},
			bson.D{{Key: "$match", Value: bson.D{{Key: "logList.createdAt", Value: bson.D{{Key: "$gte", Value: since}, {Key: "$lte", Value: now}}}}}},
			bson.D{{Key: "$group", Value: bson.D{
				{Key: "_id", Value: bson.D{{Key: "$dateToString", Value: bson.D{{Key: "format", Value: "%Y-%m"}, {Key: "date", Value: "$logList.createdAt"}}}}},
				{Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}},
			}}},
			bson.D{{Key: "$sort", Value: bson.D{{Key: "_id", Value: 1}}}},
			bson.D{{Key: "$project", Value: bson.D{{Key: "_id", Value: 0}, {Key: "month", Value: "$_id"}, {Key: "count", Value: 1}}}},
		}},
	}}}}
}
