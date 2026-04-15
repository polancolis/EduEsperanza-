// ══════════════════════════════════════════════════════════
// EduEsperanza — Proxy IA para Netlify Functions
// La clave API vive AQUÍ (en el servidor), no en el navegador
// ══════════════════════════════════════════════════════════

exports.handler = async function(event, context) {

  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Leer la clave desde variables de entorno de Netlify
  const API_KEY = process.env.OPENAI_API_KEY;
  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key no configurada en Netlify.' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  const { prompt, maxTok } = body;
  if (!prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Falta el prompt' }) };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        max_completion_tokens: maxTok || 2000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error.message || 'Error de OpenAI' })
      };
    }

    const texto = ((data.choices || [])[0] || {}).message?.content || '';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error de red: ' + err.message })
    };
  }
};
