import { Project } from '../models.js';
import { Milestone } from '../models.js';
import { Submission } from '../models.js';

/**
 * Rule-based chatbot — uses keyword matching + live MongoDB data
 * to answer common questions about the TrustLayer platform.
 *
 * Returns { reply: string, quickReplies: string[] }
 */

// ── Helpers ──────────────────────────────────────────────────

async function getUserProjects(user) {
  const query = user.role === 'employer'
    ? { employerId: user._id }
    : { freelancerId: user._id };
  return Project.find(query).lean();
}

async function getProjectMilestones(projectId) {
  return Milestone.find({ projectId }).lean();
}

function formatCurrency(n) {
  return `$${Number(n).toLocaleString()}`;
}

function formatDate(d) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fuzzyMatch(query, target) {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (t.includes(q) || q.includes(t)) return true;
  // Simple word overlap
  const qWords = q.split(/\s+/);
  const tWords = t.split(/\s+/);
  const overlap = qWords.filter(w => tWords.some(tw => tw.includes(w) || w.includes(tw)));
  return overlap.length >= Math.min(qWords.length, 1);
}

function extractProjectName(text) {
  // "about project X", "project called X", "project named X", "details on X project"
  const patterns = [
    /(?:about|details?\s+(?:on|of|for))\s+(?:project\s+)?["']?(.+?)["']?\s*$/i,
    /project\s+(?:called|named|titled)\s+["']?(.+?)["']?\s*$/i,
    /(?:tell me about|show me|info on)\s+["']?(.+?)["']?\s*$/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return m[1].replace(/^(the|project)\s+/i, '').trim();
  }
  return null;
}

// ── Intent Detection ─────────────────────────────────────────

function detectIntent(text, previousIntent) {
  const t = text.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|howdy|greetings|yo|sup|hola)\b/.test(t)) return 'greeting';

  // Help / what can you do
  if (/what (can|do) you (do|help)|help me|how (can|do) (you|i)|assist/i.test(t)) return 'help';

  // Follow-up / "tell me more"
  if (/^(tell me more|more (details?|info)|go on|continue|elaborate|what else|and\?)\s*$/i.test(t)) return 'followup';

  // Specific project lookup
  if (/(?:about|details?\s+(?:on|of|for))\s+(?:project)?\s*.+/i.test(t) ||
      /project\s+(?:called|named|titled)\s+.+/i.test(t)) return 'specific_project';

  // Project listing
  if (/my project|list.*(project|work)|show.*(project|work)|what project|how many project/i.test(t)) return 'projects';

  // Project status
  if (/project.*(status|progress|update)|status.*(project|work)/i.test(t)) return 'project_status';

  // Submission status
  if (/submission.*(status|update|result)|latest submission|my submission|review (status|result)|evaluation (status|result)/i.test(t)) return 'submission_status';

  // Milestones
  if (/milestone|deliverable|task|checklist/i.test(t)) return 'milestones';

  // Deadlines
  if (/deadline|due date|due by|when.*(due|finish|complete)/i.test(t)) return 'deadlines';

  // Payment / money / escrow
  if (/payment|pay|escrow|earn|money|fund|budget|balance|salary|income/i.test(t)) return 'payments';

  // PFI score
  if (/pfi|score|rating|fidelity|reliability|trust score/i.test(t)) return 'pfi';

  // Dispute / issue
  if (/dispute|problem|issue|complaint|refund|not fair|disagree|wrong/i.test(t)) return 'dispute';

  // Account / profile
  if (/my account|my profile|settings|change password|update (my |)(email|name|profile)|account (info|details)/i.test(t)) return 'account';

  // How the platform works
  if (/how.*(work|platform|trustlayer|site|system)|explain|what is (trustlayer|this|the platform)/i.test(t)) return 'platform';

  // Find work / search gigs
  if (/find.*(work|gig|job|project)|search.*(gig|project|work)|browse|available.*(project|work|gig)/i.test(t)) return 'find_work';

  // Submission
  if (/submit|submission|upload|deliver/i.test(t)) return 'submission';

  // Thank you
  if (/thank|thanks|thx|ty/i.test(t)) return 'thanks';

  // Goodbye
  if (/bye|goodbye|see you|later|cya/i.test(t)) return 'goodbye';

  return 'unknown';
}

// ── Determine previous intent from message history ───────────
function getPreviousIntent(messages) {
  // Walk backwards through messages to find the last user message before the current one
  for (let i = messages.length - 2; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return detectIntent(messages[i].content, null);
    }
  }
  return null;
}

