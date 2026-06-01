/**
 * FounderMath Email Worker
 * Cloudflare Worker — handles email capture via Resend API
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to Cloudflare Dashboard → Workers & Pages → Create Worker
 * 2. Name it: foundermath-email
 * 3. Paste this entire file into the editor
 * 4. Click "Settings" → "Variables and Secrets" → "Add" → Secret
 *    - Variable name: RESEND_API_KEY
 *    - Value: your Resend API key (re_...)
 * 5. Deploy
 */

export default {
    async fetch(request, env) {

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders() });
        }

        if (request.method !== 'POST') {
            return jsonResponse({ error: 'Method not allowed' }, 405);
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return jsonResponse({ error: 'Invalid request body' }, 400);
        }

        const {
            name, email, score, grade, runway, ltvcac, mrr, arr,
            churn, payback, model, quickRatio, ruleOf40, nrr, magicNumber
        } = body;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return jsonResponse({ error: 'A valid email address is required.' }, 400);
        }

        if (!env.RESEND_API_KEY) {
            return jsonResponse({ error: 'Email service not configured.' }, 500);
        }

        const firstName = (name || '').trim().split(' ')[0] || 'Founder';

        // Send score report to the user
        const userRes = await sendEmail(env.RESEND_API_KEY, {
            from: 'FounderMath <foundermath@coastlinedigitalsolutions.com>',
            to: email,
            reply_to: 'info@coastlinedigitalsolutions.com',
            subject: `Your FounderMath Score: ${score}/100 — Grade ${grade}`,
            html: buildUserEmail({ firstName, score, grade, runway, ltvcac, mrr, arr, churn, payback, model, quickRatio, ruleOf40, nrr, magicNumber }),
        });

        // Send lead notification to Coastline
        await sendEmail(env.RESEND_API_KEY, {
            from: 'FounderMath <foundermath@coastlinedigitalsolutions.com>',
            to: 'info@coastlinedigitalsolutions.com',
            subject: `[New Lead] ${firstName} scored ${score}/100 on FounderMath`,
            html: buildLeadEmail({ name, email, score, grade, runway, ltvcac, mrr, arr, churn, model, quickRatio, ruleOf40, nrr }),
        });

        if (!userRes.ok) {
            const err = await userRes.text();
            console.error('Resend error:', err);
            return jsonResponse({ error: 'Failed to send email. Please try again.' }, 500);
        }

        return jsonResponse({ ok: true });
    }
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
}

