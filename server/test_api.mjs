/**
 * Comprehensive API Test Script for TrustLayer
 * Tests all endpoints in the complete user flow
 */

const BASE = 'http://localhost:5000/api';
const ts = Date.now();

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

function ok(label, condition, detail) {
  console.log(condition ? `✅ ${label}` : `❌ ${label} — ${detail || 'FAILED'}`);
  if (!condition) process.exitCode = 1;
}

(async () => {
  try {
    // ─── 1. Health Check ──────────────────────────────
    console.log('\n═══ HEALTH CHECK ═══');
    const h = await req('GET', '/health');
    ok('Health endpoint', h.status === 200 && h.data.status === 'ok', `status=${h.status}`);

    // ─── 2. Auth: Register Employer ────────────────────
    console.log('\n═══ AUTH ═══');
    const empReg = await req('POST', '/auth/register', {
      name: `TestEmp_${ts}`, email: `emp_${ts}@test.com`, password: 'testpass123', role: 'employer'
    });
    ok('Register employer', empReg.status === 201 && empReg.data.token && empReg.data.user, `status=${empReg.status} — ${JSON.stringify(empReg.data).slice(0,100)}`);
    empToken = empReg.data.token;
    empUser = empReg.data.user;

    // ─── 3. Auth: Register Freelancer ──────────────────
    const flReg = await req('POST', '/auth/register', {
      name: `TestFL_${ts}`, email: `fl_${ts}@test.com`, password: 'testpass123', role: 'freelancer'
    });
    ok('Register freelancer', flReg.status === 201 && flReg.data.token && flReg.data.user, `status=${flReg.status} — ${JSON.stringify(flReg.data).slice(0,100)}`);
    flToken = flReg.data.token;
    flUser = flReg.data.user;

    // ─── 4. Auth: Duplicate registration ───────────────
    const dupReg = await req('POST', '/auth/register', {
      name: 'Dup', email: `emp_${ts}@test.com`, password: 'testpass', role: 'employer'
    });
    ok('Duplicate email blocked', dupReg.status === 409, `status=${dupReg.status}`);

    // ─── 5. Auth: Login ────────────────────────────────
    const empLogin = await req('POST', '/auth/login', { email: `emp_${ts}@test.com`, password: 'testpass123' });
    ok('Login employer', empLogin.status === 200 && empLogin.data.token, `status=${empLogin.status}`);

    const flLogin = await req('POST', '/auth/login', { email: `fl_${ts}@test.com`, password: 'testpass123' });
    ok('Login freelancer', flLogin.status === 200 && flLogin.data.token, `status=${flLogin.status}`);

    // ─── 6. Auth: Wrong password ───────────────────────
    const badPw = await req('POST', '/auth/login', { email: `emp_${ts}@test.com`, password: 'wrong' });
    ok('Wrong password rejected', badPw.status === 401, `status=${badPw.status}`);

    // ─── 7. Auth: /me ──────────────────────────────────
    const me = await req('GET', '/auth/me', null, empToken);
    ok('/me with valid token', me.status === 200 && me.data.user, `status=${me.status}`);

    const noToken = await req('GET', '/auth/me');
    ok('/me without token → 401', noToken.status === 401, `status=${noToken.status}`);

    // ─── 8. Projects: Create (with AI milestones) ──────
    console.log('\n═══ PROJECTS ═══');
    const proj = await req('POST', '/projects', {
      title: `Test Project ${ts}`,
      description: 'Build a full-stack e-commerce website with React frontend, Node.js backend, Stripe payments, and admin dashboard. Include product catalog, cart, checkout, user authentication, and order management.',
      totalFunds: 5000
    }, empToken);
    ok('Create project (AI milestones)', proj.status === 201 && proj.data.project && proj.data.milestones?.length > 0,
      `status=${proj.status} — milestones=${proj.data.milestones?.length || 0} — ${JSON.stringify(proj.data.error || '').slice(0,200)}`);

    if (proj.data.project) {
      projectId = proj.data.project._id;
      console.log(`   📋 Project ID: ${projectId}`);
      console.log(`   🤖 AI generated ${proj.data.milestones?.length} milestones`);
      console.log(`   🔧 Tech stack: ${proj.data.project.techStack?.join(', ')}`);
      console.log(`   ⏱️  Duration: ${proj.data.project.estimatedDuration}`);
    }

    // ─── 9. Projects: Role guard ───────────────────────
    const flCreate = await req('POST', '/projects', {
      title: 'Bad', description: 'nope', totalFunds: 100
    }, flToken);
    ok('Freelancer cannot create project', flCreate.status === 403, `status=${flCreate.status}`);

    // ─── 10. Projects: List ────────────────────────────
    const projList = await req('GET', '/projects', null, empToken);
    ok('List projects (employer)', projList.status === 200 && projList.data.projects?.length > 0, `status=${projList.status}`);

    const flProjList = await req('GET', '/projects', null, flToken);
    ok('List projects (freelancer)', flProjList.status === 200, `status=${flProjList.status}`);

    // ─── 11. Projects: Get single ──────────────────────
    if (projectId) {
      const single = await req('GET', `/projects/${projectId}`, null, empToken);
      ok('Get single project', single.status === 200 && single.data.project && single.data.milestones, `status=${single.status}`);
      ok('Project has populated employerId', !!single.data.project?.employerId?.name, 'missing populated employerId');
    }

    // ─── 12. Milestones ────────────────────────────────
    console.log('\n═══ MILESTONES ═══');
    if (projectId) {
      const msList = await req('GET', `/milestones/${projectId}`, null, empToken);
      ok('Fetch milestones for project', msList.status === 200 && msList.data.milestones?.length > 0, `status=${msList.status}`);

      if (msList.data.milestones?.length > 0) {
        milestoneId = msList.data.milestones[0]._id;
        const firstMs = msList.data.milestones[0];
        ok('First milestone is active', firstMs.status === 'active', `status=${firstMs.status}`);
        ok('Milestone has checklist', firstMs.checklist?.length > 0, `checklist length=${firstMs.checklist?.length}`);
        ok('Milestone has paymentAmount', firstMs.paymentAmount > 0, `amount=${firstMs.paymentAmount}`);
        console.log(`   📌 First milestone: "${firstMs.title}" — $${firstMs.paymentAmount}`);

        // Get single milestone
        const singleMs = await req('GET', `/milestones/single/${milestoneId}`, null, empToken);
        ok('Get single milestone', singleMs.status === 200 && singleMs.data.milestone, `status=${singleMs.status}`);
        ok('Single milestone has populated project', !!singleMs.data.milestone?.projectId?.title, 'missing populated project');
      }
    }

    // ─── 13. Escrow ────────────────────────────────────
    console.log('\n═══ ESCROW ═══');
    if (projectId) {
      const deposit = await req('POST', '/escrow/deposit', { projectId, amount: 5000 }, empToken);
      ok('Deposit to escrow', deposit.status === 200 && deposit.data.project?.escrowBalance === 5000,
        `status=${deposit.status} balance=${deposit.data.project?.escrowBalance}`);

      // Freelancer can't deposit
      const flDeposit = await req('POST', '/escrow/deposit', { projectId, amount: 100 }, flToken);
      ok('Freelancer cannot deposit', flDeposit.status === 403, `status=${flDeposit.status}`);
    }

    // ─── 14. Assign Freelancer ─────────────────────────
    console.log('\n═══ PROJECT ASSIGNMENT ═══');
    if (projectId && flUser) {
      const assign = await req('PATCH', `/projects/${projectId}/assign`, { freelancerId: flUser._id }, flToken);
      ok('Freelancer self-assigns', assign.status === 200 && assign.data.project?.status === 'active',
        `status=${assign.status} projectStatus=${assign.data.project?.status}`);
    }

    // ─── 15. Submissions (AI Review) ───────────────────
    console.log('\n═══ SUBMISSIONS & AI REVIEW ═══');
    if (milestoneId) {
      const sub = await req('POST', '/submissions', {
        milestoneId,
        repoLink: 'https://github.com/testuser/ecommerce-project',
        deployLink: 'https://ecommerce-demo.vercel.app',
        notes: 'Completed the frontend with React, Stripe checkout integration, product catalog, cart, and user auth. All checklist items addressed.'
      }, flToken);
      ok('Submit work', sub.status === 201 && sub.data.submission, `status=${sub.status} — ${JSON.stringify(sub.data.error || '').slice(0,100)}`);

      if (sub.data.submission) {
        console.log(`   📝 Submission ID: ${sub.data.submission._id}`);
        console.log(`   ⏳ Status: ${sub.data.submission.status}`);
      }

      // Employer can't submit
      const empSub = await req('POST', '/submissions', { milestoneId, notes: 'nope' }, empToken);
      ok('Employer cannot submit work', empSub.status === 403, `status=${empSub.status}`);

      // Wait for AI review (async, so poll)
      console.log('   ⏳ Waiting for AI review (up to 30s)...');
      let reviewed = false;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const check = await req('GET', `/submissions/${milestoneId}`, null, flToken);
        if (check.data.submissions?.[0]?.status !== 'ai_reviewing') {
          const s = check.data.submissions[0];
          reviewed = true;
          ok('AI review completed', ['approved', 'needs_revision'].includes(s.status), `status=${s.status}`);
          console.log(`   🤖 AI Verdict: ${s.aiVerdict} (score: ${s.aiScore})`);
          console.log(`   💰 Payment released: ${s.paymentReleased} — $${s.paymentAmount}`);
          console.log(`   📝 Analysis: ${s.aiAnalysis?.slice(0, 150)}`);
          break;
        }
        process.stdout.write('.');
      }
      if (!reviewed) ok('AI review completed within 30s', false, 'Still in ai_reviewing status');
    }

    // ─── 16. PFI Score ─────────────────────────────────
    console.log('\n═══ PFI SCORE ═══');
    if (flUser) {
      const pfi = await req('GET', `/pfi/${flUser._id}`, null, flToken);
      ok('Fetch PFI score', pfi.status === 200 && pfi.data.pfiScore, `status=${pfi.status}`);
      if (pfi.data) {
        console.log(`   📊 PFI Score: ${pfi.data.pfiScore} (${pfi.data.category?.label})`);
        console.log(`   📈 Stats: completed=${pfi.data.stats?.completedMilestones}, rate=${pfi.data.stats?.completionRate}%, onTime=${pfi.data.stats?.onTimeRate}%`);
      }
    }

    // ─── 17. Escrow after payment ──────────────────────
    console.log('\n═══ ESCROW AFTER PAYMENT ═══');
    if (projectId) {
      const projAfter = await req('GET', `/projects/${projectId}`, null, empToken);
      console.log(`   💰 Escrow balance after payment: $${projAfter.data.project?.escrowBalance}`);
    }

    // ─── 18. Delete Project Test ───────────────────────
    console.log('\n═══ PROJECT DELETION ═══');
    // Create a throwaway project to test deletion
    const throwaway = await req('POST', '/projects', {
      title: `Throwaway ${ts}`,
      description: 'Simple task for deletion test',
      totalFunds: 100
    }, empToken);
    if (throwaway.data.project) {
      const delId = throwaway.data.project._id;
      const del = await req('DELETE', `/projects/${delId}`, null, empToken);
      ok('Delete pending project', del.status === 200, `status=${del.status}`);

      // Verify it's gone
      const gone = await req('GET', `/projects/${delId}`, null, empToken);
      ok('Deleted project returns 404', gone.status === 404, `status=${gone.status}`);
    }

    // ─── 19. Escrow release/refund ─────────────────────
    console.log('\n═══ ESCROW RELEASE/REFUND ═══');
    // Create another project for escrow tests
    const escProj = await req('POST', '/projects', {
      title: `EscrowTest ${ts}`,
      description: 'Simple project for escrow edge-case testing',
      totalFunds: 1000
    }, empToken);
    if (escProj.data.project) {
      const escId = escProj.data.project._id;
      await req('POST', '/escrow/deposit', { projectId: escId, amount: 1000 }, empToken);

      // Release
      const release = await req('POST', '/escrow/release', { projectId: escId, amount: 300 }, empToken);
      ok('Release from escrow', release.status === 200 && release.data.project?.escrowBalance === 700,
        `status=${release.status} balance=${release.data.project?.escrowBalance}`);

      // Insufficient balance
      const overRelease = await req('POST', '/escrow/release', { projectId: escId, amount: 9999 }, empToken);
      ok('Over-release rejected', overRelease.status === 400, `status=${overRelease.status}`);

      // Refund
      const refund = await req('POST', '/escrow/refund', { projectId: escId }, empToken);
      ok('Refund escrow', refund.status === 200 && refund.data.project?.escrowBalance === 0 && refund.data.project?.status === 'cancelled',
        `status=${refund.status} balance=${refund.data.project?.escrowBalance} status=${refund.data.project?.status}`);
    }

    console.log('\n════════════════════════════════');
    console.log('🏁 ALL API TESTS COMPLETE');
    console.log('════════════════════════════════\n');

  } catch (err) {
    console.error('❌ FATAL ERROR:', err.message);
    console.error(err.stack);
    process.exitCode = 1;
  }
})();
