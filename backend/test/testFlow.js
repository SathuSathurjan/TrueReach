// backend/test/testFlow.js
// Requires Node 18+ (built-in fetch). Run with: node test/testFlow.js
// Make sure your server is already running (npm run dev) before running this.

const BASE = 'http://localhost:5000/api';
let pass = 0;
let fail = 0;

function check(label, condition, extra = '') {
  if (condition) {
    console.log(`✅ PASS: ${label}`);
    pass++;
  } else {
    console.log(`❌ FAIL: ${label} ${extra}`);
    fail++;
  }
}

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (_) {}
  return { status: res.status, data };
}

const rand = () => Math.floor(Math.random() * 1000000);

(async () => {
  console.log('---TrueReach Backend Test Flow ---\n');

  const suffix = rand();
  const superadminEmail = `superadmin${suffix}truereach.com`;
  const managerEmail = `manager${suffix}truereach.com`;
  const advertiserEmail = `advertiser${suffix}truereach.com`;
  const advertiser2Email = `advertiser2_${suffix}truereach.com`;

  // 1. Register three roles
  const r1 = await req('POST', '/auth/register', { name: 'Super Admin', email: superadminEmail, password: '123456', role: 'superadmin' });
  check('Register superadmin', r1.status === 201, JSON.stringify(r1.data));
  const superToken = r1.data?.token;

  const r2 = await req('POST', '/auth/register', { name: 'City Manager', email: managerEmail, password: '123456', role: 'citymanager' });
  check('Register citymanager', r2.status === 201, JSON.stringify(r2.data));
  const managerToken = r2.data?.token;
  const managerId = r2.data?._id;

  const r3 = await req('POST', '/auth/register', { name: 'Advertiser One', email: advertiserEmail, password: '123456', role: 'advertiser' });
  check('Register advertiser', r3.status === 201, JSON.stringify(r3.data));
  const advertiserToken = r3.data?.token;

  const r4 = await req('POST', '/auth/register', { name: 'Advertiser Two', email: advertiser2Email, password: '123456', role: 'advertiser' });
  const advertiser2Token = r4.data?.token;

  // 2. Duplicate registration should fail
  const rDup = await req('POST', '/auth/register', { name: 'Dup', email: superadminEmail, password: '123456', role: 'superadmin' });
  check('Duplicate email registration rejected', rDup.status === 400);

  // 3. Superadmin creates a city
  const cityRes = await req('POST', '/cities', { name: `TestCity${suffix}` }, superToken);
  check('Superadmin creates city', cityRes.status === 201, JSON.stringify(cityRes.data));
  const cityId = cityRes.data?._id;

  // 4. Advertiser CANNOT create a city
  const cityForbidden = await req('POST', '/cities', { name: `HackCity${suffix}` }, advertiserToken);
  check('Advertiser blocked from creating city', cityForbidden.status === 403);

  // 5. Superadmin assigns city manager to the city
  const assignRes = await req('PUT', `/cities/${cityId}`, { cityManager: managerId }, superToken);
  check('Assign city manager to city', assignRes.status === 200 && assignRes.data.cityManager === managerId);

  // 6. City manager creates a board in their city
  const boardRes = await req('POST', '/boards', { name: 'Test Billboard', location: 'Main St', city: cityId }, managerToken);
  check('City manager creates board', boardRes.status === 201, JSON.stringify(boardRes.data));
  const boardId = boardRes.data?._id;

  // 7. City manager creates a timeslot
  const start = new Date(Date.now() + 3600 * 1000).toISOString();
  const end = new Date(Date.now() + 7200 * 1000).toISOString();
  const slotRes = await req('POST', '/timeslots', { board: boardId, startTime: start, endTime: end }, managerToken);
  check('City manager creates timeslot', slotRes.status === 201, JSON.stringify(slotRes.data));
  const timeslotId = slotRes.data?._id;

  // 8. Overlapping timeslot should be rejected
  const overlapStart = new Date(Date.now() + 5400 * 1000).toISOString(); // overlaps
  const overlapEnd = new Date(Date.now() + 9000 * 1000).toISOString();
  const overlapRes = await req('POST', '/timeslots', { board: boardId, startTime: overlapStart, endTime: overlapEnd }, managerToken);
  check('Overlapping timeslot rejected', overlapRes.status === 409);

  // 9. Advertiser books the timeslot
  const bookRes = await req('POST', '/reservations', { timeslot: timeslotId, adCreativeUrl: 'https://example.com/ad.jpg' }, advertiserToken);
  check('Advertiser books timeslot', bookRes.status === 201, JSON.stringify(bookRes.data));
  const reservationId = bookRes.data?._id;

  // 10. Second advertiser tries to book the SAME timeslot -> should fail (conflict-free booking)
  const doubleBookRes = await req('POST', '/reservations', { timeslot: timeslotId }, advertiser2Token);
  check('Double-booking prevented', doubleBookRes.status === 409, JSON.stringify(doubleBookRes.data));

  // 11. Advertiser tries to approve their own reservation -> should be forbidden
  const selfApprove = await req('PUT', `/reservations/${reservationId}/approve`, {}, advertiserToken);
  check('Advertiser blocked from approving own reservation', selfApprove.status === 403);

  // 12. City manager approves the reservation
  const approveRes = await req('PUT', `/reservations/${reservationId}/approve`, {}, managerToken);
  check('City manager approves reservation', approveRes.status === 200 && approveRes.data.status === 'approved');

  // 13. City manager logs an impression (simulating tracker.py)
  const impressionRes = await req('POST', '/impressions', {
    board_id: boardId,
    timeslot_id: timeslotId,
    reservation_id: reservationId,
    people_count: 12,
    vehicle_count: 5,
  }, managerToken);
  check('Impression logged', impressionRes.status === 201, JSON.stringify(impressionRes.data));

  // 14. Advertiser can view their own impression summary
  const summaryRes = await req('GET', `/impressions/summary/${reservationId}`, null, advertiserToken);
  check('Advertiser views impression summary', summaryRes.status === 200 && summaryRes.data.totalPeople === 12, JSON.stringify(summaryRes.data));

  // 15. Second advertiser CANNOT view first advertiser's impression summary
  const forbiddenSummary = await req('GET', `/impressions/summary/${reservationId}`, null, advertiser2Token);
  check('Other advertiser blocked from viewing summary', forbiddenSummary.status === 403);

  console.log(`\n--- Results: ${pass} passed, ${fail} failed ---`);
})();