async function sendEmail(apiKey, payload) {
    return fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

function scoreColor(score) {
    if (score >= 75) return '#4ecdc4';
    if (score >= 55) return '#f5a623';
    return '#ff4444';
}

function gradeVerdict(score) {
    if (score >= 85) return 'Your fundamentals are strong. The next stage is about scale — and Coastline can help you find the lever that unlocks it.';
    if (score >= 70) return 'Solid model with clear upside. A few targeted improvements could move you into top-quartile territory.';
    if (score >= 55) return 'The model works, but specific metrics are holding you back. These are fixable with the right framework.';
    if (score >= 40) return 'Multiple risk factors identified. Without structural changes, growth will be expensive and fragile.';
    return 'Urgent action needed on core metrics. The good news: these problems are well-understood and solvable.';
}

// ─── User Email (mobile-responsive) ─────────────────────────────────────────

function buildUserEmail({ firstName, score, grade, runway, ltvcac, mrr, arr, churn, payback, model, quickRatio, ruleOf40, nrr, magicNumber }) {
    const color   = scoreColor(score);
    const verdict = gradeVerdict(score);

    const rows = [
        ['Business Model',       model.charAt(0).toUpperCase() + model.slice(1)],
        ['Runway',               runway >= 999 ? 'Default Alive ✓' : `${runway} months`],
        ['LTV : CAC Ratio',      ltvcac > 0 ? `${ltvcac}:1` : 'N/A (add CAC spend)'],
        ['Monthly Churn',        `${churn}%`],
        ['CAC Payback Period',   payback > 0 ? `${payback} months` : 'N/A'],
        ['MRR (projected)',      `$${Number(mrr).toLocaleString()}`],
        ['ARR (projected)',      `$${Number(arr).toLocaleString()}`],
        ['Quick Ratio',          quickRatio > 0 ? Number(quickRatio).toFixed(1) : 'N/A'],
        ['Net Revenue Retention',`${nrr}%`],
        ['Rule of 40',           `${ruleOf40 >= 0 ? '+' : ''}${ruleOf40}`],
        ['Magic Number',         magicNumber > 0 ? Number(magicNumber).toFixed(2) : 'N/A'],
    ];

    const tableRows = rows.map(([label, value]) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #1a1a1a;font-size:13px;color:#666;width:55%;">${label}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #1a1a1a;font-size:13px;color:#ffffff;font-weight:500;text-align:right;">${value}</td>
        </tr>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Your FounderMath Score</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#000000;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#000000;">
  <tr>
    <td align="center" style="padding:24px 12px;">

      <!-- Main container -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:580px;">

        <!-- Header -->
        <tr>
          <td style="padding:32px 24px 24px;border-bottom:1px solid #111111;">
            <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#444444;">Coastline Digital Solutions</p>
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#333333;">FounderMath &middot; Startup Reality Check</p>
          </td>
        </tr>

        <!-- Score -->
        <tr>
          <td style="padding:40px 24px 32px;border-bottom:1px solid #111111;text-align:center;">
            <p style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#555555;">Your Score</p>
            <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:72px;font-weight:200;color:${color};line-height:1;letter-spacing:-2px;">${score}<span style="font-size:28px;color:#2a2a2a;font-weight:200;"> / 100</span></p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:18px;font-weight:400;color:${color};">Grade ${grade}</p>
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:300;color:#888888;line-height:1.7;max-width:460px;margin:0 auto;">${verdict}</p>
          </td>
        </tr>

        <!-- Metrics table -->
        <tr>
          <td style="padding:32px 24px;border-bottom:1px solid #111111;">
            <p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#555555;">Full Breakdown</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #1a1a1a;border-collapse:collapse;">
              ${tableRows}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:40px 24px;border-bottom:1px solid #111111;">
            <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#555555;">Next Step</p>
            <p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:22px;font-weight:200;color:#ffffff;line-height:1.3;">${firstName}, let's fix your most critical metric.</p>
            <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:300;color:#666666;line-height:1.7;">Coastline's clients typically close their biggest metric gap within 90 days of a Strategic Audit. Free, focused, and specific to your model.</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="background-color:#ffffff;">
                  <a href="https://coastlinedigitalsolutions.com/index.html#contact" style="display:inline-block;padding:16px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#000000;text-decoration:none;">Book a Free Strategic Audit &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Report upsell -->
        <tr>
          <td style="padding:24px;background-color:#080808;border-bottom:1px solid #111111;">
            <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;color:#555555;line-height:1.6;">Want an investor-ready PDF? The full FounderMath report includes benchmarks with sources, month-by-month projections, and recommendations formatted for pitch decks.</p>
            <a href="https://coastlinedigitalsolutions.com/calculator.html" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;color:#888888;text-decoration:underline;">Get the Full Report &mdash; $29 &rarr;</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:28px 24px;">
            <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;color:#333333;line-height:1.8;">Coastline Digital Solutions &middot; BC, Canada</p>
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;color:#333333;">
              <a href="https://coastlinedigitalsolutions.com" style="color:#444444;text-decoration:none;">coastlinedigitalsolutions.com</a>
            </p>
            <p style="margin:12px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:10px;color:#222222;">You received this because you entered your email at FounderMath. No further emails unless you take action.</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}

// ─── Lead Notification Email ─────────────────────────────────────────────────

function buildLeadEmail({ name, email, score, grade, runway, ltvcac, mrr, arr, churn, model, quickRatio, ruleOf40, nrr }) {
    const urgency = score < 50
        ? '🔴 Low score — likely in pain, high intent'
        : score < 70
        ? '🟡 Warm lead — key gaps identified'
        : '🟢 Strong lead — looking to scale';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f4f4;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:520px;background-color:#ffffff;border-radius:6px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background-color:#000000;padding:20px 28px;">
            <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;">New FounderMath Lead</p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#888888;">${urgency}</p>
          </td>
        </tr>

        <!-- Details -->
        <tr>
          <td style="padding:28px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:12px;color:#999999;width:45%;">Name</td><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#111111;">${name || '—'}</td></tr>
              <tr><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:12px;color:#999999;">Email</td><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:13px;color:#111111;"><a href="mailto:${email}" style="color:#000000;">${email}</a></td></tr>
              <tr><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:12px;color:#999999;">Score</td><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:20px;font-weight:700;color:#111111;">${score}<span style="font-size:13px;color:#999;">/100 &nbsp;(${grade})</span></td></tr>
              <tr><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:12px;color:#999999;">Model</td><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:13px;color:#111111;">${model}</td></tr>
              <tr><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:12px;color:#999999;">Runway</td><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:13px;color:#111111;">${runway >= 999 ? 'Default Alive' : runway + ' months'}</td></tr>
              <tr><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:12px;color:#999999;">LTV:CAC</td><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:13px;color:#111111;">${ltvcac > 0 ? ltvcac + ':1' : 'N/A'}</td></tr>
              <tr><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:12px;color:#999999;">MRR</td><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:13px;color:#111111;">$${Number(mrr).toLocaleString()}</td></tr>
              <tr><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:12px;color:#999999;">ARR</td><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:13px;color:#111111;">$${Number(arr).toLocaleString()}</td></tr>
              <tr><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:12px;color:#999999;">Churn</td><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:13px;color:#111111;">${churn}%/mo</td></tr>
              <tr><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:12px;color:#999999;">Quick Ratio</td><td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-family:Arial,sans-serif;font-size:13px;color:#111111;">${quickRatio > 0 ? quickRatio : 'N/A'}</td></tr>
              <tr><td style="padding:9px 0;font-family:Arial,sans-serif;font-size:12px;color:#999999;">Rule of 40</td><td style="padding:9px 0;font-family:Arial,sans-serif;font-size:13px;color:#111111;">${ruleOf40 >= 0 ? '+' : ''}${ruleOf40}</td></tr>
            </table>

            <!-- Action prompt -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:20px;">
              <tr>
                <td style="background-color:#f9f9f9;padding:16px;border-radius:4px;">
                  <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#111111;">Suggested next step</p>
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#666666;">Reply to this email to reach out to <strong>${name || 'this lead'}</strong> and book a Strategic Audit. Their email: <a href="mailto:${email}" style="color:#000000;">${email}</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
