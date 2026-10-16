package ambulance_wl

import (
	"context"
	"errors"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/AkosKappel/wac/wac-api/internal/db_service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
	"go.mongodb.org/mongo-driver/bson"
)

type AmbulanceDlSuite struct {
	suite.Suite
	dbServiceMock   *DbServiceMock[DeviceListEntry]
	departmentsMock *DbServiceMock[Department]
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
	document, _ := args.Get(0).(*DocType)
	return document, args.Error(1)
}

func (this *DbServiceMock[DocType]) CountDocuments(ctx context.Context, filter bson.D) (int64, error) {
	args := this.Called(ctx, filter)
	return args.Get(0).(int64), args.Error(1)
}

func (this *DbServiceMock[DocType]) UpdateDocuments(ctx context.Context, filter bson.D, update bson.D) error {
	args := this.Called(ctx, filter, update)
	return args.Error(0)
}

func (this *DbServiceMock[DocType]) Aggregate(ctx context.Context, pipeline any, results any) error {
	args := this.Called(ctx, pipeline, results)
	return args.Error(0)
}

func (this *DbServiceMock[DocType]) UpdateDocument(ctx context.Context, id string, filter bson.D, update bson.D) (*DocType, error) {
	args := this.Called(ctx, id, filter, update)
	document, _ := args.Get(0).(*DocType)
	return document, args.Error(1)
}

func (this *DbServiceMock[DocType]) DeleteDocument(ctx context.Context, id string) error {
	args := this.Called(ctx, id)
	return args.Error(0)
}

func (this *DbServiceMock[DocType]) Disconnect(ctx context.Context) error {
	args := this.Called(ctx)
	return args.Error(0)
}

func (this *DbServiceMock[DocType]) Ping(ctx context.Context) error {
	args := this.Called(ctx)
	return args.Error(0)
}

func (suite *AmbulanceDlSuite) SetupTest() {
	suite.dbServiceMock = &DbServiceMock[DeviceListEntry]{}
	suite.departmentsMock = &DbServiceMock[Department]{}
	suite.departmentsMock.
		On("FindDocument", mock.Anything, mock.Anything).
		Return(&Department{Code: "test-department-code", Name: "Stored department"}, nil)

	// Compile time Assert that the mock is of type db_service.DbService[DeviceListEntry]
	var _ db_service.DbService[DeviceListEntry] = suite.dbServiceMock
}

func (suite *AmbulanceDlSuite) deps() Dependencies {
	return Dependencies{DB: suite.dbServiceMock, Departments: suite.departmentsMock}
}

// storedDevice makes the update handlers find the device before changing it.
func (suite *AmbulanceDlSuite) storedDevice() {
	suite.dbServiceMock.
		On("FindDocument", mock.Anything, "test-device").
		Return(&DeviceListEntry{Id: "test-device", Name: "old name", Price: 37, Department: Department{Code: "test-department-code", Name: "Stored department"}}, nil)
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
	ctx.Params = []gin.Param{
		{Key: "entryId", Value: "test-device"},
	}
	ctx.Request = httptest.NewRequest("GET", "/device-list/entries/test-device", nil)

	sut := implAmbulanceDeviceListAPI{suite.deps()}

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
	ctx.Params = []gin.Param{
		{Key: "entryId", Value: "test-device"},
	}
	ctx.Request = httptest.NewRequest("GET", "/device-list/entries/unknown-device", nil)

	sut := implAmbulanceDeviceListAPI{suite.deps()}

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
	ctx.Request = httptest.NewRequest("GET", "/device-list/entries", nil)

	sut := implAmbulanceDeviceListAPI{suite.deps()}

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
	ctx.Request = httptest.NewRequest("GET", "/device-list/entries", nil)

	sut := implAmbulanceDeviceListAPI{suite.deps()}

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
	ctx.Request = httptest.NewRequest("POST", "/device-list/entries", strings.NewReader(json))

	sut := implAmbulanceDeviceListAPI{suite.deps()}

	// ACT
	sut.CreateDeviceListEntry(ctx)

	// ASSERT
	suite.Equal(201, recorder.Code)
}

func (suite *AmbulanceDlSuite) Test_UpdateDeviceListEntry() {
	// ARRANGE
	suite.storedDevice()
	suite.dbServiceMock.
		On("UpdateDocument", mock.Anything, "test-device", mock.Anything, mock.Anything).
		Return(&DeviceListEntry{Id: "test-device", Name: "test-device-name-updated"}, nil)

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
	ctx.Params = []gin.Param{{Key: "entryId", Value: "test-device"}}
	ctx.Request = httptest.NewRequest("PUT", "/device-list/entries/test-device", strings.NewReader(json))

	sut := implAmbulanceDeviceListAPI{suite.deps()}

	// ACT
	sut.UpdateDeviceListEntry(ctx)

	// ASSERT
	suite.Equal(200, recorder.Code)
	suite.Contains(recorder.Body.String(), "test-device-name-updated")
}

