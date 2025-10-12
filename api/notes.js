// Global storage
if (!global.appNotes) {
  global.appNotes = [];
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const sortedNotes = global.appNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json(sortedNotes);
  }

  return res.status(405).json({ error: "Method not allowed" });
}