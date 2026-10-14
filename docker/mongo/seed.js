// Demo data. Runs on the first start of an empty database (docker-entrypoint-initdb.d)
// and every night from the reset service, which replaces whatever visitors changed.
// Dates are relative to the reset day, so the warranties always show every state:
// expired, expiring within 90 days and long-running. IDs stay fixed for deep links.
const database = db.getSiblingDB(process.env.AMBULANCE_API_MONGODB_DATABASE || 'harkap-ambulance');
const collection = database.getCollection(process.env.AMBULANCE_API_MONGODB_COLLECTION || 'ambulance');

const DAY = 24 * 60 * 60 * 1000;
const today = new Date();
today.setUTCHours(0, 0, 0, 0);
const day = offset => new Date(today.getTime() + offset * DAY);

// same codes as the department list in the API (impl_ambulance_departments.go)
const departments = {
  aro: { name: 'ARO', code: 'aro' },
  chir: { name: 'Chirurgia', code: 'chir' },
  dets: { name: 'Detské', code: 'dets' },
  int: { name: 'Interné', code: 'int' },
  kar: { name: 'Kardiológia', code: 'kar' },
  lab: { name: 'Laboratórium', code: 'lab' },
  ort: { name: 'Ortopedické', code: 'ort' },
  ped: { name: 'Pediatrické', code: 'ped' },
  rad: { name: 'Rádiológia', code: 'rad' },
  urg: { name: 'Urgentný príjem', code: 'urg' },
};

const PURCHASE = 'Zakúpenie zariadenia';
const INSTALL = 'Inštalácia a uvedenie do prevádzky';
const TRAINING = 'Zaškolenie personálu';
const SAFETY = 'Bezpečnostno-technická kontrola (BTK)';
const SERVICE = 'Ročná servisná prehliadka';
const CALIBRATION = 'Kalibrácia podľa výrobcu';

// logs: [days ago, text], oldest first
const device = (id, name, deviceId, warrantyInDays, price, departmentCode, logs) => ({
  id,
  name,
  deviceId,
  warrantyUntil: day(warrantyInDays),
  price,
  department: departments[departmentCode],
  logList: logs.map(([daysAgo, text], i) => ({
    id: `${id}-${i + 1}`,
    text,
    deviceId,
    createdAt: new Date(day(-daysAgo).getTime() + (7 + ((i * 3) % 9)) * 60 * 60 * 1000),
  })),
});

