const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { ref, type, nom, prenom, dob, email, tel, discord, pseudo, roster, poste, message, date, heure, pdfBase64 } = data;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  const auth = Buffer.from(`${user}:${pass}`).toString('base64');

  const boundary = 'blackout_boundary_' + Date.now();
  const pdfPart = pdfBase64 ? `--${boundary}\r\nContent-Type: application/pdf\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename="bulletin-${ref}.pdf"\r\n\r\n${pdfBase64}\r\n` : '';

  const body = [
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    `<h2>BLACKOUT OPS ESPORT — Nouvelle adhésion</h2>
    <p><b>Référence :</b> ${ref}</p>
    <p><b>Type :</b> ${type}</p>
    <p><b>Nom :</b> ${prenom} ${nom}</p>
    <p><b>Email :</b> ${email}</p>
    <p><b>Tél :</b> ${tel}</p>
    <p><b>Date :</b> ${date} à ${heure}</p>`,
    pdfPart,
    `--${boundary}--`
  ].join('\r\n');

  const emailData = [
    `From: ${user}`,
    `To: ${user}`,
    `Subject: [ADHESION] ${ref} - ${prenom} ${nom}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    body
  ].join('\r\n');

  const encoded = Buffer.from(emailData).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return new Promise((resolve) => {
    const postData = JSON.stringify({ raw: encoded });
    const options = {
      hostname: 'gmail.googleapis.com',
      path: '/gmail/v1/users/me/messages/send',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      resolve({ statusCode: 200, body: JSON.stringify({ success: true }) });
    });
    req.on('error', (e) => {
      resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
    });
    req.write(postData);
    req.end();
  });
};
