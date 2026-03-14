import dotenv from 'dotenv';
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Helper: call OpenAI Chat Completions API
 */
async function callGPT(prompt, temperature = 0.3) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Clean up potential markdown formatting
  const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();

  return JSON.parse(cleanedContent);
}

/**
 * Analyze project description and generate structured milestones
 */
export async function analyzeProjectRequirements(description, totalBudget) {
  const prompt = `You are an expert project manager for a freelance platform. 
Analyze the following project description and break it into 3-5 structured milestones.

Project Description: "${description}"
Total Budget: $${totalBudget}

Return a JSON object with this exact structure:
{
  "milestones": [
    {
      "title": "Milestone title",
      "description": "Detailed description of deliverables",
      "checklist": ["item 1", "item 2", "item 3"],
      "paymentPercentage": 25,
      "estimatedDays": 7,
      "order": 1
    }
  ],
  "techStack": ["technology1", "technology2"],
  "estimatedDuration": "X weeks",
  "riskLevel": "low|medium|high"
}

Rules:
- paymentPercentage must sum to 100
- Include specific, verifiable checklist items
- Be realistic about timelines
- Return ONLY valid JSON`;

  return callGPT(prompt, 0.3);
}

/**
 * AI Quality Assurance — evaluate a submission against milestone requirements
 */
export async function evaluateSubmission(milestoneTitle, milestoneDescription, checklist, repoLink, notes) {
  const checklistText = checklist.map((c) => `- ${c.item}`).join('\n');

  const prompt = `You are an AI quality assurance agent for a freelance development platform.

Evaluate this freelancer's submission:

MILESTONE: ${milestoneTitle}
DESCRIPTION: ${milestoneDescription}
CHECKLIST REQUIREMENTS:
${checklistText}

FREELANCER'S SUBMISSION:
- Repository: ${repoLink || 'Not provided'}
- Notes: ${notes || 'No notes provided'}

Assess the submission quality based on:
1. Whether the repo link/description suggests the work was done
2. Completeness of claimed deliverables  
3. Professionalism of submission

Return JSON:
{
  "verdict": "COMPLETE|PARTIAL|FAILED",
  "confidenceScore": 0.0-1.0,
  "analysis": "Brief explanation of verdict",
  "completedItems": ["item that appears done"],
  "missingItems": ["item that may be missing"],
  "recommendations": "What the freelancer should improve"
}

Return ONLY valid JSON.`;

  return callGPT(prompt, 0.2);
}

/**
 * Decision engine: determine payment based on AI confidence score
 */
export function makePaymentDecision(confidenceScore, paymentAmount) {
  if (confidenceScore >= 0.8) {
    return { action: 'RELEASE_FULL', amount: paymentAmount, reason: 'High confidence — full payment released' };
  } else if (confidenceScore >= 0.5) {
    const partialAmount = Math.round(paymentAmount * confidenceScore);
    return { action: 'RELEASE_PARTIAL', amount: partialAmount, reason: `Partial confidence (${Math.round(confidenceScore * 100)}%) — partial payment` };
  } else {
    return { action: 'REFUND', amount: 0, reason: 'Low confidence — refund triggered, revision required' };
  }
}
