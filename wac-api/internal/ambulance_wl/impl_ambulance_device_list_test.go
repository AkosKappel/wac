package ambulance_wl

import (
	"context"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/AkosKappel/wac-api/internal/db_service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
)

type AmbulanceDlSuite struct {
	suite.Suite
	dbServiceMock *DbServiceMock[DeviceListEntry]
}

func TestAmbulanceDlSuite(t *testing.T) {
	suite.Run(t, new(AmbulanceDlSuite))
}

type DbServiceMock[DocType interface{}] struct {
	mock.Mock
}

func (this *DbServiceMock[DocType]) FindDocuments(ctx context.Context) ([]*DocType, error) {
	args := this.Called(ctx)
	return args.Get(0).([]*DocType), args.Error(1)
}

func (this *DbServiceMock[DocType]) CreateDocument(ctx context.Context, id string, document *DocType) error {
	args := this.Called(ctx, id, document)
	return args.Error(0)
}

func (this *DbServiceMock[DocType]) FindDocument(ctx context.Context, id string) (*DocType, error) {
	args := this.Called(ctx, id)
	return args.Get(0).(*DocType), args.Error(1)
}

func (this *DbServiceMock[DocType]) UpdateDocument(ctx context.Context, id string, document *DocType) error {
	args := this.Called(ctx, id, document)
	return args.Error(0)
}

func (this *DbServiceMock[DocType]) DeleteDocument(ctx context.Context, id string) error {
	args := this.Called(ctx, id)
	return args.Error(0)
}

func (this *DbServiceMock[DocType]) Disconnect(ctx context.Context) error {
	args := this.Called(ctx)
	return args.Error(0)
}

func (suite *AmbulanceDlSuite) SetupTest() {
	suite.dbServiceMock = &DbServiceMock[DeviceListEntry]{}

	// Compile time Assert that the mock is of type db_service.DbService[DeviceListEntry]
	var _ db_service.DbService[DeviceListEntry] = suite.dbServiceMock
}

func (suite *AmbulanceDlSuite) Test_GetDeviceListEntry() {
	// ARRANGE
	suite.dbServiceMock.
		On("FindDocument", mock.Anything, mock.Anything).
		Return(
			&DeviceListEntry{
				Id:            "test-device",
				Name:          "test-device-name",
				DeviceId:      "test-device-id",
				WarrantyUntil: time.Date(2021, 9, 1, 0, 0, 0, 0, time.UTC),
				Price:         42.0,
				LogList:       nil,
				Department: Department{
					Name: "test-department-name",
					Code: "test-department-code",
				},
			},
			nil,
		)

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("db_service", suite.dbServiceMock)
	ctx.Params = []gin.Param{
		{Key: "entryId", Value: "test-device"},
	}
	ctx.Request = httptest.NewRequest("GET", "/device-list/entries/test-device", nil)

	sut := implAmbulanceDeviceListAPI{}

	// ACT
	sut.GetDeviceListEntry(ctx)

	// ASSERT
	suite.Equal(200, recorder.Code)
	suite.Contains(recorder.Body.String(), "test-device-name")
}

func (suite *AmbulanceDlSuite) Test_GetDeviceListEntry_NotFound() {
	// ARRANGE
	suite.dbServiceMock.
		On("FindDocument", mock.Anything, mock.Anything).
		Return(
			&DeviceListEntry{},
			db_service.ErrNotFound,
		)

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("db_service", suite.dbServiceMock)
	ctx.Params = []gin.Param{
		{Key: "entryId", Value: "test-device"},
	}
	ctx.Request = httptest.NewRequest("GET", "/device-list/entries/unknown-device", nil)

	sut := implAmbulanceDeviceListAPI{}

	// ACT
	sut.GetDeviceListEntry(ctx)

	// ASSERT
	suite.Equal(404, recorder.Code)
}

func (suite *AmbulanceDlSuite) Test_GetDeviceListEntries() {
	// ARRANGE
	suite.dbServiceMock.
		On("FindDocuments", mock.Anything).
		Return(
			[]*DeviceListEntry{
				{
					Id:            "test-device",
					Name:          "test-device-name",
					DeviceId:      "test-device-id",
					WarrantyUntil: time.Date(2021, 9, 1, 0, 0, 0, 0, time.UTC),
					Price:         42.0,
					LogList:       nil,
					Department: Department{
						Name: "test-department-name",
						Code: "test-department-code",
					},
				},
			},
			nil,
		)

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("db_service", suite.dbServiceMock)
	ctx.Request = httptest.NewRequest("GET", "/device-list/entries", nil)

	sut := implAmbulanceDeviceListAPI{}

	// ACT
	sut.GetDeviceListEntries(ctx)

	// ASSERT
	suite.Equal(200, recorder.Code)
	suite.Contains(recorder.Body.String(), "test-device-name")
}