func (suite *AmbulanceDlSuite) Test_UpdateDeviceListEntry_NotFound() {
	// ARRANGE
	suite.dbServiceMock.
		On("FindDocument", mock.Anything, mock.Anything).
		Return(nil, db_service.ErrNotFound)

	json := `{
		"id": "unknown-device",
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
	ctx.Params = []gin.Param{{Key: "entryId", Value: "unknown-device"}}
	ctx.Request = httptest.NewRequest("PUT", "/device-list/entries/unknown-device", strings.NewReader(json))

	sut := implAmbulanceDeviceListAPI{suite.deps()}

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
	ctx.Request = httptest.NewRequest("DELETE", "/device-list/entries/test-device", nil)

	sut := implAmbulanceDeviceListAPI{suite.deps()}

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
	ctx.Request = httptest.NewRequest("DELETE", "/device-list/entries/unknown-device", nil)

	sut := implAmbulanceDeviceListAPI{suite.deps()}

	// ACT
	sut.DeleteDeviceListEntry(ctx)

	// ASSERT
	suite.Equal(404, recorder.Code)
}

func (suite *AmbulanceDlSuite) Test_UpdateDeviceListEntry_IdMismatch() {
	// ARRANGE
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Params = []gin.Param{{Key: "entryId", Value: "test-device"}}
	ctx.Request = httptest.NewRequest("PUT", "/device-list/entries/test-device", strings.NewReader(`{"id": "other-device", "name": "x", "deviceId": "x"}`))

	sut := implAmbulanceDeviceListAPI{suite.deps()}

	// ACT
	sut.UpdateDeviceListEntry(ctx)

	// ASSERT
	suite.Equal(400, recorder.Code)
	suite.dbServiceMock.AssertNotCalled(suite.T(), "UpdateDocument")
}

func (suite *AmbulanceDlSuite) Test_UpdateDeviceListEntry_KeepsLogs() {
	// ARRANGE
	suite.storedDevice()
	var update bson.D
	suite.dbServiceMock.
		On("UpdateDocument", mock.Anything, "test-device", mock.Anything, mock.Anything).
		Run(func(args mock.Arguments) { update = args.Get(3).(bson.D) }).
		Return(&DeviceListEntry{Id: "test-device"}, nil)

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Params = []gin.Param{{Key: "entryId", Value: "test-device"}}
	ctx.Request = httptest.NewRequest("PUT", "/device-list/entries/test-device", strings.NewReader(`{"name": "x", "deviceId": "x", "warrantyUntil": "2030-01-01T00:00:00Z", "logList": [], "department": {"code": "test-department-code"}}`))

	sut := implAmbulanceDeviceListAPI{suite.deps()}

	// ACT
	sut.UpdateDeviceListEntry(ctx)

	// ASSERT
	suite.Equal(200, recorder.Code)
	set := update.Map()["$set"].(bson.D).Map()
	suite.NotContains(set, "logList")
	suite.NotContains(set, "id")
}

func (suite *AmbulanceDlSuite) Test_GetDeviceListEntries_HidesDatabaseError() {
	// ARRANGE
	suite.dbServiceMock.
		On("FindDocuments", mock.Anything).
		Return([]*DeviceListEntry(nil), errors.New("server selection error: db1.internal:27017"))

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest("GET", "/device-list/entries", nil)

	sut := implAmbulanceDeviceListAPI{suite.deps()}

	// ACT
	sut.GetDeviceListEntries(ctx)

	// ASSERT
	suite.Equal(502, recorder.Code)
	suite.NotContains(recorder.Body.String(), "db1.internal")
}

func (suite *AmbulanceDlSuite) Test_CreateDeviceListEntry_UnknownDepartment() {
	// ARRANGE
	departments := &DbServiceMock[Department]{}
	departments.On("FindDocument", mock.Anything, "nope").Return(nil, db_service.ErrNotFound)

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest("POST", "/device-list/entries", strings.NewReader(`{"name": "x", "deviceId": "x", "warrantyUntil": "2030-01-01T00:00:00Z", "department": {"code": "nope"}}`))

	sut := implAmbulanceDeviceListAPI{Dependencies{DB: suite.dbServiceMock, Departments: departments}}

	// ACT
	sut.CreateDeviceListEntry(ctx)

	// ASSERT
	suite.Equal(400, recorder.Code)
	suite.Contains(recorder.Body.String(), "Unknown department")
	suite.dbServiceMock.AssertNotCalled(suite.T(), "CreateDocument")
}

func (suite *AmbulanceDlSuite) Test_UpdateDeviceListEntry_RecordsChanges() {
	// ARRANGE
	suite.storedDevice()
	var update bson.D
	suite.dbServiceMock.
		On("UpdateDocument", mock.Anything, "test-device", mock.Anything, mock.Anything).
		Run(func(args mock.Arguments) { update = args.Get(3).(bson.D) }).
		Return(&DeviceListEntry{Id: "test-device"}, nil)

	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Params = []gin.Param{{Key: "entryId", Value: "test-device"}}
	// the name stays; device ID, warranty and price change; the stored department name wins
	ctx.Request = httptest.NewRequest("PUT", "/device-list/entries/test-device", strings.NewReader(`{"name": "old name", "deviceId": "1", "warrantyUntil": "2030-01-01T00:00:00Z", "price": 40, "department": {"code": "test-department-code", "name": "typed by the client"}}`))

	sut := implAmbulanceDeviceListAPI{suite.deps()}

	// ACT
	sut.UpdateDeviceListEntry(ctx)

	// ASSERT
	suite.Equal(200, recorder.Code)
	push := update.Map()["$push"].(bson.D).Map()["history"].(bson.D).Map()
	record := push["$each"].([]ChangeRecord)[0]
	fields := []string{}
	for _, change := range record.Changes {
		fields = append(fields, change.Field)
	}
	suite.Equal([]string{"deviceId", "warrantyUntil", "price"}, fields)
	suite.Equal(-maxHistory, push["$slice"])
	set := update.Map()["$set"].(bson.D).Map()
	suite.Equal(Department{Code: "test-department-code", Name: "Stored department"}, set["department"])
}
