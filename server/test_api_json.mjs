import { writeFileSync } from 'fs';

const BASE = 'http://localhost:5000/api';
const ts = Date.now();
const results = [];
let empToken, flToken, empUser, flUser, projectId, milestoneId;

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

function test(label, pass, detail) {
  results.push({ label, pass: !!pass, detail: detail || '' });
}

function save() {
  writeFileSync('test_results.json', JSON.stringify({ results, passed: results.filter(r=>r.pass).length, failed: results.filter(r=>!r.pass).length, total: results.length }, null, 2));
}

(async () => {
  try {
    // HEALTH
    const h = await req('GET', '/health');
    test('Health endpoint returns 200', h.status === 200 && h.data.status === 'ok');

    // AUTH - Register
    const empReg = await req('POST', '/auth/register', { name: `TestEmp_${ts}`, email: `emp_${ts}@test.com`, password: 'testpass123', role: 'employer' });
    test('Register employer (201 + token + user)', empReg.status === 201 && empReg.data.token && empReg.data.user, `status=${empReg.status}`);
    empToken = empReg.data.token; empUser = empReg.data.user;

    const flReg = await req('POST', '/auth/register', { name: `TestFL_${ts}`, email: `fl_${ts}@test.com`, password: 'testpass123', role: 'freelancer' });
    test('Register freelancer (201 + token + user)', flReg.status === 201 && flReg.data.token && flReg.data.user, `status=${flReg.status}`);
    flToken = flReg.data.token; flUser = flReg.data.user;

    // AUTH - Duplicate
    const dupReg = await req('POST', '/auth/register', { name: 'Dup', email: `emp_${ts}@test.com`, password: 'x', role: 'employer' });
    test('Duplicate email blocked (409)', dupReg.status === 409, `status=${dupReg.status}`);

    // AUTH - Login
    const empLogin = await req('POST', '/auth/login', { email: `emp_${ts}@test.com`, password: 'testpass123' });
    test('Login employer (200 + token)', empLogin.status === 200 && empLogin.data.token, `status=${empLogin.status}`);

    const flLogin = await req('POST', '/auth/login', { email: `fl_${ts}@test.com`, password: 'testpass123' });
    test('Login freelancer (200 + token)', flLogin.status === 200 && flLogin.data.token, `status=${flLogin.status}`);

    // AUTH - Wrong password
    const badPw = await req('POST', '/auth/login', { email: `emp_${ts}@test.com`, password: 'wrong' });
    test('Wrong password rejected (401)', badPw.status === 401, `status=${badPw.status}`);

    // AUTH - /me
    const me = await req('GET', '/auth/me', null, empToken);
    test('/me with valid token (200)', me.status === 200 && me.data.user, `status=${me.status}`);
    test('/me user has correct email', me.data.user?.email === `emp_${ts}@test.com`, `email=${me.data.user?.email}`);
    test('/me user has no password field', !me.data.user?.password, me.data.user?.password ? 'PASSWORD LEAKED!' : '');

    const noToken = await req('GET', '/auth/me');
    test('/me without token (401)', noToken.status === 401, `status=${noToken.status}`);

    // PROJECTS - Create (with AI milestones)
    const proj = await req('POST', '/projects', {
      title: `Test Project ${ts}`,
      description: 'Build a full-stack e-commerce website with React frontend, Node.js backend, Stripe payments, and admin dashboard.',
      totalFunds: 5000
    }, empToken);
    test('Create project (201 + project + milestones)', proj.status === 201 && proj.data.project && proj.data.milestones?.length > 0, `status=${proj.status}, milestones=${proj.data.milestones?.length || 0}, error=${proj.data.error || 'none'}`);
    
    if (proj.data.project) {
      projectId = proj.data.project._id;
      test('AI generated 3-5 milestones', proj.data.milestones.length >= 3 && proj.data.milestones.length <= 5, `count=${proj.data.milestones.length}`);
      test('Project has techStack', proj.data.project.techStack?.length > 0, `techStack=${JSON.stringify(proj.data.project.techStack)}`);
      test('Project has estimatedDuration', !!proj.data.project.estimatedDuration, `duration=${proj.data.project.estimatedDuration}`);
      test('Project aiAnalysisComplete=true', proj.data.project.aiAnalysisComplete === true);
      test('Project status is pending', proj.data.project.status === 'pending');
    }

    // PROJECTS - Role guard
    const flCreate = await req('POST', '/projects', { title: 'Bad', description: 'x', totalFunds: 100 }, flToken);
    test('Freelancer cannot create project (403)', flCreate.status === 403, `status=${flCreate.status}`);

    // PROJECTS - List
    const projList = await req('GET', '/projects', null, empToken);
    test('List projects employer (200 + array)', projList.status === 200 && projList.data.projects?.length > 0, `status=${projList.status}, count=${projList.data.projects?.length}`);

    const flProjList = await req('GET', '/projects', null, flToken);
    test('List projects freelancer (200)', flProjList.status === 200, `status=${flProjList.status}`);
    test('Freelancer sees pending projects', flProjList.data.projects?.some(p => p.status === 'pending'));

    // PROJECTS - Get single
    if (projectId) {
      const single = await req('GET', `/projects/${projectId}`, null, empToken);
      test('Get single project (200 + project + milestones)', single.status === 200 && single.data.project && single.data.milestones, `status=${single.status}`);
      test('Populated employerId.name', !!single.data.project?.employerId?.name, `name=${single.data.project?.employerId?.name}`);
      test('Milestones included in single project', single.data.milestones?.length > 0);
    }

    // MILESTONES
    if (projectId) {
      const msList = await req('GET', `/milestones/${projectId}`, null, empToken);
      test('Fetch milestones for project (200 + array)', msList.status === 200 && msList.data.milestones?.length > 0, `status=${msList.status}, count=${msList.data.milestones?.length}`);

      if (msList.data.milestones?.length > 0) {
        milestoneId = msList.data.milestones[0]._id;
        const ms = msList.data.milestones[0];
        test('First milestone status=active', ms.status === 'active', `status=${ms.status}`);
        test('Milestone has title', !!ms.title, `title=${ms.title}`);
        test('Milestone has checklist[]', ms.checklist?.length > 0, `checklist=${ms.checklist?.length}`);
        test('Milestone has paymentAmount > 0', ms.paymentAmount > 0, `amount=${ms.paymentAmount}`);
        test('Milestone has deadline', !!ms.deadline, `deadline=${ms.deadline}`);
        test('Other milestones are locked', msList.data.milestones.slice(1).every(m => m.status === 'locked'));

        const singleMs = await req('GET', `/milestones/single/${milestoneId}`, null, empToken);
        test('Get single milestone (200)', singleMs.status === 200 && singleMs.data.milestone, `status=${singleMs.status}`);
        test('Single milestone populated projectId.title', !!singleMs.data.milestone?.projectId?.title, `title=${singleMs.data.milestone?.projectId?.title}`);
      }
    }

    // ESCROW
    if (projectId) {
      const deposit = await req('POST', '/escrow/deposit', { projectId, amount: 5000 }, empToken);
      test('Deposit to escrow (200)', deposit.status === 200, `status=${deposit.status}`);
      test('Escrow balance = 5000', deposit.data.project?.escrowBalance === 5000, `balance=${deposit.data.project?.escrowBalance}`);

      const flDeposit = await req('POST', '/escrow/deposit', { projectId, amount: 100 }, flToken);
      test('Freelancer cannot deposit (403)', flDeposit.status === 403, `status=${flDeposit.status}`);
    }

    // ASSIGN FREELANCER
    if (projectId && flUser) {
      const assign = await req('PATCH', `/projects/${projectId}/assign`, { freelancerId: flUser._id }, flToken);
      test('Freelancer self-assigns (200)', assign.status === 200, `status=${assign.status}`);
      test('Project status becomes active', assign.data.project?.status === 'active', `status=${assign.data.project?.status}`);
      test('Project freelancerId set', assign.data.project?.freelancerId?.toString() === flUser._id, `freelancerId=${assign.data.project?.freelancerId}`);
    }

    // SUBMISSIONS + AI REVIEW
    if (milestoneId) {
      const sub = await req('POST', '/submissions', {
        milestoneId,
        repoLink: 'https://github.com/testuser/ecommerce-project',
        deployLink: 'https://ecommerce-demo.vercel.app',
        notes: 'Completed frontend with React, Stripe checkout, product catalog, cart, auth. All checklist items done.'
      }, flToken);
      test('Submit work (201)', sub.status === 201 && sub.data.submission, `status=${sub.status}, error=${sub.data.error || 'none'}`);
      test('Submission status=ai_reviewing', sub.data.submission?.status === 'ai_reviewing', `status=${sub.data.submission?.status}`);

      const empSub = await req('POST', '/submissions', { milestoneId, notes: 'nope' }, empToken);
      test('Employer cannot submit (403)', empSub.status === 403, `status=${empSub.status}`);

      // Poll for AI review completion
      let reviewed = false;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const check = await req('GET', `/submissions/${milestoneId}`, null, flToken);
        if (check.data.submissions?.[0]?.status !== 'ai_reviewing') {
          const s = check.data.submissions[0];
          reviewed = true;
          test('AI review completed', ['approved', 'needs_revision'].includes(s.status), `status=${s.status}`);
          test('AI verdict is COMPLETE/PARTIAL/FAILED', ['COMPLETE', 'PARTIAL', 'FAILED'].includes(s.aiVerdict), `verdict=${s.aiVerdict}`);
          test('AI score 0-1', s.aiScore >= 0 && s.aiScore <= 1, `score=${s.aiScore}`);
          test('AI analysis populated', !!s.aiAnalysis, `analysis=${s.aiAnalysis?.slice(0, 80)}`);
          test('Payment decision made', s.paymentAmount >= 0, `paymentReleased=${s.paymentReleased}, amount=${s.paymentAmount}`);
          test('reviewedAt timestamp set', !!s.reviewedAt, `reviewedAt=${s.reviewedAt}`);
          break;
        }
      }
      if (!reviewed) test('AI review completed within 30s', false, 'Timed out');
    }

    // PFI
    if (flUser) {
      const pfi = await req('GET', `/pfi/${flUser._id}`, null, flToken);
      test('Fetch PFI (200 + score)', pfi.status === 200 && pfi.data.pfiScore != null, `status=${pfi.status}`);
      test('PFI score in range 300-850', pfi.data.pfiScore >= 300 && pfi.data.pfiScore <= 850, `score=${pfi.data.pfiScore}`);
      test('PFI category has label', !!pfi.data.category?.label, `label=${pfi.data.category?.label}`);
      test('PFI stats present', pfi.data.stats != null, `stats=${JSON.stringify(pfi.data.stats)}`);
      test('PFI recentSubmissions array', Array.isArray(pfi.data.recentSubmissions), `type=${typeof pfi.data.recentSubmissions}`);
    }

    // ESCROW after AI payment
    if (projectId) {
      const projAfter = await req('GET', `/projects/${projectId}`, null, empToken);
      test('Escrow balance decreased after AI payment', projAfter.data.project?.escrowBalance < 5000, `balance=${projAfter.data.project?.escrowBalance}`);
    }

    // DELETE PROJECT
    const throwaway = await req('POST', '/projects', { title: `Throwaway_${ts}`, description: 'delete test', totalFunds: 100 }, empToken);
    if (throwaway.data.project) {
      const delId = throwaway.data.project._id;
      const del = await req('DELETE', `/projects/${delId}`, null, empToken);
      test('Delete pending project (200)', del.status === 200, `status=${del.status}`);
      const gone = await req('GET', `/projects/${delId}`, null, empToken);
      test('Deleted project returns 404', gone.status === 404, `status=${gone.status}`);
    }

    // ESCROW EDGE CASES
    const escProj = await req('POST', '/projects', { title: `EscrowEdge_${ts}`, description: 'escrow edge tests', totalFunds: 1000 }, empToken);
    if (escProj.data.project) {
      const escId = escProj.data.project._id;
      await req('POST', '/escrow/deposit', { projectId: escId, amount: 1000 }, empToken);

      const release = await req('POST', '/escrow/release', { projectId: escId, amount: 300 }, empToken);
      test('Escrow release (200, balance=700)', release.status === 200 && release.data.project?.escrowBalance === 700, `status=${release.status}, balance=${release.data.project?.escrowBalance}`);

      const overRelease = await req('POST', '/escrow/release', { projectId: escId, amount: 9999 }, empToken);
      test('Over-release rejected (400)', overRelease.status === 400, `status=${overRelease.status}`);

      const refund = await req('POST', '/escrow/refund', { projectId: escId }, empToken);
      test('Escrow refund (200, balance=0, cancelled)', refund.status === 200 && refund.data.project?.escrowBalance === 0 && refund.data.project?.status === 'cancelled', `status=${refund.status}, balance=${refund.data.project?.escrowBalance}, projStatus=${refund.data.project?.status}`);
    }

  } catch (err) {
    results.push({ label: 'FATAL ERROR', pass: false, detail: err.message });
  }
  save();
  process.exit(results.every(r => r.pass) ? 0 : 1);
})();
