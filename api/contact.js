const DESTINATION_EMAIL = 'asistentablocsalaj@gmail.com';
const FROM_EMAIL = 'Asistență Bloc Sălaj <onboarding@resend.dev>';

const limits = {
  name: 100,
  phone: 40,
  city: 100,
  details: 2000,
};

function clean(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Metodă nepermisă.' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured.');
    return response.status(503).json({ error: 'Serviciul de email nu este configurat.' });
  }

  const body = request.body || {};

  // Câmp capcană pentru trimiteri automate. Utilizatorii reali nu îl văd.
  if (clean(body.website, 200)) {
    return response.status(200).json({ ok: true });
  }

  const name = clean(body.name, limits.name);
  const phone = clean(body.phone, limits.phone);
  const city = clean(body.city, limits.city);
  const details = clean(body.details, limits.details) || 'Evaluare generală a serviciilor de administrare.';
  const apartments = Number.parseInt(body.apartments, 10);

  if (!name || !phone || !city || !Number.isInteger(apartments) || apartments < 4 || apartments > 500) {
    return response.status(400).json({ error: 'Completează corect toate câmpurile obligatorii.' });
  }

  const safe = {
    name: escapeHtml(name),
    phone: escapeHtml(phone),
    city: escapeHtml(city),
    details: escapeHtml(details).replaceAll('\n', '<br>'),
  };

  const text = [
    'Solicitare nouă — Asistență Bloc Sălaj',
    '',
    `Nume: ${name}`,
    `Telefon: ${phone}`,
    `Localitate: ${city}`,
    `Număr apartamente: ${apartments}`,
    '',
    'Necesități:',
    details,
  ].join('\n');

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': clean(body.requestId, 100) || `contact-${Date.now()}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [DESTINATION_EMAIL],
        subject: `Cerere administrare bloc — ${city} — ${name}`,
        text,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#102536">
            <div style="padding:24px;background:#071d31;color:#fff;border-radius:16px 16px 0 0">
              <p style="margin:0;color:#50df93;font-size:12px;font-weight:700;letter-spacing:.08em">CERERE NOUĂ DE PE SITE</p>
              <h1 style="margin:8px 0 0;font-size:25px">Solicitare administrare bloc</h1>
            </div>
            <div style="padding:24px;border:1px solid #dce6e9;border-top:0;border-radius:0 0 16px 16px">
              <p><strong>Nume:</strong> ${safe.name}</p>
              <p><strong>Telefon:</strong> <a href="tel:${safe.phone}">${safe.phone}</a></p>
              <p><strong>Localitate:</strong> ${safe.city}</p>
              <p><strong>Număr apartamente:</strong> ${apartments}</p>
              <hr style="border:0;border-top:1px solid #dce6e9;margin:22px 0">
              <p><strong>Necesități:</strong></p>
              <p style="line-height:1.6">${safe.details}</p>
            </div>
          </div>`,
      }),
    });

    const result = await resendResponse.json();
    if (!resendResponse.ok) {
      console.error('Resend rejected contact email:', result);
      return response.status(502).json({ error: 'Cererea nu a putut fi trimisă. Încearcă din nou.' });
    }

    return response.status(200).json({ ok: true, id: result.id });
  } catch (error) {
    console.error('Contact email failed:', error);
    return response.status(500).json({ error: 'Cererea nu a putut fi trimisă. Încearcă din nou.' });
  }
}
