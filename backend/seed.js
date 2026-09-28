require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const City = require('./models/City');
const Board = require('./models/Board');
const Timeslot = require('./models/Timeslot');
const Reservation = require('./models/Reservation');
const Impression = require('./models/Impression');

const DEMO_PASSWORD = 'Demo@123';
const SLOT_HOURS = 3;

const mulberry32 = (seed) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const rand = mulberry32(20260606);
const between = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

const usersData = [
  { name: 'Arun Rajendran', email: 'admin@truereach.lk', role: 'superadmin', city: null },
  { name: 'Kamala Sivanathan', email: 'kamala@truereach.lk', role: 'citymanager', city: 'Jaffna' },
  { name: 'Rajan Thambirajah', email: 'rajan@truereach.lk', role: 'citymanager', city: 'Nallur' },
  { name: 'Deepa Kanagaratnam', email: 'deepa@truereach.lk', role: 'citymanager', city: 'Point Pedro' },
  { name: 'Cargills Food City', email: 'cargills@truereach.lk', role: 'advertiser', city: null },
  { name: 'Lucky Lanka Stores', email: 'luckylanka@truereach.lk', role: 'advertiser', city: null },
  { name: 'Nelli Beach Resort', email: 'nelli@truereach.lk', role: 'advertiser', city: null },
  { name: 'Rio Ice Cream Parlour', email: 'rioicecream@truereach.lk', role: 'advertiser', city: null },
];

const citiesData = [
  { name: 'Jaffna', manager: 'kamala@truereach.lk' },
  { name: 'Nallur', manager: 'rajan@truereach.lk' },
  { name: 'Point Pedro', manager: 'deepa@truereach.lk' },
];

const boardsData = [
  { name: 'Clock Tower Billboard', location: 'Main Street, Jaffna', city: 'Jaffna', traffic: [18, 45, 8, 20] },
  { name: 'Hospital Road Hoarding', location: 'Hospital Road, Jaffna', city: 'Jaffna', traffic: [12, 32, 6, 16] },
  { name: 'Stanley Road Signage', location: 'Stanley Road, Jaffna', city: 'Jaffna', traffic: [10, 28, 5, 14] },
  { name: 'Nallur Kovil Road Billboard', location: 'Kovil Road, Nallur', city: 'Nallur', traffic: [20, 55, 10, 24] },
  { name: 'Power House Junction Signage', location: 'Power House Junction, Nallur', city: 'Nallur', traffic: [14, 38, 7, 18] },
  { name: 'Point Pedro Junction Hoarding', location: 'Point Pedro Junction, Point Pedro', city: 'Point Pedro', traffic: [8, 24, 4, 12] },
];

const advertisers = [
  { email: 'cargills@truereach.lk', slug: 'Cargills+Food+City' },
  { email: 'luckylanka@truereach.lk', slug: 'Lucky+Lanka+Stores' },
  { email: 'nelli@truereach.lk', slug: 'Nelli+Beach+Resort' },
  { email: 'rioicecream@truereach.lk', slug: 'Rio+Ice+Cream+Parlour' },
];

const creative = (slug) =>
  `https://placehold.co/1200x500/2554C7/FFFFFF.png?text=${slug}`;

