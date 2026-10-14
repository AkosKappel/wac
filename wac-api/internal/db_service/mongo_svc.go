package db_service

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type DbService[DocType interface{}] interface {
	CreateDocument(ctx context.Context, id string, document *DocType) error
	FindDocument(ctx context.Context, id string) (*DocType, error)
	// UpdateDocument applies a MongoDB update (e.g. $set, $push) to the document with the given
	// id that also matches filter, and returns the updated document. Doing the change in one
	// atomic operation keeps concurrent requests from overwriting each other.
	UpdateDocument(ctx context.Context, id string, filter bson.D, update bson.D) (*DocType, error)
	DeleteDocument(ctx context.Context, id string) error
	Disconnect(ctx context.Context) error
	FindDocuments(ctx context.Context) ([]*DocType, error)
	Ping(ctx context.Context) error
}

var ErrNotFound = fmt.Errorf("document not found")
var ErrConflict = fmt.Errorf("conflict: document already exists")

type MongoServiceConfig struct {
	ServerHost string
	ServerPort int
	UserName   string
	Password   string
	DbName     string
	Collection string
	Timeout    time.Duration
}

type mongoSvc[DocType interface{}] struct {
	MongoServiceConfig
	client     atomic.Pointer[mongo.Client]
	clientLock sync.Mutex
}

func NewMongoService[DocType interface{}](config MongoServiceConfig) DbService[DocType] {
	enviro := func(name string, defaultValue string) string {
		if value, ok := os.LookupEnv(name); ok {
			return value
		}
		return defaultValue
	}

	svc := &mongoSvc[DocType]{}
	svc.MongoServiceConfig = config

	if svc.ServerHost == "" {
		svc.ServerHost = enviro("AMBULANCE_API_MONGODB_HOST", "localhost")
	}

	if svc.ServerPort == 0 {
		port := enviro("AMBULANCE_API_MONGODB_PORT", "27017")
		if port, err := strconv.Atoi(port); err == nil {
			svc.ServerPort = port
		} else {
			log.Printf("Invalid port value: %v", port)
			svc.ServerPort = 27017
		}
	}

	if svc.UserName == "" {
		svc.UserName = enviro("AMBULANCE_API_MONGODB_USERNAME", "root")
	}

	if svc.Password == "" {
		svc.Password = enviro("AMBULANCE_API_MONGODB_PASSWORD", "neUhaDnes")
	}

	if svc.DbName == "" {
		svc.DbName = enviro("AMBULANCE_API_MONGODB_DATABASE", "harkap-ambulance")
	}

	if svc.Collection == "" {
		svc.Collection = enviro("AMBULANCE_API_MONGODB_COLLECTION", "ambulance")
	}

	if svc.Timeout == 0 {
		seconds := enviro("AMBULANCE_API_MONGODB_TIMEOUT_SECONDS", "10")
		if seconds, err := strconv.Atoi(seconds); err == nil {
			svc.Timeout = time.Duration(seconds) * time.Second
		} else {
			log.Printf("Invalid timeout value: %v", seconds)
			svc.Timeout = 10 * time.Second
		}
	}

	log.Printf(
		"MongoDB config: //%v@%v:%v/%v/%v",
		svc.UserName,
		svc.ServerHost,
		svc.ServerPort,
		svc.DbName,
		svc.Collection,
	)
	return svc
}

func (this *mongoSvc[DocType]) connect(ctx context.Context) (*mongo.Client, error) {
	// optimistic check
	client := this.client.Load()
	if client != nil {
		return client, nil
	}

	this.clientLock.Lock()
	defer this.clientLock.Unlock()
	// pesimistic check
	client = this.client.Load()
	if client != nil {
		return client, nil
	}

	ctx, contextCancel := context.WithTimeout(ctx, this.Timeout)
	defer contextCancel()

	var uri = fmt.Sprintf("mongodb://%v:%v", this.ServerHost, this.ServerPort)
	log.Printf("Using URI: %s", uri)

	if len(this.UserName) != 0 {
		uri = fmt.Sprintf("mongodb://%v:%v@%v:%v", this.UserName, this.Password, this.ServerHost, this.ServerPort)
	}

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri).SetConnectTimeout(10*time.Second))
	if err != nil {
		return nil, err
	}
	// the unique index turns a duplicate id into an insert error instead of a second document
	_, err = client.Database(this.DbName).Collection(this.Collection).Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "id", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		log.Printf("Failed to create the unique index on id: %v", err)
	}
	this.client.Store(client)
	return client, nil
}

