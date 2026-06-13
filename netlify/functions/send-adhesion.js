exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try { data = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { ref, type, nom, prenom, dob, email, tel, date, heure, pdfBase64 } = data;

  const payload = {
    from: 'BLACKOUT OPS <onboarding@resend.dev>',
    to: ['blackoutopsesport@gmail.com'],
    subject: `[ADHESION] ${ref} - ${prenom} ${nom}`,
    html: `<div style="font-family:Arial;background:#0A0F1A;color:#E8EDF5;padding:32px;border-radius:8px">
      <h2 style="color:#3B82F6">BLACKOUT OPS ESPORT</h2>
      <p>Nouvelle demande d'adhésion</p>
      <table>
        <tr><td style="color:#9CA3AF;padding:6px 12px 6px 0">Référence</td><td style="color:#3B82F6;font-weight:bold">${ref}</td></tr>
        <tr><td style="color:#9CA3AF;padding:6px 12px 6px 0">Type</td><td>${type}</td></tr>
        <tr><td style="color:#9CA3AF;padding:6px 12px 6px 0">Nom</td><td>${prenom} ${nom}</td></tr>
        <tr><td style="color:#9CA3AF;padding:6px 12px 6px 0">Email</td><td>${email}</td></tr>
        <tr><td style="color:#9CA3AF;padding:6px 12px 6px 0">Téléphone</td><td>${tel}</td></tr>
        <tr><td style="color:#9CA3AF;padding:6px 12px 6px 0">Date</td><td>${date} à ${heure}</td></tr>
      </table>
    </div>`,
    attachments: pdfBase64 ? [{
      filename: `bulletin-${ref}.pdf`,
      content: pdfBase64
    }] : []
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const result = await res.json();
  return { statusCode: 200, body: JSON.stringify({ success: true, result }) };
};