// ── Response helpers ─────────────────────────────────────────
function resp(reply, quickReplies = []) {
  return { reply, quickReplies };
}

// ── Response Generators ──────────────────────────────────────

const handlers = {
  greeting: async (user) => {
    return resp(
      `Hi ${user.name}! 👋 I'm TrustLayer's assistant. I can help you with your projects, milestones, payments, and more. Just ask!`,
      ['My projects', 'Milestones', 'Payments', user.role === 'freelancer' ? 'PFI score' : 'How does it work?']
    );
  },

  help: async (user) => {
    const items = [
      '📂 **My projects** — View your current projects',
      '🎯 **Milestones** — Check milestone progress',
      '⏰ **Deadlines** — See upcoming deadlines',
      '💰 **Payments** — Check escrow & payment info',
      '📋 **Submission status** — Check your latest submissions',
    ];
    if (user.role === 'freelancer') {
      items.push('📊 **PFI score** — View your reliability score');
      items.push('🔍 **Find work** — Tips on finding projects');
    }
    items.push('ℹ️ **How does TrustLayer work?** — Platform overview');
    items.push('👤 **My account** — View account info');

    return resp(
      `Here's what I can help you with:\n\n${items.join('\n')}`,
      ['My projects', 'Milestones', 'Payments', 'My account']
    );
  },

  projects: async (user) => {
    const projects = await getUserProjects(user);
    if (projects.length === 0) {
      const msg = user.role === 'employer'
        ? `You don't have any projects yet. Head to **New Project** in the sidebar to create one!`
        : `You haven't picked up any projects yet. Check the **Find Work** section to browse available projects.`;
      return resp(msg, user.role === 'employer' ? ['Create a project', 'How does it work?'] : ['Find work', 'How does it work?']);
    }

    const lines = projects.map((p, i) =>
      `${i + 1}. **${p.title}** — Status: \`${p.status.toUpperCase()}\`, Budget: ${formatCurrency(p.totalFunds)}`
    );
    return resp(
      `You have ${projects.length} project${projects.length > 1 ? 's' : ''}:\n\n${lines.join('\n')}`,
      ['Project status', 'Milestones', 'Deadlines', 'Payments']
    );
  },

  project_status: async (user) => {
    const projects = await getUserProjects(user);
    if (projects.length === 0) return resp(`You don't have any active projects right now.`, ['Find work', 'How does it work?']);

    const lines = await Promise.all(projects.map(async (p) => {
      const milestones = await getProjectMilestones(p._id);
      const done = milestones.filter(m => ['approved', 'paid'].includes(m.status)).length;
      return `📂 **${p.title}** — \`${p.status.toUpperCase()}\`\n   Progress: ${done}/${milestones.length} milestones complete | Escrow: ${formatCurrency(p.escrowBalance)}`;
    }));
    return resp(lines.join('\n\n'), ['Milestones', 'Deadlines', 'Payments']);
  },

  specific_project: async (user, text) => {
    const projectName = extractProjectName(text);
    if (!projectName) {
      return resp(`I couldn't identify the project name. Try saying something like **"tell me about project Website Redesign"**.`, ['My projects']);
    }

    const projects = await getUserProjects(user);
    const match = projects.find(p => fuzzyMatch(projectName, p.title));

    if (!match) {
      const available = projects.map(p => p.title).join(', ');
      return resp(
        `I couldn't find a project matching **"${projectName}"**.\n\n${projects.length > 0 ? `Your projects: ${available}` : 'You have no projects yet.'}`,
        projects.length > 0 ? projects.slice(0, 3).map(p => `About ${p.title}`) : ['My projects']
      );
    }

    const milestones = await getProjectMilestones(match._id);
    const done = milestones.filter(m => ['approved', 'paid'].includes(m.status)).length;
    const active = milestones.find(m => m.status === 'active');

    const lines = [
      `📂 **${match.title}**`,
      ``,
      `• **Status:** \`${match.status.toUpperCase()}\``,
      `• **Budget:** ${formatCurrency(match.totalFunds)}`,
      `• **Escrow:** ${formatCurrency(match.escrowBalance)}`,
      `• **Deadline:** ${formatDate(match.deadline)}`,
      `• **Progress:** ${done}/${milestones.length} milestones complete`,
    ];
    if (match.techStack?.length > 0) {
      lines.push(`• **Tech Stack:** ${match.techStack.join(', ')}`);
    }
    if (active) {
      lines.push(`\n🟢 **Active Milestone:** ${active.title} (${formatCurrency(active.paymentAmount)})`);
    }

    return resp(lines.join('\n'), ['Milestones', 'Deadlines', 'Payments']);
  },

  milestones: async (user) => {
    const projects = await getUserProjects(user);
    if (projects.length === 0) return resp(`No projects found, so no milestones to show.`, ['Find work', 'How does it work?']);

    const sections = await Promise.all(projects.map(async (p) => {
      const milestones = await getProjectMilestones(p._id);
      if (milestones.length === 0) return `📂 **${p.title}** — No milestones yet.`;

      const mLines = milestones
        .sort((a, b) => a.order - b.order)
        .map(m => {
          const icon = { locked: '🔒', active: '🟢', submitted: '📤', ai_reviewing: '🤖', approved: '✅', rejected: '❌', paid: '💰' }[m.status] || '⚪';
          return `  ${icon} ${m.title} — \`${m.status.toUpperCase()}\` (${formatCurrency(m.paymentAmount)})`;
        });
      return `📂 **${p.title}**:\n${mLines.join('\n')}`;
    }));
    return resp(sections.join('\n\n'), ['Deadlines', 'Payments', 'Submission status']);
  },

  deadlines: async (user) => {
    const projects = await getUserProjects(user);
    if (projects.length === 0) return resp(`No projects found, so no deadlines to show.`, ['Find work']);

    const lines = [];
    for (const p of projects) {
      lines.push(`📂 **${p.title}** — Project deadline: **${formatDate(p.deadline)}**`);
      const milestones = await getProjectMilestones(p._id);
      for (const m of milestones.filter(m => !['approved', 'paid'].includes(m.status))) {
        const daysLeft = m.deadline ? Math.ceil((new Date(m.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
        const urgency = daysLeft !== null && daysLeft <= 3 ? ' ⚠️' : '';
        lines.push(`   ⏰ ${m.title} — Due: **${formatDate(m.deadline)}**${daysLeft !== null ? ` (${daysLeft > 0 ? daysLeft + ' days left' : 'OVERDUE!'})` : ''}${urgency}`);
      }
    }
    return resp(lines.join('\n'), ['Milestones', 'Payments', 'My projects']);
  },

  payments: async (user) => {
    const projects = await getUserProjects(user);
    if (projects.length === 0) return resp(`No payment info available — you have no projects yet.`, ['Find work', 'My projects']);

    const lines = projects.map(p =>
      `📂 **${p.title}** — Budget: ${formatCurrency(p.totalFunds)} | Escrow: ${formatCurrency(p.escrowBalance)}`
    );

    const totalBudget = projects.reduce((s, p) => s + (p.totalFunds || 0), 0);
    const totalEscrow = projects.reduce((s, p) => s + (p.escrowBalance || 0), 0);

    return resp(
      `${lines.join('\n')}\n\n**Totals across all projects:**\n💰 Budget: ${formatCurrency(totalBudget)} | 🔐 In Escrow: ${formatCurrency(totalEscrow)}`,
      ['Milestones', 'Deadlines', 'My projects']
    );
  },

  submission_status: async (user) => {
    if (user.role === 'employer') {
      return resp(
        `As an employer, you can review freelancer submissions from your project's milestone page. The AI will automatically evaluate submissions when they're submitted.`,
        ['My projects', 'Milestones']
      );
    }

    // Find this freelancer's latest submissions
    const submissions = await Submission.find({ freelancerId: user._id })
      .sort({ submittedAt: -1 })
      .limit(5)
      .populate('milestoneId', 'title')
      .populate('projectId', 'title')
      .lean();

    if (submissions.length === 0) {
      return resp(`You haven't submitted any work yet. Start by working on an active milestone!`, ['Milestones', 'My projects']);
    }

    const lines = submissions.map((s, i) => {
      const icon = { pending: '⏳', ai_reviewing: '🤖', approved: '✅', rejected: '❌', needs_revision: '🔄' }[s.status] || '⚪';
      const scorePart = s.aiScore !== null ? ` | AI Score: **${s.aiScore}/100**` : '';
      const paymentPart = s.paymentReleased ? ` | 💰 ${formatCurrency(s.paymentAmount)} released` : '';
      return `${i + 1}. ${icon} **${s.milestoneId?.title || 'Unknown'}** (${s.projectId?.title || 'Unknown'})\n   Status: \`${s.status.toUpperCase()}\`${scorePart}${paymentPart}\n   Submitted: ${formatDate(s.submittedAt)}`;
    });

    return resp(
      `📋 **Your latest submissions:**\n\n${lines.join('\n\n')}`,
      ['Milestones', 'Payments', 'PFI score']
    );
  },

  pfi: async (user) => {
    if (user.role !== 'freelancer') {
      return resp(
        `PFI (Platform Fidelity Index) scores are for freelancers. As an employer, you can see freelancers' PFI scores when they pick up your projects.`,
        ['My projects', 'How does it work?']
      );
    }
    const score = user.pfiScore ?? 0;
    let tier = 'Needs Improvement';
    let emoji = '🟡';
    if (score >= 750) { tier = 'Exceptional'; emoji = '🟢'; }
    else if (score >= 600) { tier = 'Professional'; emoji = '🔵'; }
    else if (score >= 400) { tier = 'Reliable'; emoji = '🟡'; }
    else if (score >= 200) { tier = 'Developing'; emoji = '🟠'; }
    else { emoji = '🔴'; tier = 'New'; }

    const stats = [
      `${emoji} **Your PFI Score: ${score}/850** (${tier})`,
      ``,
      `• Completed milestones: **${user.completedMilestones || 0}**`,
      `• On-time deliveries: **${user.onTimeDeliveries || 0}**`,
      `• Average AI score: **${user.avgAiScore ? user.avgAiScore.toFixed(1) : 'N/A'}**`,
      ``,
      `The PFI score reflects your reliability on the platform. It goes up when you complete milestones on time with good AI evaluation scores, and down when you miss deadlines or submit low-quality work.`,
      ``,
      `Range: **0** (new) to **850** (highest).`,
    ];

    return resp(stats.join('\n'), ['My projects', 'Submission status', 'Find work']);
  },

  dispute: async (user) => {
    return resp(
      `⚖️ **Handling Disputes on TrustLayer**\n\nIf you're experiencing an issue:\n\n1. **AI scores seem wrong** — The AI evaluates based on milestone checklists. Make sure all checklist items are addressed in your submission.\n2. **Payment concerns** — Payments are held in escrow and released based on AI evaluation scores. Check your milestone details for the AI analysis.\n3. **Deadline issues** — If you're a freelancer and need more time, communicate with the employer early.\n4. **Technical problems** — Try refreshing the page or logging out and back in.\n\n${user.role === 'freelancer' ? 'Tip: Maintaining a high PFI score by delivering quality work on time helps build trust!' : 'Tip: Clear, detailed milestone descriptions help the AI evaluate submissions more accurately.'}`,
      ['Submission status', 'Milestones', 'Payments']
    );
  },

  account: async (user) => {
    const projects = await getUserProjects(user);
    const lines = [
      `👤 **Your Account**`,
      ``,
      `• **Name:** ${user.name}`,
      `• **Email:** ${user.email}`,
      `• **Role:** ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`,
      `• **Member since:** ${formatDate(user.createdAt)}`,
      `• **Active projects:** ${projects.length}`,
    ];
    if (user.role === 'freelancer') {
      lines.push(`• **PFI Score:** ${user.pfiScore ?? 0}/850`);
      lines.push(`• **Completed milestones:** ${user.completedMilestones || 0}`);
    }

    return resp(lines.join('\n'), ['My projects', 'Payments', user.role === 'freelancer' ? 'PFI score' : 'How does it work?']);
  },

  platform: async () => {
    return resp(
      `🌐 **TrustLayer** is an AI-powered freelance platform:\n\n1️⃣ Employers create projects with a budget and deadline\n2️⃣ AI breaks the project into milestones with checklists\n3️⃣ Funds are locked in escrow for security\n4️⃣ Freelancers pick up projects and work on milestones\n5️⃣ When a milestone is submitted, AI evaluates the work\n6️⃣ Based on the AI score, payment is released (full, partial, or held)\n7️⃣ Freelancers build a **PFI** (reliability) score over time\n\nIt's designed to build trust between employers and freelancers through transparent, AI-verified milestones!`,
      ['My projects', 'Find work', 'My account']
    );
  },

  find_work: async (user) => {
    if (user.role === 'employer') {
      return resp(
        `As an employer, you create projects rather than find work. Go to **New Project** in the sidebar to post a new project!`,
        ['Create a project', 'My projects']
      );
    }
    return resp(
      `🔍 **Finding Work on TrustLayer:**\n\n1. Go to **Find Work** in the sidebar\n2. Browse available projects posted by employers\n3. Click on a project to see its details, milestones, and budget\n4. Pick up a project to start working on it\n\n💡 **Tip:** Projects with deadlines closer to today may need immediate attention, but also offer quick payment turnaround!`,
      ['My projects', 'PFI score', 'How does it work?']
    );
  },

  submission: async (user) => {
    if (user.role === 'employer') {
      return resp(
        `As an employer, you can review freelancer submissions from your project's milestone page. The AI will automatically evaluate submissions when they're submitted.`,
        ['My projects', 'Milestones']
      );
    }
    return resp(
      `📤 **Submitting Work for a Milestone:**\n\n1. Go to **My Projects** and select the project\n2. Click on the active milestone\n3. Fill in your repo link, deploy link, and notes\n4. Hit submit — the AI will automatically review your work\n5. Based on the AI score, payment will be released from escrow\n\n💡 **Tip:** Make sure to check off all checklist items before submitting for the best AI score!`,
      ['Milestones', 'Submission status', 'Deadlines']
    );
  },

  followup: async (user, text, previousIntent) => {
    // Route follow-ups to the appropriate enriched handler
    const followupMap = {
      'projects': 'project_status',
      'project_status': 'milestones',
      'milestones': 'deadlines',
      'deadlines': 'payments',
      'payments': 'pfi',
      'greeting': 'help',
      'help': 'projects',
      'pfi': 'submission_status',
      'submission_status': 'milestones',
    };

    const nextIntent = followupMap[previousIntent] || 'help';
    const handler = handlers[nextIntent];
    return handler(user, text, null);
  },

  thanks: async (user) => {
    return resp(
      `You're welcome, ${user.name}! Let me know if you need anything else. 😊`,
      ['My projects', 'Help']
    );
  },

  goodbye: async (user) => {
    return resp(
      `Goodbye, ${user.name}! Good luck with your ${user.role === 'employer' ? 'projects' : 'work'}! 👋`,
      []
    );
  },

  unknown: async (user) => {
    return resp(
      `I'm not sure I understand that. Here are some things you can ask me:\n\n• **My projects** — See your projects\n• **Milestones** — Check milestone progress\n• **Deadlines** — View upcoming deadlines\n• **Payments** — Escrow & payment info\n• **Submission status** — Latest submission results\n• **How does TrustLayer work?** — Platform overview\n${user.role === 'freelancer' ? '• **PFI score** — Your reliability score\n• **Find work** — Tips on finding projects' : ''}• **My account** — Your profile info`,
      ['My projects', 'Milestones', 'Help']
    );
  },
};

// ── Welcome message (for initial chat open) ──────────────────

export function getWelcomeMessage(user) {
  return {
    reply: `Hi ${user.name}! 👋 I'm your TrustLayer assistant. How can I help you today?`,
    quickReplies: [
      'My projects',
      user.role === 'freelancer' ? 'Find work' : 'Create a project',
      'Milestones',
      'How does it work?',
    ],
  };
}

// ── Main Chat Function ───────────────────────────────────────

/**
 * Process a chat message using rule-based intent matching.
 * @param {Object} user     - Mongoose user document (from req.user)
 * @param {Array}  messages - [{ role: 'user'|'assistant', content: string }]
 * @returns {{ reply: string, quickReplies: string[] }}
 */
export async function chat(user, messages) {
  // Use the latest user message
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    return resp(`Please send me a message and I'll do my best to help!`, ['Help', 'My projects']);
  }

  const previousIntent = getPreviousIntent(messages);
  const intent = detectIntent(lastMessage.content, previousIntent);
  const handler = handlers[intent] || handlers.unknown;
  return handler(user, lastMessage.content, previousIntent);
}
