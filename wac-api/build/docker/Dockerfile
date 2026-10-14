FROM golang:1.27 AS build

WORKDIR /app

# download dependencies - low frequency of changes
COPY go.mod go.sum ./
RUN go mod download

# copy sources - higher frequency of changes
# the server stubs in internal/ are generated from the spec by scripts/generate-api.sh
COPY api/ api/
COPY internal/ internal/
COPY cmd/ cmd/

# ensure tests are passing
RUN go test ./...

# create executable - ambulance-webapi-srv
# we want to use scratch image so setting
# the build options in the way that will link all dependencies statically
RUN CGO_ENABLED=0 GOOS=linux \
    go build \
    -ldflags="-w -s" \
    -installsuffix 'static' \
    -o ./ambulance-webapi-srv ./cmd/ambulance-api-service

############################################

FROM scratch

# see https://github.com/opencontainers/image-spec/blob/main/annotations.md for details
LABEL org.opencontainers.image.authors="Ákos Kappel"
LABEL org.opencontainers.image.title="Ambulance Devices API"
LABEL org.opencontainers.image.description="REST API for the medical devices of hospital departments and their operations logs"

# list all variables and their default values for clarity;
# AMBULANCE_API_MONGODB_PASSWORD has no default and must be set at runtime
ENV AMBULANCE_API_ENVIRONMENT=production
ENV AMBULANCE_API_PORT=8080
ENV AMBULANCE_API_MONGODB_HOST=mongo
ENV AMBULANCE_API_MONGODB_PORT=27017
ENV AMBULANCE_API_MONGODB_DATABASE=harkap-ambulance
ENV AMBULANCE_API_MONGODB_COLLECTION=ambulance
ENV AMBULANCE_API_MONGODB_USERNAME=root
ENV AMBULANCE_API_MONGODB_TIMEOUT_SECONDS=5

COPY --from=build /app/ambulance-webapi-srv ./

# scratch has no users; run as nobody instead of root
USER 65534:65534

# Actual port may be changed during runtime
# Default using for the simple case scenario
EXPOSE 8080
ENTRYPOINT ["./ambulance-webapi-srv"]