const dateAt = (daysFromNow, hours = 9, minutes = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });

  const wipe = process.argv.includes('--fresh');
  const existing =
    (await User.estimatedDocumentCount()) +
    (await City.estimatedDocumentCount()) +
    (await Board.estimatedDocumentCount()) +
    (await Timeslot.estimatedDocumentCount()) +
    (await Reservation.estimatedDocumentCount()) +
    (await Impression.estimatedDocumentCount());

  if (existing > 0 && !wipe) {
    console.error(`Database already contains ${existing} documents.`);
    console.error('Re-run with:  node seed.js --fresh   to wipe and reseed.');
    process.exit(1);
  }

  if (wipe) {
    await Promise.all([
      User.deleteMany({}),
      City.deleteMany({}),
      Board.deleteMany({}),
      Timeslot.deleteMany({}),
      Reservation.deleteMany({}),
      Impression.deleteMany({}),
    ]);
    console.log('Cleared existing collections');
  }

  const users = new Map();
  for (const u of usersData) {
    const doc = await User.create({
      name: u.name,
      email: u.email,
      password: DEMO_PASSWORD,
      role: u.role,
    });
    users.set(u.email, doc);
    console.log(`  user: ${u.name} (${u.role})`);
  }

  const cities = new Map();
  for (const c of citiesData) {
    const manager = users.get(c.manager);
    const doc = await City.create({
      name: c.name,
      cityManager: manager._id,
      status: 'active',
    });
    cities.set(c.name, doc);
    console.log(`  city: ${c.name}`);
  }

  const boards = [];
  for (const b of boardsData) {
    const city = cities.get(b.city);
    const doc = await Board.create({
      name: b.name,
      location: b.location,
      city: city._id,
      status: 'active',
    });
    boards.push({ doc, traffic: b.traffic });
    console.log(`  board: ${b.name}`);
  }

  const pastDays = [-14, -10, -7, -3];
  const futureDays = [1, 2, 3, 5, 6];

  const slotStartHour = {
    [-14]: 9,
    [-10]: 10,
    [-7]: 15,
    [-3]: 9,
    [1]: 10,
    [2]: 14,
    [3]: 11,
    [5]: 9,
    [6]: 16,
  };

  const slotPlans = [
    { day: -14, status: 'booked', reservation: 'approved' },
    { day: -10, status: 'booked', reservation: 'approved' },
    { day: -7, status: 'booked', reservation: 'approved' },
    { day: -3, status: 'booked', reservation: 'approved' },
    { day: 1, status: 'available', reservation: null },
    { day: 2, status: 'booked', reservation: 'pending' },
    { day: 3, status: 'booked', reservation: 'approved' },
    { day: 5, status: 'booked', reservation: 'rejected' },
    { day: 6, status: 'available', reservation: null },
  ];

  let advertiserCursor = 0;

  for (const { doc: board, traffic } of boards) {
    const boardSlots = [];
    for (const plan of slotPlans) {
      const startHours = slotStartHour[plan.day];
      const slot = await Timeslot.create({
        board: board._id,
        startTime: dateAt(plan.day, startHours, 0),
        endTime: dateAt(plan.day, startHours + SLOT_HOURS, 0),
        status: plan.status,
      });

      let reservation = null;
      if (plan.reservation) {
        const advertiser = advertisers[advertiserCursor % advertisers.length];
        advertiserCursor++;
        if (plan.reservation === 'rejected') {
          await Timeslot.findByIdAndUpdate(slot._id, { status: 'available' });
        }
        reservation = await Reservation.create({
          advertiser: users.get(advertiser.email)._id,
          board: board._id,
          timeslot: slot._id,
          adCreativeUrl: creative(advertiser.slug),
          status: plan.reservation,
        });
      }
      boardSlots.push({ slot, plan, reservation });
    }

    const approvedPast = boardSlots.filter(
      (s) => s.plan.day < 0 && s.reservation
    );
    for (const entry of approvedPast) {
      const readings = 6;
      for (let i = 0; i < readings; i++) {
        const recorded = new Date(entry.slot.startTime.getTime() + (i + 1) * 30 * 60000);
        await Impression.create({
          board: board._id,
          timeslot: entry.slot._id,
          reservation: entry.reservation._id,
          people_count: between(traffic[0], traffic[1]),
          vehicle_count: between(traffic[2], traffic[3]),
          recorded_at: recorded,
        });
      }
    }
    console.log(`  slots+reservations+impressions: ${board.name}`);
  }

  const totals = {
    Users: await User.countDocuments(),
    Cities: await City.countDocuments(),
    Boards: await Board.countDocuments(),
    Timeslots: await Timeslot.countDocuments(),
    Reservations: await Reservation.countDocuments(),
    Impressions: await Impression.countDocuments(),
  };

  console.log('\n--- Seed complete ---');
  for (const [k, v] of Object.entries(totals)) {
    console.log(`${k}: ${v}`);
  }
  console.log('\nDemo logins (password: ' + DEMO_PASSWORD + ' for all):');
  console.log('  superadmin : admin@truereach.lk');
  console.log('  citymanager: kamala@truereach.lk (Jaffna)');
  console.log('  citymanager: rajan@truereach.lk (Nallur)');
  console.log('  citymanager: deepa@truereach.lk (Point Pedro)');
  console.log('  advertiser : cargills@truereach.lk');
  console.log('  advertiser : luckylanka@truereach.lk');
  console.log('  advertiser : nelli@truereach.lk');
  console.log('  advertiser : rioicecream@truereach.lk');

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
