// Demo data. Runs on the first start of an empty database (docker-entrypoint-initdb.d)
// and every night from the reset service, which replaces whatever visitors changed.
const database = db.getSiblingDB(process.env.AMBULANCE_API_MONGODB_DATABASE || 'harkap-ambulance');
const collection = database.getCollection(process.env.AMBULANCE_API_MONGODB_COLLECTION || 'ambulance');

const log = (id, deviceId, text, createdAt) => ({ id, text, deviceId, createdAt: new Date(createdAt) });

collection.deleteMany({});
collection.insertMany([
  {
    id: 'crp-01',
    name: 'CRP analyzátor',
    deviceId: '1-crp',
    warrantyUntil: new Date('2028-03-31T00:00:00Z'),
    price: 4500,
    department: { name: 'Interné', code: 'int' },
    logList: [
      log('crp-01-1', '1-crp', 'Zakúpenie zariadenia', '2025-03-12T09:00:00Z'),
      log('crp-01-2', '1-crp', 'Inštalácia a kalibrácia', '2025-03-20T13:30:00Z'),
    ],
  },
  {
    id: 'rtg-01',
    name: 'Röntgen',
    deviceId: '1-rtg',
    warrantyUntil: new Date('2030-06-30T00:00:00Z'),
    price: 152000,
    department: { name: 'Ortopedické', code: 'ort' },
    logList: [
      log('rtg-01-1', '1-rtg', 'Zakúpenie zariadenia', '2024-06-03T08:00:00Z'),
      log('rtg-01-2', '1-rtg', 'Ročná servisná prehliadka', '2025-06-10T10:15:00Z'),
    ],
  },
  {
    id: 'ekg-01',
    name: 'EKG prístroj',
    deviceId: '1-ekg',
    warrantyUntil: new Date('2027-01-15T00:00:00Z'),
    price: 3200,
    department: { name: 'Pediatrické', code: 'ped' },
    logList: [log('ekg-01-1', '1-ekg', 'Výmena elektród', '2025-11-04T14:00:00Z')],
  },
  {
    id: 'def-01',
    name: 'Defibrilátor',
    deviceId: '1-def',
    warrantyUntil: new Date('2029-09-01T00:00:00Z'),
    price: 12800,
    department: { name: 'Chirurgia', code: 'chir' },
    logList: [],
  },
  {
    id: 'inc-01',
    name: 'Inkubátor',
    deviceId: '1-inc',
    warrantyUntil: new Date('2031-02-28T00:00:00Z'),
    price: 27500,
    department: { name: 'Detské', code: 'dets' },
    logList: [log('inc-01-1', '1-inc', 'Kontrola teploty a vlhkosti', '2026-01-22T07:45:00Z')],
  },
]);
