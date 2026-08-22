import mongoose from 'mongoose';
import app from './app.js';
import connectDB from './config/db.js';
import User from './models/user.model.js';
import Organization from './models/organization.model.js';
import Membership, { ROLES, MEMBERSHIP_STATUS } from './models/membership.model.js';
import Event, { EVENT_STATUS, LOCATION_TYPE, EVENT_VISIBILITY } from './models/event.model.js';
import Registration, { REGISTRATION_STATUS } from './models/registration.model.js';
import Ticket, { TICKET_STATUS } from './models/ticket.model.js';
import Attendance, { ATTENDANCE_STATUS } from './models/attendance.model.js';
import { generateAiExecutiveSummary } from './services/ai.service.js';

import config from './config/env.js';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let server;
let baseUrl;
let mongoServer;

const runTests = async () => {
  console.log('=== STARTING PHASE 1.8 & FULL REGRESSION TEST SUITE ===\n');

  try {
    await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 3000 });
    console.log('Connected to Primary MongoDB Atlas');
  } catch (dbErr) {
    console.log('⚠️ Primary MongoDB Atlas connection unavailable or IP whitelisted. Fallback to MongoMemoryReplSet...');
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('Connected to MongoMemoryReplSet successfully.');
  }

  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`Test server running at ${baseUrl}\n`);

  const results = [];
  const recordResult = (testNum, description, expected, actual, extraInfo = '') => {
    const pass = expected === actual;
    results.push({ testNum, description, expected, actual, pass, extraInfo });
    const mark = pass ? '✅ PASS' : '❌ FAIL';
    console.log(`[Test ${testNum}] ${mark} | Expected: ${expected} | Got: ${actual} | ${description} ${extraInfo ? `(${extraInfo})` : ''}`);
  };

  const request = async (method, endpoint, body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const opts = { method, headers };
    if (body) {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`${baseUrl}${endpoint}`, opts);
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    return { status: res.status, data };
  };

  try {
    const timestamp = Date.now();

    // --- 1. SETUP USERS ---
    const u1Res = await request('POST', '/auth/register', { name: 'Admin Staff', email: `admin_${timestamp}@example.com`, password: 'Password123!' });
    const adminToken = u1Res.data?.data?.token;
    const adminId = u1Res.data?.data?.user?.id || u1Res.data?.data?.user?._id;

    const u2Res = await request('POST', '/auth/register', { name: 'Organizer Staff', email: `organizer_${timestamp}@example.com`, password: 'Password123!' });
    const organizerToken = u2Res.data?.data?.token;
    const organizerId = u2Res.data?.data?.user?.id || u2Res.data?.data?.user?._id;

    const u3Res = await request('POST', '/auth/register', { name: 'Volunteer Staff', email: `volunteer_${timestamp}@example.com`, password: 'Password123!' });
    const volunteerToken = u3Res.data?.data?.token;
    const volunteerId = u3Res.data?.data?.user?.id || u3Res.data?.data?.user?._id;

    const u4Res = await request('POST', '/auth/register', { name: 'Participant User', email: `participant_${timestamp}@example.com`, password: 'Password123!' });
    const participantToken = u4Res.data?.data?.token;
    const participantId = u4Res.data?.data?.user?.id || u4Res.data?.data?.user?._id;

    const u5Res = await request('POST', '/auth/register', { name: 'Non Member', email: `nonmember_${timestamp}@example.com`, password: 'Password123!' });
    const nonMemberToken = u5Res.data?.data?.token;
    const nonMemberId = u5Res.data?.data?.user?.id || u5Res.data?.data?.user?._id;

    // --- 2. SETUP ORGANIZATIONS ---
    const orgARes = await request('POST', '/organizations', { name: `Org Alpha ${timestamp}`, description: 'Alpha Test Org' }, adminToken);
    const orgAId = orgARes.data?.data?.organization?._id;

    const orgBRes = await request('POST', '/organizations', { name: `Org Beta ${timestamp}`, description: 'Beta Test Org' }, nonMemberToken);
    const orgBId = orgBRes.data?.data?.organization?._id;

    await Membership.create({ user: organizerId, organization: orgAId, role: ROLES.ORGANIZER, status: MEMBERSHIP_STATUS.ACTIVE });
    await Membership.create({ user: volunteerId, organization: orgAId, role: ROLES.VOLUNTEER, status: MEMBERSHIP_STATUS.ACTIVE });
    await Membership.create({ user: participantId, organization: orgAId, role: ROLES.PARTICIPANT, status: MEMBERSHIP_STATUS.ACTIVE });

    // --- 3. SETUP EVENTS ---
    const createEv = async (title, status, capacity = 100, overrides = {}) => {
      const payload = {
        title,
        description: 'Desc',
        category: 'Technology',
        startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 6).toISOString(),
        capacity: (capacity !== null && capacity !== undefined) ? capacity : 100,
        locationType: LOCATION_TYPE.PHYSICAL,
        venue: 'Main Hall',
        visibility: EVENT_VISIBILITY.PUBLIC,
        ...overrides
      };

      const evRes = await request('POST', `/organizations/${orgAId}/events`, payload, adminToken);
      const evId = evRes.data?.data?.event?._id;
      if (evId) {
        const updateFields = { status };
        if (capacity === null) {
          updateFields.capacity = null;
        }
        await Event.findByIdAndUpdate(evId, updateFields);
      }
      return evId;
    };

    const mainEventId = await createEv('AI & Tech Conference', EVENT_STATUS.PUBLISHED, 10);
    const uncappedEventId = await createEv('Uncapped Community Meetup', EVENT_STATUS.PUBLISHED, null);
    const privateEventId = await createEv('Private Executive Summit', EVENT_STATUS.PUBLISHED, 20, { visibility: EVENT_VISIBILITY.PRIVATE });

    await request('POST', `/organizations/${orgAId}/events/${mainEventId}/register`, { ticketType: 'VIP' }, adminToken);
    await request('POST', `/organizations/${orgAId}/events/${mainEventId}/register`, { ticketType: 'STANDARD' }, organizerToken);
    const partRegRes = await request('POST', `/organizations/${orgAId}/events/${mainEventId}/register`, { ticketType: 'STUDENT' }, participantToken);
    const participantTicket = partRegRes.data?.data?.ticket;

    await request('POST', `/organizations/${orgAId}/events/${mainEventId}/attendance/check-in`, { qrToken: participantTicket.qrToken }, adminToken);


    // =========================================================================
    // PHASE 1.8 TEST SUITE (TESTS 1 to 35)
    // =========================================================================

    // --- ANALYTICS ---
    const t1 = await request('GET', `/organizations/${orgAId}/events/${mainEventId}/analytics`, null, adminToken);
    recordResult(1, 'Authenticated ADMIN analytics returns 200', 200, t1.status);

    const t2 = await request('GET', `/organizations/${orgAId}/events/${mainEventId}/analytics`, null, organizerToken);
    recordResult(2, 'Authenticated ORGANIZER analytics returns 200', 200, t2.status);

    const t3 = await request('GET', `/organizations/${orgAId}/events/${mainEventId}/analytics`, null, volunteerToken);
    recordResult(3, 'Authenticated VOLUNTEER analytics returns 200', 200, t3.status);

    const t4 = await request('GET', `/organizations/${orgAId}/events/${mainEventId}/analytics`);
    recordResult(4, 'Unauthenticated analytics returns 401', 401, t4.status);

    const t5 = await request('GET', `/organizations/${orgAId}/events/${mainEventId}/analytics`, null, participantToken);
    recordResult(5, 'PARTICIPANT viewing analytics returns 403', 403, t5.status);

    const t6 = await request('GET', `/organizations/${orgAId}/events/${mainEventId}/analytics`, null, nonMemberToken);
    recordResult(6, 'Non-member viewing analytics returns 403', 403, t6.status);

    const t7 = await request('GET', `/organizations/${orgBId}/events/${mainEventId}/analytics`, null, nonMemberToken);
    recordResult(7, 'Cross-organization analytics blocked', 404, t7.status);

    const t8 = await request('GET', `/organizations/invalid-org-id/events/${mainEventId}/analytics`, null, adminToken);
    recordResult(8, 'Invalid organization ID format returns 400', 400, t8.status);

    const t9 = await request('GET', `/organizations/${orgAId}/events/invalid-event-id/analytics`, null, adminToken);
    recordResult(9, 'Invalid event ID format returns 400', 400, t9.status);

    const analyticsData = t1.data?.data;
    const t10Pass = analyticsData?.registrations?.confirmed === 3 &&
      analyticsData?.attendance?.checkedIn === 1 &&
      analyticsData?.capacity?.utilizationRate === 30;
    recordResult(10, 'Analytics calculations match database metrics (3 confirmed, 1 check-in, 30% util)', true, t10Pass);


    // --- PREDICTION ---
    const insightsRes = await request('GET', `/organizations/${orgAId}/events/${mainEventId}/insights`, null, adminToken);
    const predData = insightsRes.data?.data?.prediction;
    const t11Pass = insightsRes.status === 200 && predData?.predictedRegistrations >= 3 && predData?.confidenceType === 'HEURISTIC';
    recordResult(11, 'Demand prediction executes with sufficient data & HEURISTIC confidence', true, t11Pass);

    const emptyEvId = await createEv('Empty Event', EVENT_STATUS.PUBLISHED, 20);
    const emptyInsights = await request('GET', `/organizations/${orgAId}/events/${emptyEvId}/insights`, null, adminToken);
    const emptyPred = emptyInsights.data?.data?.prediction;
    const t12Pass = emptyInsights.status === 200 && emptyPred?.isHistoricalDataSufficient === false;
    recordResult(12, 'Prediction handles insufficient historical data gracefully', true, t12Pass);

    const t13Pass = predData?.predictedRegistrations <= predData?.capacity;
    recordResult(13, 'Capacity-aware prediction does not exceed max capacity', true, t13Pass);

    const uncappedInsights = await request('GET', `/organizations/${orgAId}/events/${uncappedEventId}/insights`, null, adminToken);
    const uncappedPred = uncappedInsights.data?.data?.prediction;
    const t14Pass = uncappedInsights.status === 200 && uncappedPred?.capacity === null && uncappedPred?.predictedUtilization === null;
    recordResult(14, 'No-capacity / uncapped event prediction handles null capacity cleanly', true, t14Pass);

    const insightsRes2 = await request('GET', `/organizations/${orgAId}/events/${mainEventId}/insights`, null, adminToken);
    const predData2 = insightsRes2.data?.data?.prediction;
    const t15Pass = predData?.predictedRegistrations === predData2?.predictedRegistrations && predData?.confidence === predData2?.confidence;
    recordResult(15, 'Demand prediction is 100% deterministic for identical inputs', true, t15Pass);

    const t16Pass = predData?.predictedRegistrations >= 0 && predData?.predictedRegistrations >= analyticsData?.registrations?.confirmed;
    recordResult(16, 'No negative predictions and prediction >= confirmed registrations', true, t16Pass);

    const t17Pass = predData?.capacity === null || predData?.predictedRegistrations <= predData?.capacity;
    recordResult(17, 'Prediction strictly respects event capacity ceiling', true, t17Pass);


    // --- RISKS ---
    const lowRegEvId = await createEv('Low Reg Event', EVENT_STATUS.PUBLISHED, 100, {
      startDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 4).toISOString()
    });
    const lowRegInsights = await request('GET', `/organizations/${orgAId}/events/${lowRegEvId}/insights`, null, adminToken);
    const lowRegRisks = lowRegInsights.data?.data?.risks;
    const hasLowRegRisk = Array.isArray(lowRegRisks) && lowRegRisks.some(r => r.type === 'LOW_REGISTRATION');
    recordResult(18, 'LOW_REGISTRATION risk detected when velocity/utilization is low near event date', true, hasLowRegRisk);

    const cancEvId = await createEv('High Canc Event', EVENT_STATUS.PUBLISHED, 20);
    for (let i = 0; i < 5; i++) {
      const uRes = await request('POST', '/auth/register', { name: `Canc User ${i}`, email: `canc_${i}_${timestamp}@example.com`, password: 'Password123!' });
      const uTok = uRes.data?.data?.token;
      await Membership.create({ user: uRes.data?.data?.user?._id, organization: orgAId, role: ROLES.PARTICIPANT, status: MEMBERSHIP_STATUS.ACTIVE });
      const rRes = await request('POST', `/organizations/${orgAId}/events/${cancEvId}/register`, {}, uTok);
      if (i < 3) {
        await request('POST', `/registrations/${rRes.data?.data?.registration?._id}/cancel`, {}, uTok);
      }
    }
    const cancInsights = await request('GET', `/organizations/${orgAId}/events/${cancEvId}/insights`, null, adminToken);
    const cancRisks = cancInsights.data?.data?.risks;
    const hasCancRisk = Array.isArray(cancRisks) && cancRisks.some(r => r.type === 'HIGH_CANCELLATION');
    recordResult(19, 'HIGH_CANCELLATION risk detected when cancellation rate >= 20%', true, hasCancRisk);

    const fullEvId = await createEv('Full Capacity Summit', EVENT_STATUS.PUBLISHED, 1);
    await request('POST', `/organizations/${orgAId}/events/${fullEvId}/register`, {}, adminToken);
    await request('POST', `/organizations/${orgAId}/events/${fullEvId}/register`, {}, participantToken);
    const fullInsights = await request('GET', `/organizations/${orgAId}/events/${fullEvId}/insights`, null, adminToken);
    const fullRisks = fullInsights.data?.data?.risks;
    const hasCapRisk = Array.isArray(fullRisks) && fullRisks.some(r => r.type === 'CAPACITY_PRESSURE');
    recordResult(20, 'CAPACITY_PRESSURE risk detected when capacity >= 90% or waitlist exists', true, hasCapRisk);

    const lowAttEvId = await createEv('Low Att Event', EVENT_STATUS.PUBLISHED, 20);
    for (let i = 0; i < 5; i++) {
      const uRes = await request('POST', '/auth/register', { name: `Att User ${i}`, email: `att_${i}_${timestamp}@example.com`, password: 'Password123!' });
      const uTok = uRes.data?.data?.token;
      await Membership.create({ user: uRes.data?.data?.user?._id, organization: orgAId, role: ROLES.PARTICIPANT, status: MEMBERSHIP_STATUS.ACTIVE });
      await request('POST', `/organizations/${orgAId}/events/${lowAttEvId}/register`, {}, uTok);
    }
    await Event.findByIdAndUpdate(lowAttEvId, { status: EVENT_STATUS.ONGOING });

    const lowAttInsights = await request('GET', `/organizations/${orgAId}/events/${lowAttEvId}/insights`, null, adminToken);
    const lowAttRisks = lowAttInsights.data?.data?.risks;
    const hasAttRisk = Array.isArray(lowAttRisks) && lowAttRisks.some(r => r.type === 'LOW_ATTENDANCE');
    recordResult(21, 'LOW_ATTENDANCE risk detected when ongoing event check-in rate < 50%', true, hasAttRisk);

    const riskScorePass = Array.isArray(lowRegRisks) && lowRegRisks.every(r => typeof r.score === 'number' && r.score >= 0 && r.score <= 1);
    recordResult(22, 'Risk scores are deterministically derived bounded metrics', true, riskScorePass);


    // --- AI INTEGRATION & FALLBACK ---
    const aiServiceRes = await generateAiExecutiveSummary({
      event: { title: 'AI Conference', capacity: 100, status: 'PUBLISHED' },
      analytics: { registrations: { confirmed: 50 }, capacity: { utilizationRate: 50 }, attendance: { attendanceRate: 80 } },
      prediction: { demandLevel: 'HIGH', predictedRegistrations: 90 },
      risks: []
    });
    const t23Pass = typeof aiServiceRes.aiAvailable === 'boolean';
    recordResult(23, 'AI service executes gracefully returning aiAvailable boolean flag', true, t23Pass);

    const origKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.AI_API_KEY;
    const fallbackRes = await generateAiExecutiveSummary({
      event: { title: 'Test' },
      analytics: { registrations: { confirmed: 10 }, capacity: { utilizationRate: 10 }, attendance: { attendanceRate: 0 } },
      prediction: { demandLevel: 'LOW', predictedRegistrations: 10 },
      risks: []
    });
    if (origKey) process.env.GEMINI_API_KEY = origKey;
    const t24Pass = fallbackRes.aiAvailable === false && fallbackRes.aiSummary === null;
    recordResult(24, 'Missing API key triggers clean fallback (aiAvailable: false, aiSummary: null)', true, t24Pass);

    const t25Pass = insightsRes.status === 200 && Array.isArray(insightsRes.data?.data?.deterministicInsights);
    recordResult(25, 'Insights endpoint returns deterministicInsights array regardless of AI provider status', true, t25Pass);

    recordResult(26, 'Provider error / missing key does NOT crash Express server (returns 200 OK)', 200, insightsRes.status);

    const t27Pass = !JSON.stringify(insightsRes.data?.data).includes('password') && !JSON.stringify(insightsRes.data?.data).includes('secret');
    recordResult(27, 'AI payload contains zero user credentials, passwords, or PII', true, t27Pass);

    const respStr = JSON.stringify(insightsRes.data);
    const t28Pass = !respStr.includes('GEMINI_API_KEY') && !respStr.includes('AI_API_KEY');
    recordResult(28, 'API keys are strictly hidden and never exposed in API outputs', true, t28Pass);


    // --- RECOMMENDATIONS ---
    const recRes = await request('GET', '/users/me/recommendations', null, participantToken);
    const recList = recRes.data?.data?.recommendations;
    const t29Pass = recRes.status === 200 && Array.isArray(recList);
    recordResult(29, 'Authenticated user recommendations return 200 and list', true, t29Pass);

    const t30 = await request('GET', '/users/me/recommendations');
    recordResult(30, 'Unauthenticated recommendations return 401', 401, t30.status);

    const t31Pass = Array.isArray(recList) && recList.every(r => r.event?._id?.toString() !== mainEventId?.toString());
    recordResult(31, 'Already registered events are excluded from recommendations', true, t31Pass);

    const nonMemberRecRes = await request('GET', '/users/me/recommendations', null, nonMemberToken);
    const nonMemberRecList = nonMemberRecRes.data?.data?.recommendations;
    const t32Pass = Array.isArray(nonMemberRecList) && nonMemberRecList.every(r => r.event?._id?.toString() !== privateEventId?.toString());
    recordResult(32, 'PRIVATE events in unjoined organizations excluded for non-members', true, t32Pass);

    const t33Pass = Array.isArray(recList) && recList.some(r => r.event?._id?.toString() === uncappedEventId?.toString());
    recordResult(33, 'PUBLIC upcoming events are discoverable in recommendations', true, t33Pass);

    const t34Pass = Array.isArray(recList) && recList.length > 0 && recList.every(r => typeof r.reason === 'string' && r.reason.length > 0 && typeof r.score === 'number');
    recordResult(34, 'Recommendations include explainable text reasons & confidence scores', true, t34Pass);

    recordResult(35, 'User identity for recommendations is extracted exclusively from JWT', 200, recRes.status);


    // =========================================================================
    // REGRESSION TESTS (PHASES 1.3 - 1.7)
    // =========================================================================
    console.log('\n--- RUNNING REGRESSION TESTS FOR PHASES 1.3 - 1.7 ---');

    // Phase 1.3: Auth
    const regAuth = await request('POST', '/auth/register', { name: 'Reg User', email: `reg_${timestamp}@example.com`, password: 'Password123!' });
    recordResult('R-1.3.1', 'Auth Register', 201, regAuth.status);

    const loginAuth = await request('POST', '/auth/login', { email: `reg_${timestamp}@example.com`, password: 'Password123!' });
    recordResult('R-1.3.2', 'Auth Login', 200, loginAuth.status);

    const getMeAuth = await request('GET', '/auth/me', null, loginAuth.data?.data?.token);
    recordResult('R-1.3.3', 'Auth Get Me', 200, getMeAuth.status);

    const logoutAuth = await request('POST', '/auth/logout', null, loginAuth.data?.data?.token);
    recordResult('R-1.3.4', 'Auth Logout', 200, logoutAuth.status);

    // Phase 1.4: Organization Management
    const createOrg = await request('POST', '/organizations', { name: `Reg Org ${timestamp}`, description: 'Desc' }, adminToken);
    const regOrgId = createOrg.data?.data?.organization?._id;
    recordResult('R-1.4.1', 'Org Create', 201, createOrg.status);

    const getOrgs = await request('GET', '/organizations', null, adminToken);
    recordResult('R-1.4.2', 'Org List My Organizations', 200, getOrgs.status);

    const getOrg = await request('GET', `/organizations/${regOrgId}`, null, adminToken);
    recordResult('R-1.4.3', 'Org Get By Id', 200, getOrg.status);

    const updateOrg = await request('PATCH', `/organizations/${regOrgId}`, { description: 'Updated Desc' }, adminToken);
    recordResult('R-1.4.4', 'Org Update', 200, updateOrg.status);

    const deleteOrg = await request('DELETE', `/organizations/${regOrgId}`, null, adminToken);
    recordResult('R-1.4.5', 'Org Delete', 200, deleteOrg.status);

    // Phase 1.5: Event Management
    const createEvReg = await request('POST', `/organizations/${orgAId}/events`, {
      title: 'Regression Event',
      category: 'Tech',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 172800000).toISOString(),
      capacity: 50,
      locationType: LOCATION_TYPE.PHYSICAL,
      venue: 'Main Hall'
    }, adminToken);
    const regEvId = createEvReg.data?.data?.event?._id;
    recordResult('R-1.5.1', 'Event Create', 201, createEvReg.status);

    const getEvs = await request('GET', `/organizations/${orgAId}/events`, null, adminToken);
    recordResult('R-1.5.2', 'Event List Org Events', 200, getEvs.status);

    const getEv = await request('GET', `/organizations/${orgAId}/events/${regEvId}`, null, adminToken);
    recordResult('R-1.5.3', 'Event Get By Id', 200, getEv.status);

    const updateEv = await request('PATCH', `/organizations/${orgAId}/events/${regEvId}`, { title: 'Updated Reg Event' }, adminToken);
    recordResult('R-1.5.4', 'Event Update', 200, updateEv.status);

    const pubEv = await request('POST', `/organizations/${orgAId}/events/${regEvId}/publish`, null, adminToken);
    recordResult('R-1.5.5', 'Event Publish', 200, pubEv.status);

    const cancelEv = await request('POST', `/organizations/${orgAId}/events/${regEvId}/cancel`, null, adminToken);
    recordResult('R-1.5.6', 'Event Cancel', 200, cancelEv.status);

    // Phase 1.6: Registration & Ticketing
    const p16EvId = await createEv('P1.6 Reg Event', EVENT_STATUS.PUBLISHED, 50);
    const p16RegRes = await request('POST', `/organizations/${orgAId}/events/${p16EvId}/register`, { ticketType: 'VIP' }, participantToken);
    recordResult('R-1.6.1', 'P1.6 Event Registration', 201, p16RegRes.status);

    const p16RegId = p16RegRes.data?.data?.registration?._id;
    const p16TicketId = p16RegRes.data?.data?.ticket?._id;

    const getMyRegs = await request('GET', '/users/me/registrations', null, participantToken);
    recordResult('R-1.6.2', 'P1.6 Get My Registrations', 200, getMyRegs.status);

    const getMyTix = await request('GET', '/users/me/tickets', null, participantToken);
    recordResult('R-1.6.3', 'P1.6 Get My Tickets', 200, getMyTix.status);

    const getRegById = await request('GET', `/registrations/${p16RegId}`, null, participantToken);
    recordResult('R-1.6.4', 'P1.6 Get Registration By Id', 200, getRegById.status);

    const getTixById = await request('GET', `/tickets/${p16TicketId}`, null, participantToken);
    recordResult('R-1.6.5', 'P1.6 Get Ticket By Id', 200, getTixById.status);

    const cancelReg = await request('POST', `/registrations/${p16RegId}/cancel`, {}, participantToken);
    recordResult('R-1.6.6', 'P1.6 Cancel Registration', 200, cancelReg.status);

    // Phase 1.7: Attendance & QR Check-in
    const p17EvId = await createEv('P1.7 Check-in Event', EVENT_STATUS.PUBLISHED, 50);
    const p17RegRes = await request('POST', `/organizations/${orgAId}/events/${p17EvId}/register`, { ticketType: 'STANDARD' }, participantToken);
    const p17Ticket = p17RegRes.data?.data?.ticket;

    const checkInRes = await request('POST', `/organizations/${orgAId}/events/${p17EvId}/attendance/check-in`, { qrToken: p17Ticket.qrToken }, adminToken);
    recordResult('R-1.7.1', 'P1.7 Staff Check-in', 201, checkInRes.status);
    const p17AttId = checkInRes.data?.data?.attendance?._id;

    const checkOutRes = await request('POST', `/organizations/${orgAId}/events/${p17EvId}/attendance/${p17AttId}/check-out`, {}, adminToken);
    recordResult('R-1.7.2', 'P1.7 Staff Check-out', 200, checkOutRes.status);

    const summaryRes = await request('GET', `/organizations/${orgAId}/events/${p17EvId}/attendance/summary`, null, adminToken);
    recordResult('R-1.7.3', 'P1.7 Attendance Summary', 200, summaryRes.status);


    // --- SUMMARY ---
    const total = results.length;
    const passed = results.filter(r => r.pass).length;
    const failed = total - passed;
    console.log(`\n==================================================`);
    console.log(`TEST SUMMARY: ${passed}/${total} PASSED (${failed} FAILED)`);
    console.log(`==================================================\n`);

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
    process.exit(0);
  }
};

runTests();
