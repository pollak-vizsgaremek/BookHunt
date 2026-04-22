import express from 'express';

const router = express.Router();

// Allowed origins for the proxy (only Google Books CDN domains)
const ALLOWED_HOSTS = [
    'books.google.com',
    'books.googleusercontent.com',
    'lh3.googleusercontent.com',
    'covers.openlibrary.org',
];

/**
 * GET /api/proxy/image?url=<encoded_url>
 * Fetches a remote image and pipes it through with CORS headers so WebGL can use it.
 */
router.get('/', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    // Security: only proxy allowed hosts
    if (!ALLOWED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h))) {
        return res.status(403).json({ error: 'Host not allowed' });
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; BookHunt/1.0)',
                'Referer': 'https://books.google.com/',
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Upstream fetch failed' });
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400'); // cache 24h
        res.set('Access-Control-Allow-Origin', '*');

        // Stream the body directly
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
    } catch (err) {
        console.error('[imageProxy] Error fetching image:', err);
        res.status(502).json({ error: 'Failed to fetch image' });
    }
});

export default router;
