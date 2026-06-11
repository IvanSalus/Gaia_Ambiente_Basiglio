const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:gaia.basiglio@example.com',
  'BJAM0c-fDZAKIMjq-h2RZCLFYowXUb-NSgaovO5Sb7SpzuAF1YsY6sRPHSZrL_zGkWRB0br9_1v8MLEynvhXx_U',
  'bmhUqmObkNV0QQcOplFNwJy5qUOhejoPuixhOT799Oo'
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { subscriptions, title, message, tag } = body;
  if (!subscriptions || !Array.isArray(subscriptions)) {
    return { statusCode: 400, body: 'Missing subscriptions' };
  }

  const payload = JSON.stringify({
    title: title || 'Gaia Colonie Basiglio',
    body:  message || '',
    icon:  '/icon-192.png',
    tag:   tag || 'gaia-notif',
    url:   '/'
  });

  const results = await Promise.allSettled(
    subscriptions.map(sub => webpush.sendNotification(sub, payload))
  );

  const expired = [];
  let ok = 0, fail = 0;

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      ok++;
    } else {
      const status = r.reason?.statusCode;
      if (status === 410 || status === 404) {
        // subscription scaduta — segnala al client per rimuoverla da Firestore
        expired.push(subscriptions[i].endpoint);
      }
      fail++;
    }
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ ok, fail, expired })
  };
};