collection.deleteMany({});
// the API also creates this index; here it protects the data before the API first connects
collection.createIndex({ id: 1 }, { unique: true });
collection.insertMany([
  device('mri-01', 'Magnetická rezonancia 1,5 T', 'RAD-MR-001', 1240, 1480000, 'rad', [
    [470, PURCHASE],
    [452, 'Inštalácia, tienenie miestnosti a preberacia skúška'],
    [450, TRAINING],
    [270, 'Doplnenie hélia'],
    [110, SERVICE],
    [12, 'Výmena chladiacej hlavy'],
  ]),
  device('ct-01', 'CT skener 128 rezov', 'RAD-CT-002', -34, 890000, 'rad', [
    [1860, PURCHASE],
    [1850, INSTALL],
    [1490, SERVICE],
    [1120, SERVICE],
    [760, 'Oprava: výmena röntgenky'],
    [390, SERVICE],
    [60, 'Meranie dávky a kontrola kvality obrazu'],
    [21, 'Ponuka na predĺženie záruky'],
  ]),
  device('rtg-01', 'Röntgen', '1-rtg', 1350, 152000, 'ort', [
    [860, PURCHASE],
    [850, 'Preberacia skúška a meranie dávky'],
    [495, SERVICE],
    [130, SERVICE],
  ]),
  device('usg-01', 'Ultrazvuk', 'RAD-US-014', 47, 68000, 'rad', [
    [1050, PURCHASE],
    [1045, INSTALL],
    [690, SAFETY],
    [320, 'Oprava: výmena konvexnej sondy'],
    [40, SAFETY],
  ]),
  device('ang-01', 'Angiografická linka', 'KAR-AN-001', 1520, 1150000, 'kar', [
    [320, PURCHASE],
    [290, INSTALL],
    [288, TRAINING],
    [95, 'Kalibrácia detektora'],
  ]),
  device('eko-01', 'Echokardiograf', 'KAR-EC-001', 19, 112000, 'kar', [
    [1080, PURCHASE],
    [1075, INSTALL],
    [720, SERVICE],
    [355, SERVICE],
    [9, 'Aktualizácia softvéru'],
  ]),
  device('hol-01', 'Holter EKG', 'KAR-HO-006', -16, 4300, 'kar', [
    [745, PURCHASE],
    [400, 'Výmena batériového krytu'],
    [30, SAFETY],
  ]),
  device('ekg-01', 'EKG prístroj', '1-ekg', 62, 3200, 'ped', [
    [700, PURCHASE],
    [340, 'Výmena elektród'],
    [33, 'Kontrola zvodov a tlačiarne'],
  ]),
  device('spi-01', 'Spirometer', 'PED-SP-002', 510, 3900, 'ped', [
    [220, PURCHASE],
    [215, TRAINING],
    [50, CALIBRATION],
  ]),
  device('inc-01', 'Inkubátor', '1-inc', 1600, 27500, 'dets', [
    [230, PURCHASE],
    [226, INSTALL],
    [120, 'Kontrola teploty a vlhkosti'],
    [14, 'Výmena vzduchového filtra'],
  ]),
  device('fot-01', 'Fototerapeutická lampa', 'DET-FT-003', 255, 5600, 'dets', [
    [480, PURCHASE],
    [300, 'Výmena LED modulu'],
    [110, SAFETY],
  ]),
  device('vnt-01', 'Pľúcny ventilátor', 'ARO-VE-003', 705, 38500, 'aro', [
    [390, PURCHASE],
    [385, INSTALL],
    [384, TRAINING],
    [200, 'Výmena kyslíkového senzora'],
    [25, SERVICE],
  ]),
  device('vnt-02', 'Transportný ventilátor', 'ARO-VE-007', -122, 21900, 'aro', [
    [1220, PURCHASE],
    [850, SERVICE],
    [480, SERVICE],
    [130, 'Oprava: netesnosť ventilu'],
    [118, SERVICE],
  ]),
  device('mon-01', 'Monitor vitálnych funkcií', 'ARO-MO-011', 81, 9800, 'aro', [
    [650, PURCHASE],
    [640, INSTALL],
    [280, CALIBRATION],
    [7, 'Výmena NIBP manžety'],
  ]),
  device('inf-01', 'Infúzna pumpa', 'ARO-IP-027', 410, 2400, 'aro', [
    [320, PURCHASE],
    [100, CALIBRATION],
  ]),
  device('def-01', 'Defibrilátor', '1-def', 1050, 12800, 'chir', [
    [300, PURCHASE],
    [299, TRAINING],
    [90, 'Test batérie a elektród'],
  ]),
  device('ane-01', 'Anestéziologický prístroj', 'CHI-AN-002', 300, 74000, 'chir', [
    [430, PURCHASE],
    [425, INSTALL],
    [424, TRAINING],
    [240, 'Výmena absorbéra CO2'],
    [65, SERVICE],
  ]),
  device('lap-01', 'Laparoskopická veža', 'CHI-LP-001', 66, 185000, 'chir', [
    [1030, PURCHASE],
    [1025, INSTALL],
    [670, SERVICE],
    [410, 'Oprava: výmena svetelného kábla'],
    [300, SERVICE],
    [18, 'Kontrola optiky'],
  ]),
  device('ele-01', 'Elektrokoagulačný prístroj', 'CHI-EK-004', -410, 14200, 'chir', [
    [1500, PURCHASE],
    [1130, SAFETY],
    [770, SAFETY],
    [400, SAFETY],
    [35, SAFETY],
  ]),
  device('art-01', 'Artroskopická zostava', 'ORT-AS-001', 820, 96000, 'ort', [
    [270, PURCHASE],
    [265, INSTALL],
    [40, 'Sterilizácia a kontrola nástrojov'],
  ]),
  device('crp-01', 'CRP analyzátor', '1-crp', 530, 4500, 'int', [
    [580, PURCHASE],
    [572, 'Inštalácia a kalibrácia'],
    [210, CALIBRATION],
    [16, 'Výmena reagenčnej kazety'],
  ]),
  device('dia-01', 'Dialyzačný prístroj', 'INT-DI-004', 41, 24500, 'int', [
    [1050, PURCHASE],
    [1040, INSTALL],
    [700, SERVICE],
    [520, 'Oprava: výmena čerpadla krvi'],
    [340, SERVICE],
    [11, 'Dezinfekcia a test vodného okruhu'],
  ]),
  device('bio-01', 'Biochemický analyzátor', 'LAB-BA-001', 1010, 210000, 'lab', [
    [350, PURCHASE],
    [340, INSTALL],
    [335, TRAINING],
    [170, CALIBRATION],
    [5, CALIBRATION],
  ]),
  device('hem-01', 'Hematologický analyzátor', 'LAB-HE-002', 74, 58000, 'lab', [
    [1020, PURCHASE],
    [1015, INSTALL],
    [660, SERVICE],
    [290, SERVICE],
    [28, 'Externá kontrola kvality'],
  ]),
  device('cen-01', 'Centrifúga', 'LAB-CF-007', -63, 6800, 'lab', [
    [790, PURCHASE],
    [430, 'Oprava: výmena tesnenia veka'],
  ]),
  device('oxi-01', 'Pulzný oximeter', 'URG-PO-005', -205, 320, 'urg', [
    [935, PURCHASE],
    [60, 'Výmena senzora'],
  ]),
  device('aed-01', 'Automatický externý defibrilátor', 'URG-AED-02', 905, 1900, 'urg', [
    [190, PURCHASE],
    [188, TRAINING],
    [8, 'Kontrola batérie a elektród'],
  ]),
]);
