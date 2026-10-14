package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"context"
	"time"

	"github.com/AkosKappel/wac/wac-api/api"
	"github.com/AkosKappel/wac/wac-api/internal/ambulance_wl"
	"github.com/AkosKappel/wac/wac-api/internal/db_service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	log.Printf("Server started")
	port := os.Getenv("AMBULANCE_API_PORT")
	if port == "" {
		port = "8080"
	}
	environment := os.Getenv("AMBULANCE_API_ENVIRONMENT")
	if !strings.EqualFold(environment, "production") { // case insensitive comparison
		gin.SetMode(gin.DebugMode)
	}
	engine := gin.New()
	engine.Use(gin.Recovery())

	corsMiddleware := cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "PUT", "POST", "DELETE", "PATCH"},
		AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
		ExposeHeaders:    []string{""},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	})
	engine.Use(corsMiddleware)

	// setup context update  middleware
	dbService := db_service.NewMongoService[ambulance_wl.DeviceListEntry](db_service.MongoServiceConfig{})
	defer dbService.Disconnect(context.Background())
	engine.Use(func(ctx *gin.Context) {
		ctx.Set("db_service", dbService)
		ctx.Next()
	})

	// request routings
	ambulance_wl.AddRoutes(engine)
	engine.GET("/openapi", api.HandleOpenApi)
	// HEAD too: uptime monitors such as UptimeRobot check with HEAD, which Gin doesn't map to GET
	health := healthHandler(dbService)
	engine.GET("/api/health", health)
	engine.HEAD("/api/health", health)
	engine.Run(":" + port)
}

type pinger interface {
	Ping(ctx context.Context) error
}

// healthHandler answers 200 when the database is reachable and 503 otherwise.
func healthHandler(db pinger) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		if err := db.Ping(ctx); err != nil {
			log.Printf("health check failed: %v", err)
			ctx.JSON(http.StatusServiceUnavailable, gin.H{"status": "unavailable"})
			return
		}
		ctx.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}