// Ping reports whether the database answers, for health checks.
func (this *mongoSvc[DocType]) Ping(ctx context.Context) error {
	ctx, contextCancel := context.WithTimeout(ctx, this.Timeout)
	defer contextCancel()
	client, err := this.connect(ctx)
	if err != nil {
		return err
	}
	return client.Ping(ctx, nil)
}

func (this *mongoSvc[DocType]) Disconnect(ctx context.Context) error {
	client := this.client.Load()

	if client != nil {
		this.clientLock.Lock()
		defer this.clientLock.Unlock()

		client = this.client.Load()
		defer this.client.Store(nil)
		if client != nil {
			if err := client.Disconnect(ctx); err != nil {
				return err
			}
		}
	}
	return nil
}

func (this *mongoSvc[DocType]) CreateDocument(ctx context.Context, id string, document *DocType) error {
	ctx, contextCancel := context.WithTimeout(ctx, this.Timeout)
	defer contextCancel()
	client, err := this.connect(ctx)
	if err != nil {
		return err
	}
	db := client.Database(this.DbName)
	collection := db.Collection(this.Collection)
	_, err = collection.InsertOne(ctx, document)
	if mongo.IsDuplicateKeyError(err) {
		return ErrConflict
	}
	return err
}

func (this *mongoSvc[DocType]) FindDocument(ctx context.Context, id string) (*DocType, error) {
	ctx, contextCancel := context.WithTimeout(ctx, this.Timeout)
	defer contextCancel()
	client, err := this.connect(ctx)
	if err != nil {
		return nil, err
	}
	db := client.Database(this.DbName)
	collection := db.Collection(this.Collection)
	result := collection.FindOne(ctx, bson.D{{Key: "id", Value: id}})
	switch result.Err() {
	case nil:
	case mongo.ErrNoDocuments:
		return nil, ErrNotFound
	default: // other errors - return them
		return nil, result.Err()
	}
	var document *DocType
	if err := result.Decode(&document); err != nil {
		return nil, err
	}
	return document, nil
}

func (this *mongoSvc[DocType]) FindDocuments(ctx context.Context) ([]*DocType, error) {
	ctx, contextCancel := context.WithTimeout(ctx, this.Timeout)
	defer contextCancel()
	client, err := this.connect(ctx)
	if err != nil {
		return nil, err
	}
	db := client.Database(this.DbName)
	collection := db.Collection(this.Collection)
	cursor, err := collection.Find(ctx, bson.D{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var documents []*DocType
	for cursor.Next(ctx) {
		var document DocType
		if err := cursor.Decode(&document); err != nil {
			return nil, err
		}
		documents = append(documents, &document)
	}
	return documents, nil
}

func (this *mongoSvc[DocType]) UpdateDocument(ctx context.Context, id string, filter bson.D, update bson.D) (*DocType, error) {
	ctx, contextCancel := context.WithTimeout(ctx, this.Timeout)
	defer contextCancel()
	client, err := this.connect(ctx)
	if err != nil {
		return nil, err
	}
	collection := client.Database(this.DbName).Collection(this.Collection)
	result := collection.FindOneAndUpdate(
		ctx,
		append(bson.D{{Key: "id", Value: id}}, filter...),
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	var document *DocType
	switch err := result.Decode(&document); err {
	case nil:
		return document, nil
	case mongo.ErrNoDocuments:
		return nil, ErrNotFound
	default:
		return nil, err
	}
}

func (this *mongoSvc[DocType]) DeleteDocument(ctx context.Context, id string) error {
	ctx, contextCancel := context.WithTimeout(ctx, this.Timeout)
	defer contextCancel()
	client, err := this.connect(ctx)
	if err != nil {
		return err
	}
	db := client.Database(this.DbName)
	collection := db.Collection(this.Collection)
	result, err := collection.DeleteOne(ctx, bson.D{{Key: "id", Value: id}})
	if err != nil {
		return err
	}
	if result.DeletedCount == 0 {
		return ErrNotFound
	}
	return nil
}