func (suite *AmbulanceDlSuite) Test_GetDeviceListEntries_Empty() {
	// ARRANGE
	suite.dbServiceMock.
		On("FindDocuments", mock.Anything).
		Return(
			[]*DeviceListEntry{},
			nil,
		)

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("db_service", suite.dbServiceMock)
	ctx.Request = httptest.NewRequest("GET", "/device-list/entries", nil)

	sut := implAmbulanceDeviceListAPI{}

	// ACT
	sut.GetDeviceListEntries(ctx)

	// ASSERT
	suite.Equal(200, recorder.Code)
	suite.Contains(recorder.Body.String(), "[]")
}

func (suite *AmbulanceDlSuite) Test_CreateDeviceListEntry() {
	// ARRANGE
	suite.dbServiceMock.
		On("CreateDocument", mock.Anything, mock.Anything, mock.Anything).
		Return(nil)

	json := `{
		"id": "test-device",
		"name": "test-device-name",
		"deviceId": "test-device-id",
		"warrantyUntil": "2021-09-01T00:00:00Z",
		"price": 42.0,
		"logList": null,
		"department": {
			"name": "test-department-name",
			"code": "test-department-code"
		}
	}`

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("db_service", suite.dbServiceMock)
	ctx.Request = httptest.NewRequest("POST", "/device-list/entries", strings.NewReader(json))

	sut := implAmbulanceDeviceListAPI{}

	// ACT
	sut.CreateDeviceListEntry(ctx)

	// ASSERT
	suite.Equal(201, recorder.Code)
}

func (suite *AmbulanceDlSuite) Test_UpdateDeviceListEntry() {
	// ARRANGE
	suite.dbServiceMock.
		On("UpdateDocument", mock.Anything, mock.Anything, mock.Anything).
		Return(nil)

	json := `{
		"id": "test-device",
		"name": "test-device-name-updated",
		"deviceId": "test-device-id-updated",
		"warrantyUntil": "2021-09-01T00:00:00Z",
		"price": 37.0,
		"logList": null,
		"department": {
			"name": "test-department-name-updated",
			"code": "test-department-code-updated"
		}
	}`

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("db_service", suite.dbServiceMock)
	ctx.Request = httptest.NewRequest("PUT", "/device-list/entries/test-device", strings.NewReader(json))

	sut := implAmbulanceDeviceListAPI{}

	// ACT
	sut.UpdateDeviceListEntry(ctx)

	// ASSERT
	suite.Equal(200, recorder.Code)
	suite.Contains(recorder.Body.String(), "test-device-name-updated")
}

func (suite *AmbulanceDlSuite) Test_UpdateDeviceListEntry_NotFound() {
	// ARRANGE
	suite.dbServiceMock.
		On("UpdateDocument", mock.Anything, mock.Anything, mock.Anything).
		Return(db_service.ErrNotFound)

	json := `{
		"id": "test-device",
		"name": "test-device-name-updated",
		"deviceId": "test-device-id-updated",
		"warrantyUntil": "2021-09-01T00:00:00Z",
		"price": 37.0,
		"logList": null,
		"department": {
			"name": "test-department-name-updated",
			"code": "test-department-code-updated"
		}
	}`

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("db_service", suite.dbServiceMock)
	ctx.Request = httptest.NewRequest("PUT", "/device-list/entries/unknown-device", strings.NewReader(json))

	sut := implAmbulanceDeviceListAPI{}

	// ACT
	sut.UpdateDeviceListEntry(ctx)

	// ASSERT
	suite.Equal(404, recorder.Code)
}

func (suite *AmbulanceDlSuite) Test_DeleteDeviceListEntry() {
	// ARRANGE
	suite.dbServiceMock.
		On("DeleteDocument", mock.Anything, mock.Anything).
		Return(nil)

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("db_service", suite.dbServiceMock)
	ctx.Request = httptest.NewRequest("DELETE", "/device-list/entries/test-device", nil)

	sut := implAmbulanceDeviceListAPI{}

	// ACT
	sut.DeleteDeviceListEntry(ctx)

	// ASSERT
	suite.Equal(204, recorder.Code)
}

func (suite *AmbulanceDlSuite) Test_DeleteDeviceListEntry_NotFound() {
	// ARRANGE
	suite.dbServiceMock.
		On("DeleteDocument", mock.Anything, mock.Anything).
		Return(db_service.ErrNotFound)

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Set("db_service", suite.dbServiceMock)
	ctx.Request = httptest.NewRequest("DELETE", "/device-list/entries/unknown-device", nil)

	sut := implAmbulanceDeviceListAPI{}

	// ACT
	sut.DeleteDeviceListEntry(ctx)

	// ASSERT
	suite.Equal(404, recorder.Code)
}
