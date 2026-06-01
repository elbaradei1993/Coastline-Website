/**
 * FounderMath Email Worker
 * Cloudflare Worker — handles email capture via Resend API
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to Cloudflare Dashboard → Workers & Pages → Create Worker
 * 2. Name it: foundermath-email
 * 3. Paste this entire file into the editor
 * 4. Click "Settings" → "Variables" → "Add variable"
 *    - Variable name: RESEND_API_KEY
 *    - Value: your Resend API key (re_...)
 *    - Check "Encrypt" — this keeps it secret
 * 5. Deploy
 * 6. (Optional) Add a custom route in Cloudflare DNS:
 *    foundermath-email.coastlinedigitalsolutions.com → this Worker
 * 7. Copy your Worker URL and paste it into calculator.html as WORKER_URL
 */

export default {
    async fetch(request, env) {

        // CORS preflight
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

        const { name, email, score, grade, runway, ltvcac, mrr, arr,
                churn, payback, model, quickRatio, ruleOf40, nrr, magicNumber } = body;

        // Validate email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return jsonResponse({ error: 'A valid email address is required.' }, 400);
        }

        if (!env.RESEND_API_KEY) {
            return jsonResponse({ error: 'Email service not configured.' }, 500);
        }

        const firstName = (name || '').trim().split(' ')[0] || 'Founder';

        // Send score email to the user
        const userRes = await sendEmail(env.RESEND_API_KEY, {
            from: 'FounderMath <foundermath@coastlinedigitalsolutions.com>',
            to: email,
            reply_to: 'info@coastlinedigitalsolutions.com',
            subject: `Your FounderMath Score: ${score}/100 — Grade ${grade}`,
            html: buildUserEmail({ firstName, score, grade, runway, ltvcac, mrr, arr, churn, payback, model, quickRatio, ruleOf40, nrr, magicNumber }),
        });

        // Notify Coastline with lead details
        await sendEmail(env.RESEND_API_KEY, {
            from: 'FounderMath <foundermath@coastlinedigitalsolutions.com>',
            to: 'info@coastlinedigitalsolutions.com',
            subject: `[FounderMath Lead] ${firstName} — Score ${score}/100 (${grade})`,
            html: buildLeadEmail({ name, email, score, grade, runway, ltvcac, mrr, arr, churn, payback, model, quickRatio, ruleOf40, nrr }),
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
    if (score >= 55) return 'The model works, but specific metrics are holding you back. These are fixable — with the right framework.';
    if (score >= 40) return 'Multiple risk factors identified. Without structural changes, growth will be expensive and fragile.';
    return 'Urgent action needed on core metrics. The good news: these problems are well-understood and solvable.';
}

function metricRow(label, value, note = '') {
    return `
    <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #111;font-size:0.72rem;color:#555;text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap;">${label}</td>
        <td style="padding:14px 20px;border-bottom:1px solid #111;font-size:0.95rem;font-weight:300;color:#fff;text-align:right;">${value}</td>
        ${note ? `<td style="padding:14px 20px;border-bottom:1px solid #111;font-size:0.68rem;color:#444;text-align:right;">${note}</td>` : ''}
    </tr>`;
}

function buildUserEmail({ firstName, score, grade, runway, ltvcac, mrr, arr, churn, payback, model, quickRatio, ruleOf40, nrr, magicNumber }) {
    const color = scoreColor(score);
    const verdict = gradeVerdict(score);

    const ltvcacDisplay   = ltvcac > 0   ? `${ltvcac}:1`             : 'N/A (set CAC spend)';
    const paybackDisplay  = payback > 0  ? `${payback} months`        : 'N/A';
    const qrDisplay       = quickRatio > 0 ? quickRatio.toFixed(1)    : 'N/A';
    const mnDisplay       = magicNumber > 0 ? magicNumber.toFixed(2)  : 'N/A';
    const runwayDisplay   = runway >= 999 ? 'Default alive'           : `${runway} months`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your FounderMath Score</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:620px;margin:0 auto;padding:0;">

    <!-- Header -->
    <div style="padding:40px 40px 32px;border-bottom:1px solid #111;">
        <p style="margin:0 0 4px;font-size:0.65rem;letter-spacing:0.25em;text-transform:uppercase;color:#444;">Coastline Digital Solutions</p>
        <p style="margin:0;font-size:0.65rem;letter-spacing:0.25em;text-transform:uppercase;color:#333;">FounderMath · Startup Reality Check</p>
    </div>

    <!-- Score -->
    <div style="padding:48px 40px 40px;border-bottom:1px solid #111;">
        <p style="margin:0 0 16px;font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:#555;">Your Score</p>
        <div style="margin-bottom:12px;">
            <span style="font-size:6rem;font-weight:200;color:${color};line-height:1;letter-spacing:-0.04em;">${score}</span>
            <span style="font-size:2.5rem;font-weight:200;color:#2a2a2a;letter-spacing:-0.02em;"> / 100</span>
        </div>
        <div style="display:inline-block;background:${color}22;border:1px solid ${color}44;padding:6px 16px;margin-bottom:20px;">
            <span style="font-size:0.8rem;font-weight:400;color:${color};letter-spacing:0.08em;">GRADE ${grade}</span>
        </div>
        <p style="margin:0;font-size:0.9rem;font-weight:300;color:#888;line-height:1.7;max-width:480px;">${verdict}</p>
    </div>

    <!-- Metrics -->
    <div style="padding:40px 40px 32px;border-bottom:1px solid #111;">
        <p style="margin:0 0 20px;font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:#555;">Full Breakdown</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #111;">
            ${metricRow('Business Model', model.charAt(0).toUpperCase() + model.slice(1))}
            ${metricRow('Runway', runwayDisplay, runway < 12 ? '⚠ Under 12 months' : '')}
            ${metricRow('LTV : CAC Ratio', ltvcacDisplay, ltvcac < 3 ? '⚠ Below 3:1 investable threshold' : '✓ Investable')}
            ${metricRow('Monthly Churn', `${churn}%`)}
            ${metricRow('Payback Period', paybackDisplay, payback > 18 ? '⚠ Above 18 month benchmark' : '')}
            ${metricRow('MRR (projected)', `$${Number(mrr).toLocaleString()}`)}
            ${metricRow('ARR (projected)', `$${Number(arr).toLocaleString()}`)}
            ${metricRow('Quick Ratio', qrDisplay, quickRatio < 2 ? '⚠ Below healthy threshold (2+)' : '✓ Healthy')}
            ${metricRow('Net Revenue Retention', `${nrr}%`, nrr >= 100 ? '✓ Negative churn' : '⚠ Below 100%')}
            ${metricRow('Rule of 40', `${ruleOf40 >= 0 ? '+' : ''}${ruleOf40}`, ruleOf40 >= 40 ? '✓ Top quartile' : ruleOf40 >= 0 ? 'Approaching' : '⚠ Below zero')}
            ${metricRow('Magic Number', mnDisplay, magicNumber >= 0.75 ? '✓ Efficient growth' : magicNumber > 0 ? 'Improving' : 'N/A')}
        </table>
    </div>

    <!-- CTA -->
    <div style="padding:48px 40px;border-bottom:1px solid #111;">
        <p style="margin:0 0 8px;font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:#555;">Next Step</p>
        <h2 style="margin:0 0 20px;font-size:1.5rem;font-weight:200;color:#fff;line-height:1.3;">${firstName}, let's fix your<br>most critical metric.</h2>
        <p style="margin:0 0 32px;font-size:0.9rem;font-weight:300;color:#666;line-height:1.7;max-width:440px;">
            Coastline's clients typically close their biggest metric gap within 90 days of a Strategic Audit. The audit is free, focused, and specific to your model.
        </p>
        <a href="https://coastlinedigitalsolutions.com/index.html#contact"
           style="display:inline-block;background:#ffffff;color:#000000;padding:16px 32px;text-decoration:none;font-size:0.75rem;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;">
            Book a Free Strategic Audit →
        </a>
    </div>

    <!-- Paid report nudge -->
    <div style="padding:32px 40px;border-bottom:1px solid #111;background:#0a0a0a;">
        <p style="margin:0 0 8px;font-size:0.75rem;color:#555;line-height:1.6;">
            Want the investor-ready version of this report? The full FounderMath PDF includes benchmarks with sources, month-by-month projections, and formatted recommendations ready to share with investors.
        </p>
        <a href="https://coastlinedigitalsolutions.com/calculator.html"
           style="font-size:0.72rem;color:#888;text-decoration:underline;">
            Get the Full Report — $19 →
        </a>
    </div>

    <!-- Footer -->
    <div style="padding:32px 40px;">
        <p style="margin:0;font-size:0.65rem;color:#333;line-height:1.8;">
            Coastline Digital Solutions · BC, Canada<br>
            <a href="https://coastlinedigitalsolutions.com" style="color:#444;text-decoration:none;">coastlinedigitalsolutions.com</a> ·
            <a href="mailto:info@coastlinedigitalsolutions.com" style="color:#444;text-decoration:none;">info@coastlinedigitalsolutions.com</a>
        </p>
        <p style="margin:12px 0 0;font-size:0.6rem;color:#222;">You received this because you entered your email at FounderMath. No further emails unless you take action.</p>
    </div>

</div>
</body>
</html>`;
}

function buildLeadEmail({ name, email, score, grade, runway, ltvcac, mrr, arr, churn, payback, model, quickRatio, ruleOf40, nrr }) {
    const urgency = score < 50 ? '🔴 Urgent — low score, likely in pain' : score < 70 ? '🟡 Warm lead — key gaps identified' : '🟢 Strong lead — looking to scale';
    return `<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#f4f4f4;padding:32px;margin:0;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
    <div style="background:#000;padding:24px 32px;">
        <h2 style="margin:0;color:#fff;font-size:1.1rem;font-weight:400;">New FounderMath Lead</h2>
        <p style="margin:4px 0 0;color:#666;font-size:0.8rem;">${urgency}</p>
    </div>
    <div style="padding:32px;">
        <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#999;font-size:0.8rem;width:130px;">Name</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:500;">${name || '—'}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#999;font-size:0.8rem;">Email</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><a href="mailto:${email}" style="color:#000;">${email}</a></td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#999;font-size:0.8rem;">Score</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:1.3rem;font-weight:700;">${score}/100 <span style="font-size:0.9rem;color:#999;">(${grade})</span></td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#999;font-size:0.8rem;">Model</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">${model}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#999;font-size:0.8rem;">Runway</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">${runway >= 999 ? 'Default alive' : runway + ' months'}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#999;font-size:0.8rem;">LTV:CAC</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">${ltvcac > 0 ? ltvcac + ':1' : 'N/A'}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#999;font-size:0.8rem;">MRR</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">$${Number(mrr).toLocaleString()}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#999;font-size:0.8rem;">ARR</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">$${Number(arr).toLocaleString()}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#999;font-size:0.8rem;">Churn</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">${churn}%/mo</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#999;font-size:0.8rem;">Quick Ratio</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">${quickRatio > 0 ? quickRatio : 'N/A'}</td></tr>
            <tr><td style="padding:10px 0;color:#999;font-size:0.8rem;">Rule of 40</td><td style="padding:10px 0;">${ruleOf40 >= 0 ? '+' : ''}${ruleOf40}</td></tr>
        </table>
        <div style="margin-top:24px;padding:20px;background:#f9f9f9;border-radius:4px;">
            <p style="margin:0;font-size:0.85rem;color:#666;">Reply to this email or reach <a href="mailto:${email}">${email}</a> to book their Strategic Audit.</p>
        </div>
    </div>
</div>
</body></html>`;
}
