const mongoHost = process.env.AMBULANCE_API_MONGODB_HOST;
const mongoPort = process.env.AMBULANCE_API_MONGODB_PORT;

const mongoUser = process.env.AMBULANCE_API_MONGODB_USERNAME;
const mongoPassword = process.env.AMBULANCE_API_MONGODB_PASSWORD;

const database = process.env.AMBULANCE_API_MONGODB_DATABASE;
const collection = process.env.AMBULANCE_API_MONGODB_COLLECTION;

const retrySeconds = parseInt(process.env.RETRY_CONNECTION_SECONDS || '5') || 5;

// try to connect to mongoDB until it is not available
let connection;
while (true) {
  try {
    connection = Mongo(`mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}`);
    break;
  } catch (exception) {
    print(`Cannot connect to mongoDB: ${exception}`);
    print(`Will retry after ${retrySeconds} seconds`);
    sleep(retrySeconds * 1000);
  }
}

// if database and collection exists, exit with success - already initialized
const databases = connection.getDBNames();
if (databases.includes(database)) {
  const dbInstance = connection.getDB(database);
  collections = dbInstance.getCollectionNames();
  if (collections.includes(collection)) {
    print(`Collection '${collection}' already exists in database '${database}'`);
    process.exit(0);
  }
}

// initialize
// create database and collection
const db = connection.getDB(database);
db.createCollection(collection);

// create indexes
db[collection].createIndex({ id: 1 });

//insert sample data
let result = db[collection].insertMany([
  {
    id: 'x321ab3',
    name: 'CRP',
    deviceId: '1-crp',
    warrantyUntil: new Date('2038-12-24T10:05:00.000Z'),
    price: 4.5,
    logList: [
      {
        id: 1,
        text: 'zakupenie zariadenia',
        deviceId: '1-crp',
        createdAt: new Date('2020-12-24T10:05:00.000Z'),
      },
      {
        id: 2,
        text: 'nainstalovanie zariadenia',
        deviceId: '1-crp',
        createdAt: new Date('2020-12-25T10:05:00.000Z'),
      },
      {
        id: 3,
        text: 'testovanie zariadenia',
        deviceId: '1-crp',
        createdAt: new Date('2021-12-30T10:05:00.000Z'),
      },
    ],
  },
  {
    id: 'c421fu6',
    name: 'EKG',
    deviceId: '2-ekg',
    warrantyUntil: new Date('2039-01-24T10:05:00.000Z'),
    price: 1059.99,
    logList: [],
  },
]);

if (result.writeError) {
  console.error(result);
  print(`Error when writing the data: ${result.errmsg}`);
}

// exit with success
process.exit(0);
