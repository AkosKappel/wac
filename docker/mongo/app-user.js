// The API and the reset job connect as this user, with readWrite on the app database only.
// Runs as root on the first start of an empty volume (docker-entrypoint-initdb.d); on an
// existing volume run it once by hand (see infra/apps/ambulance/operations.md). Rerunning
// it updates the password and roles.
const username = process.env.AMBULANCE_API_MONGODB_USERNAME;
const password = process.env.AMBULANCE_API_MONGODB_PASSWORD;
const roles = [{ role: 'readWrite', db: process.env.AMBULANCE_API_MONGODB_DATABASE || 'harkap-ambulance' }];

if (!username || !password) {
  throw new Error('AMBULANCE_API_MONGODB_USERNAME and AMBULANCE_API_MONGODB_PASSWORD must be set');
}
if (username === process.env.MONGO_INITDB_ROOT_USERNAME) {
  throw new Error('the app user must not be the root user');
}

const admin = db.getSiblingDB('admin');
if (admin.getUser(username)) {
  admin.updateUser(username, { pwd: password, roles });
  print(`updated user ${username}`);
} else {
  admin.createUser({ user: username, pwd: password, roles });
  print(`created user ${username}`);
}
