export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { titulo, mensaje, segmento = 'All' } = req.body
  if (!titulo || !mensaje) return res.status(400).json({ error: 'titulo y mensaje son requeridos' })

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        included_segments: [segmento],
        headings: { es: titulo, en: titulo },
        contents: { es: mensaje, en: mensaje },
      })
    })
    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ error: 'Error al enviar notificación' })
  }
}
