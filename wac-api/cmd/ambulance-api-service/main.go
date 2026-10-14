package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/AkosKappel/wac/wac-api/api"
	"github.com/AkosKappel/wac/wac-api/internal/ambulance_wl"
	"github.com/AkosKappel/wac/wac-api/internal/db_service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// JSON lines are easier to filter than free text; the standard log package writes here too
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	slog.Info("server started")
	if os.Getenv("AMBULANCE_API_MONGODB_PASSWORD") == "" {
		slog.Error("AMBULANCE_API_MONGODB_PASSWORD is not set")
		os.Exit(1)
	}
	port := os.Getenv("AMBULANCE_API_PORT")
	if port == "" {
		port = "8080"
	}
	environment := os.Getenv("AMBULANCE_API_ENVIRONMENT")
	if !strings.EqualFold(environment, "production") { // case insensitive comparison
		gin.SetMode(gin.DebugMode)
	}
	engine := gin.New()
	engine.Use(gin.Recovery(), requestLogger())

	// The live site is same-origin behind nginx; CORS is only for a UI dev server on another port
	if origins := os.Getenv("AMBULANCE_API_CORS_ORIGINS"); origins != "" {
		engine.Use(cors.New(cors.Config{
			AllowOrigins: strings.Split(origins, ","),
			AllowMethods: []string{"GET", "PUT", "POST", "DELETE", "PATCH"},
			AllowHeaders: []string{"Origin", "Authorization", "Content-Type"},
			MaxAge:       12 * time.Hour,
		}))
	}

	dbService := db_service.NewMongoService[ambulance_wl.DeviceListEntry](db_service.MongoServiceConfig{})
	defer dbService.Disconnect(context.Background())

	ambulance_wl.AddRoutes(engine, ambulance_wl.Dependencies{DB: dbService})
	// /openapi for the course's Kubernetes setup, /api/openapi behind the nginx /api proxy
	engine.GET("/openapi", api.HandleOpenApi)
	engine.GET("/api/openapi", api.HandleOpenApi)
	// HEAD too: uptime monitors such as UptimeRobot check with HEAD, which Gin doesn't map to GET
	health := healthHandler(dbService)
	engine.GET("/api/health", health)
	engine.HEAD("/api/health", health)

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           engine,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	// docker stop sends SIGTERM: finish open requests before the deferred Disconnect runs
	stop, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	<-stop.Done()
	slog.Info("shutting down")
	shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelShutdown()
	if err := server.Shutdown(shutdownCtx); err != nil {
		slog.Error("shutdown failed", "error", err)
	}
}

type pinger interface {
	Ping(ctx context.Context) error
}

// healthHandler answers 200 when the database is reachable and 503 otherwise.
func healthHandler(db pinger) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		if err := db.Ping(ctx); err != nil {
			slog.Warn("health check failed", "error", err)
			ctx.JSON(http.StatusServiceUnavailable, gin.H{"status": "unavailable"})
			return
		}
		ctx.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}

// requestLogger logs one line per request. Query strings and bodies are left out.
func requestLogger() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		start := time.Now()
		ctx.Next()
		slog.Info("request",
			"method", ctx.Request.Method,
			"path", ctx.Request.URL.Path,
			"status", ctx.Writer.Status(),
			"duration_ms", time.Since(start).Milliseconds(),
		)
	}
}
