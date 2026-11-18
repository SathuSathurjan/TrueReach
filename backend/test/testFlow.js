// backend/test/testFlow.js
// Requires Node 18+ (built-in fetch). Run with: node test/testFlow.js
// Run `npm run seed` once, then start the server with `npm run dev` before running this.

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
  const superadminEmail = `superadmin${suffix}@truereach.test`;
  const managerEmail = `manager${suffix}@truereach.test`;
  const advertiserEmail = `advertiser${suffix}@truereach.test`;
  const advertiser2Email = `advertiser2_${suffix}@truereach.test`;

  // 1. Log in as the seeded superadmin; public registration cannot create admins.
  const adminLogin = await req('POST', '/auth/login', { email: 'admin@truereach.lk', password: 'Demo@123' });
  check('Seeded superadmin can log in', adminLogin.status === 200, JSON.stringify(adminLogin.data));
  const superToken = adminLogin.data?.token;

  const r1 = await req('POST', '/auth/register', { name: 'Super Admin', email: superadminEmail, password: '123456', role: 'superadmin' });
  check('Public superadmin registration rejected', r1.status === 400);

  // 2. City manager registration requires admin approval.
  const r2 = await req('POST', '/auth/register', { name: 'City Manager', email: managerEmail, password: '123456', role: 'citymanager' });
  check('City manager registration is pending', r2.status === 201 && r2.data?.status === 'pending');
  const pendingLogin = await req('POST', '/auth/login', { email: managerEmail, password: '123456' });
  check('Pending city manager cannot log in', pendingLogin.status === 403);
  const managersRes = await req('GET', '/users?role=citymanager', null, superToken);
  const pendingManager = managersRes.data?.find((manager) => manager.email === managerEmail);
  const approveManager = await req('PUT', `/users/${pendingManager?._id}/approve`, {}, superToken);
  check('Superadmin approves city manager', approveManager.status === 200 && approveManager.data?.isApproved === true);
  const managerLogin = await req('POST', '/auth/login', { email: managerEmail, password: '123456' });
  check('Approved city manager can log in', managerLogin.status === 200);
  const managerToken = managerLogin.data?.token;
  const managerId = managerLogin.data?._id;

  // 3. Advertisers are active immediately.
  const r3 = await req('POST', '/auth/register', { name: 'Advertiser One', email: advertiserEmail, password: '123456', role: 'advertiser' });
  check('Register advertiser immediately', r3.status === 201 && Boolean(r3.data?.token), JSON.stringify(r3.data));
  const advertiserToken = r3.data?.token;
  const advertiserId = r3.data?._id;

  const r4 = await req('POST', '/auth/register', { name: 'Advertiser Two', email: advertiser2Email, password: '123456', role: 'advertiser' });
  const advertiser2Token = r4.data?.token;

  // 4. Duplicate registration should fail.
  const rDup = await req('POST', '/auth/register', { name: 'Dup', email: advertiserEmail, password: '123456', role: 'advertiser' });
  check('Duplicate email registration rejected', rDup.status === 400);

  // 5. Superadmin creates a city.
  const cityRes = await req('POST', '/cities', { name: `TestCity${suffix}` }, superToken);
  check('Superadmin creates city', cityRes.status === 201, JSON.stringify(cityRes.data));
  const cityId = cityRes.data?._id;
  const duplicateCityRes = await req('POST', '/cities', { name: ` testcity${suffix} ` }, superToken);
  check('Duplicate city name rejected regardless of case and whitespace', duplicateCityRes.status === 400);

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

  const deactivateManager = await req('PUT', `/users/${managerId}/status`, { isActive: false }, superToken);
  check('Deactivating city manager unassigns their city', deactivateManager.status === 200 && deactivateManager.data?.isActive === false);
  const citiesAfterDeactivation = await req('GET', '/cities', null, superToken);
  check('Deactivated city is unassigned', !citiesAfterDeactivation.data?.find((city) => city._id === cityId)?.cityManager);
  const inactiveManagerAccess = await req('GET', '/boards', null, managerToken);
  check('Deactivated city manager access is blocked', inactiveManagerAccess.status === 403);
  const inactiveManagerLogin = await req('POST', '/auth/login', { email: managerEmail, password: '123456' });
  check('Deactivated city manager cannot log in with alert message', inactiveManagerLogin.status === 403 && inactiveManagerLogin.data?.message.includes('deactivated'));

  const reactivateManager = await req('PUT', `/users/${managerId}/status`, { isActive: true }, superToken);
  check('City manager can be reactivated', reactivateManager.status === 200 && reactivateManager.data?.isActive === true);
  const reassignCity = await req('PUT', `/cities/${cityId}`, { cityManager: managerId }, superToken);
  check('Reactivated manager can be assigned again', reassignCity.status === 200 && reassignCity.data?.cityManager === managerId);

  const deactivateAdvertiser = await req('PUT', `/users/${advertiserId}/status`, { isActive: false }, superToken);
  check('Advertiser can be deactivated', deactivateAdvertiser.status === 200 && deactivateAdvertiser.data?.isActive === false);
  const inactiveAdvertiserAccess = await req('GET', '/reservations', null, advertiserToken);
  check('Deactivated advertiser access is blocked', inactiveAdvertiserAccess.status === 403);
  const inactiveAdvertiserLogin = await req('POST', '/auth/login', { email: advertiserEmail, password: '123456' });
  check('Deactivated advertiser cannot log in with alert message', inactiveAdvertiserLogin.status === 403 && inactiveAdvertiserLogin.data?.message.includes('deactivated'));
  const reactivateAdvertiser = await req('PUT', `/users/${advertiserId}/status`, { isActive: true }, superToken);
  check('Advertiser can be reactivated', reactivateAdvertiser.status === 200 && reactivateAdvertiser.data?.isActive === true);

  console.log(`\n--- Results: ${pass} passed, ${fail} failed ---`);
})();
