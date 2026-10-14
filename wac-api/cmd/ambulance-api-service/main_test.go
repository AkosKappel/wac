package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

type fakePinger struct{ err error }

func (f fakePinger) Ping(context.Context) error { return f.err }

func TestHealthHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cases := []struct {
		name   string
		method string
		err    error
		want   int
	}{
		{"database up", http.MethodGet, nil, http.StatusOK},
		{"database up, HEAD", http.MethodHead, nil, http.StatusOK},
		{"database down", http.MethodGet, errors.New("no reachable servers"), http.StatusServiceUnavailable},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			engine := gin.New()
			handler := healthHandler(fakePinger{c.err})
			engine.GET("/api/health", handler)
			engine.HEAD("/api/health", handler)

			recorder := httptest.NewRecorder()
			engine.ServeHTTP(recorder, httptest.NewRequest(c.method, "/api/health", nil))

			if recorder.Code != c.want {
				t.Errorf("got %d, want %d", recorder.Code, c.want)
			}
		})
	}
}

func TestRequestLogger(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var out bytes.Buffer
	previous := slog.Default()
	slog.SetDefault(slog.New(slog.NewJSONHandler(&out, nil)))
	t.Cleanup(func() { slog.SetDefault(previous) })

	engine := gin.New()
	engine.Use(requestLogger())
	engine.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/missing?secret=1", nil))

	var line map[string]any
	if err := json.Unmarshal(out.Bytes(), &line); err != nil {
		t.Fatalf("not one JSON line: %q", out.String())
	}
	if line["msg"] != "request" || line["path"] != "/missing" || line["status"] != float64(404) {
		t.Errorf("unexpected log line: %v", line)
	}
}
