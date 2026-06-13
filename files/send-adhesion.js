const nodemailer = require('nodemailer');

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

  const {
    ref, type, nom, prenom, dob, email, tel,
    discord, pseudo, roster, poste, message,
    date, heure, pdfBase64
  } = data;

  // Email content
  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0F1A;color:#E8EDF5;padding:32px;border-radius:8px">
      <div style="border-bottom:2px solid #3B82F6;padding-bottom:16px;margin-bottom:24px">
        <h1 style="margin:0;font-size:22px;letter-spacing:2px;text-transform:uppercase">BLACKOUT OPS <span style="color:#3B82F6">ESPORT</span></h1>
        <p style="margin:4px 0 0;color:#9CA3AF;font-size:12px">Nouvelle demande d'adhésion</p>
      </div>
      
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#9CA3AF;font-size:12px;width:40%">Référence</td><td style="color:#3B82F6;font-weight:bold">${ref}</td></tr>
        <tr><td style="padding:8px 0;color:#9CA3AF;font-size:12px">Type de demande</td><td style="color:#E8EDF5">${type}</td></tr>
        <tr><td style="padding:8px 0;color:#9CA3AF;font-size:12px">Nom complet</td><td style="color:#E8EDF5">${prenom} ${nom}</td></tr>
        <tr><td style="padding:8px 0;color:#9CA3AF;font-size:12px">Date de naissance</td><td style="color:#E8EDF5">${dob}</td></tr>
        <tr><td style="padding:8px 0;color:#9CA3AF;font-size:12px">Email</td><td style="color:#E8EDF5">${email}</td></tr>
        <tr><td style="padding:8px 0;color:#9CA3AF;font-size:12px">Téléphone</td><td style="color:#E8EDF5">${tel}</td></tr>
        ${discord ? `<tr><td style="padding:8px 0;color:#9CA3AF;font-size:12px">Discord</td><td style="color:#E8EDF5">${discord}</td></tr>` : ''}
        ${pseudo ? `<tr><td style="padding:8px 0;color:#9CA3AF;font-size:12px">Pseudo in-game</td><td style="color:#E8EDF5">${pseudo}</td></tr>` : ''}
        ${roster ? `<tr><td style="padding:8px 0;color:#9CA3AF;font-size:12px">Roster visé</td><td style="color:#E8EDF5">${roster}</td></tr>` : ''}
        ${poste ? `<tr><td style="padding:8px 0;color:#9CA3AF;font-size:12px">Poste souhaité</td><td style="color:#E8EDF5">${poste}</td></tr>` : ''}
        ${message ? `<tr><td style="padding:8px 0;color:#9CA3AF;font-size:12px">Message</td><td style="color:#E8EDF5">${message}</td></tr>` : ''}
        <tr><td style="padding:8px 0;color:#9CA3AF;font-size:12px">Date d'envoi</td><td style="color:#E8EDF5">${date} à ${heure}</td></tr>
      </table>
      
      <div style="margin-top:24px;padding:16px;background:#050810;border-left:3px solid #3B82F6;font-size:12px;color:#9CA3AF">
        Le bulletin d'adhésion signé est joint à cet email en pièce jointe PDF.
      </div>
      
      <p style="margin-top:24px;font-size:12px;color:#6B7280;text-align:center">BLACKOUT OPS ESPORT — Haguenau (67) — Association loi 1908</p>
    </div>
  `;

  // Configure Gmail transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  // Build attachments
  const attachments = [];
  if (pdfBase64) {
    attachments.push({
      filename: `bulletin_adhesion_${prenom}_${nom}_${ref}.pdf`,
      content: pdfBase64,
      encoding: 'base64',
      contentType: 'application/pdf'
    });
  }

  try {
    await transporter.sendMail({
      from: '"BLACKOUT OPS ESPORT" <' + process.env.GMAIL_USER + '>',
      to: 'blackoutopsesport@gmail.com',
      subject: `Nouvelle adhésion BLACKOUT OPS ESPORT — ${ref}`,
      html: htmlContent,
      attachments
    });

    // Discord webhook
    const discordPayload = {
      username: 'BLACKOUT OPS — Adhésions',
      embeds: [{
        title: `🖤 Nouvelle demande — ${type}`,
        color: 3447003,
        fields: [
          { name: '📋 Référence', value: ref, inline: true },
          { name: '📁 Type', value: type, inline: true },
          { name: '\u200b', value: '\u200b', inline: false },
          { name: '👤 Nom', value: `${prenom} ${nom}`, inline: true },
          { name: '📧 Email', value: email, inline: true },
          { name: '📞 Téléphone', value: tel, inline: true },
          { name: '✍️ Signature', value: `Apposée le ${date} à ${heure}`, inline: false },
          { name: '📎 PDF', value: 'Bulletin joint dans l\'email blackoutopsesport@gmail.com', inline: false }
        ],
        footer: { text: 'BLACKOUT OPS ESPORT — Adhésion 2026/2027' },
        timestamp: new Date().toISOString()
      }]
    };

    await fetch('https://discord.com/api/webhooks/1514338744646369502/Wr6HZhpPkoDLI5NMQdRXAylL4rJ0SmAv2HawZHxFPqOq3LDhamUagtkOh_X9auLMn1UK', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, ref })
    };

  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
