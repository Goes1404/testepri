async function postJson(url, headers, body) {
  if (typeof fetch !== 'function') {
    throw new Error('fetch is not available in this Node.js runtime.');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Integration request failed (${response.status}): ${text}`);
  }

  return response.json();
}

async function askClaude({ system, message, history = [], maxTokens = 700 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) return null;

  // Mitigação de custos (ROADMAP Hub E): no máximo 10 mensagens anteriores
  const recentHistory = history.slice(-10);

  const data = await postJson(
    'https://api.anthropic.com/v1/messages',
    {
      'x-api-key': apiKey,
      'anthropic-version': process.env.ANTHROPIC_VERSION || '2023-06-01'
    },
    {
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
      max_tokens: maxTokens,
      system,
      messages: [
        ...recentHistory,
        { role: 'user', content: message }
      ]
    }
  );

  return data.content?.map(part => part.text || '').join('\n').trim() || null;
}

async function sendEmail({ to, subject, text, html, attachments = [] }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL || process.env.SUPPORT_EMAIL;
  if (!apiKey || !from || !to) return { skipped: true };

  await postJson(
    'https://api.sendgrid.com/v3/mail/send',
    { Authorization: `Bearer ${apiKey}` },
    {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [
        { type: 'text/plain', value: text || subject },
        ...(html ? [{ type: 'text/html', value: html }] : [])
      ],
      ...(attachments.length > 0
        ? {
            attachments: attachments.map(att => ({
              content: Buffer.from(att.content).toString('base64'),
              filename: att.filename,
              type: att.type || 'application/octet-stream',
              disposition: 'attachment'
            }))
          }
        : {})
    }
  );

  return { sent: true };
}

async function sendPush({ token, title, body, data = {} }) {
  const serverKey = process.env.FIREBASE_SERVER_KEY || process.env.FCM_SERVER_KEY;
  if (!serverKey || !token) return { skipped: true };

  await postJson(
    'https://fcm.googleapis.com/fcm/send',
    { Authorization: `key=${serverKey}` },
    {
      to: token,
      notification: { title, body },
      data
    }
  );

  return { sent: true };
}

function integrationStatus() {
  return {
    claude: Boolean(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY),
    sendgrid: Boolean(process.env.SENDGRID_API_KEY),
    firebase: Boolean(process.env.FIREBASE_SERVER_KEY || process.env.FCM_SERVER_KEY),
    googleMaps: Boolean(process.env.GOOGLE_MAPS_API_KEY),
    mecProuni: Boolean(process.env.MEC_PROUNI_API_URL),
    inepSisu: Boolean(process.env.INEP_SISU_API_URL),
    fndeFies: Boolean(process.env.FNDE_FIES_API_URL),
    inepEnem: Boolean(process.env.INEP_ENEM_API_URL)
  };
}

module.exports = {
  askClaude,
  sendEmail,
  sendPush,
  integrationStatus
};
