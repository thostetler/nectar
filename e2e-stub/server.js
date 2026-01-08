// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require('express');

const app = express();
const PORT = 18080;

const calls = [];

app.use(express.json());

app.get('/accounts/bootstrap', (req, res) => {
  const scenario = req.headers['x-test-scenario'];

  calls.push({
    endpoint: '/accounts/bootstrap',
    scenario,
    headers: {
      cookie: req.headers.cookie,
      'x-test-scenario': scenario,
    },
    timestamp: Date.now(),
  });

  console.log(`[STUB] Bootstrap called with scenario: ${scenario || 'default'}`);

  if (scenario === 'bootstrap-failure') {
    return res.status(500).send('Server Error');
  }

  if (scenario === 'bootstrap-network-error') {
    req.socket.destroy();
    return;
  }

  if (scenario === 'bootstrap-authenticated') {
    return res
      .status(200)
      .set('Set-Cookie', 'ads_session=authenticated-session; Domain=example.com; SameSite=None; Secure')
      .json({
        username: 'test@example.com',
        scopes: ['api', 'execute-query', 'store-query', 'user'],
        client_id: 'test-client-id',
        access_token: 'mocked-authenticated-token',
        client_name: 'Test Client',
        token_type: 'Bearer',
        ratelimit: 1.0,
        anonymous: false,
        client_secret: 'test-secret',
        expires_at: '999999999999999999',
        refresh_token: 'test-refresh-token',
        given_name: 'Test',
        family_name: 'User',
      });
  }

  if (scenario === 'bootstrap-anonymous') {
    return res
      .status(200)
      .set('Set-Cookie', 'ads_session=anonymous-session; Domain=example.com; SameSite=None; Secure')
      .json({
        username: 'anonymous@ads',
        scopes: ['api', 'execute-query', 'store-query'],
        client_id: 'test-client-id',
        access_token: 'mocked-anonymous-token',
        client_name: 'Test Client',
        token_type: 'Bearer',
        ratelimit: 1.0,
        anonymous: true,
        client_secret: 'test-secret',
        expires_at: '999999999999999999',
        refresh_token: 'test-refresh-token',
        given_name: 'Anonymous',
        family_name: 'User',
      });
  }

  if (scenario === 'bootstrap-rotated-cookie') {
    const currentCookie = req.headers.cookie || '';
    const newCookie = currentCookie ? `${currentCookie}-rotated` : 'rotated-session';
    return res
      .status(200)
      .set('Set-Cookie', `ads_session=${newCookie}; Domain=example.com; SameSite=None; Secure`)
      .json({
        username: 'anonymous@ads',
        scopes: ['api', 'execute-query', 'store-query'],
        client_id: 'test-client-id',
        access_token: 'mocked-anonymous-token',
        client_name: 'Test Client',
        token_type: 'Bearer',
        ratelimit: 1.0,
        anonymous: true,
        client_secret: 'test-secret',
        expires_at: '999999999999999999',
        refresh_token: 'test-refresh-token',
        given_name: 'Test',
        family_name: 'Tester',
      });
  }

  if (scenario === 'bootstrap-unchanged-cookie') {
    return res
      .status(200)
      .set('Set-Cookie', 'ads_session=unchanged-session; Domain=example.com; SameSite=None; Secure')
      .json({
        username: 'anonymous@ads',
        scopes: ['api', 'execute-query', 'store-query'],
        client_id: 'test-client-id',
        access_token: 'mocked-anonymous-token',
        client_name: 'Test Client',
        token_type: 'Bearer',
        ratelimit: 1.0,
        anonymous: true,
        client_secret: 'test-secret',
        expires_at: '999999999999999999',
        refresh_token: 'test-refresh-token',
        given_name: 'Test',
        family_name: 'Tester',
      });
  }

  return res
    .status(200)
    .set('Set-Cookie', 'ads_session=default-session; Domain=example.com; SameSite=None; Secure')
    .json({
      username: 'anonymous@ads',
      scopes: ['api', 'execute-query', 'store-query'],
      client_id: 'test-client-id',
      access_token: 'mocked-anonymous-token',
      client_name: 'Test Client',
      token_type: 'Bearer',
      ratelimit: 1.0,
      anonymous: true,
      client_secret: 'test-secret',
      expires_at: '999999999999999999',
      refresh_token: 'test-refresh-token',
      given_name: 'Test',
      family_name: 'Tester',
    });
});

app.get('/accounts/verify/:token', (req, res) => {
  const { token } = req.params;
  const scenario = req.headers['x-test-scenario'];

  calls.push({
    endpoint: `/accounts/verify/${token}`,
    scenario,
    timestamp: Date.now(),
  });

  console.log(`[STUB] Verify called with token: ${token}, scenario: ${scenario || 'default'}`);

  if (scenario === 'verify-success') {
    return res
      .status(200)
      .set('Set-Cookie', `ads_session=verified-${token}; Domain=example.com; SameSite=None; Secure`)
      .json({ message: 'success', email: 'verified@example.com' });
  }

  if (scenario === 'verify-unknown-token') {
    return res.status(200).json({ error: 'unknown verification token' });
  }

  if (scenario === 'verify-already-validated') {
    return res.status(200).json({ error: 'already been validated' });
  }

  if (scenario === 'verify-failure') {
    return res.status(500).send('Server Error');
  }

  if (scenario === 'verify-network-error') {
    req.socket.destroy();
    return;
  }

  return res
    .status(200)
    .set('Set-Cookie', `ads_session=verified-${token}; Domain=example.com; SameSite=None; Secure`)
    .json({ message: 'success', email: 'verified@example.com' });
});

app.get('/__test__/calls', (req, res) => {
  res.json({ calls, count: calls.length });
});

app.post('/__test__/reset', (req, res) => {
  calls.length = 0;
  console.log('[STUB] State reset');
  res.json({ ok: true });
});

app.use('/link_gateway', (req, res) => {
  calls.push({
    endpoint: `/link_gateway${req.path}`,
    timestamp: Date.now(),
  });

  console.log(`[STUB] Link gateway called: /link_gateway${req.path}`);
  res.status(200).json({ status: 'ok' });
});

// Vault endpoints for site alerts and user data
app.get('/vault/configuration/site_wide_message', (req, res) => {
  console.log('[STUB] Site wide message requested');
  res.status(200).json({ message: '' });
});

app.get('/vault/user-data', (req, res) => {
  const scenario = req.headers['x-test-scenario'];
  console.log(`[STUB] User data requested with scenario: ${scenario || 'default'}`);

  if (scenario === 'bootstrap-authenticated') {
    return res.status(200).json({
      link_server: 'https://ui.adsabs.harvard.edu/link_gateway',
      defaultExportFormat: 'bibtex',
      customFormats: [],
    });
  }

  return res.status(200).json({});
});

// Search endpoint
app.get('/search/query', (req, res) => {
  const scenario = req.headers['x-test-scenario'];
  console.log(`[STUB] Search query: ${req.query.q}, scenario: ${scenario || 'default'}`);

  res.status(200).json({
    responseHeader: { status: 0, QTime: 1, params: { q: req.query.q || '*:*' } },
    response: {
      numFound: 2,
      start: 0,
      docs: [
        {
          bibcode: '2020ApJ...900....1S',
          title: ['Dark Matter Distribution in Galaxies'],
          author: ['Smith, J.', 'Johnson, A.'],
          pubdate: '2020-08-00',
          citation_count: 42,
          abstract: 'We study the distribution of dark matter in spiral galaxies...',
        },
        {
          bibcode: '2019MNRAS.485.1234B',
          title: ['Exoplanet Atmospheres and Habitability'],
          author: ['Brown, S.', 'Davis, M.'],
          pubdate: '2019-05-00',
          citation_count: 28,
          abstract: 'This paper examines atmospheric conditions on exoplanets...',
        },
      ],
    },
  });
});

// Abstract/resolver endpoint
app.get('/resolver/:bibcode', (req, res) => {
  const { bibcode } = req.params;
  console.log(`[STUB] Resolver for bibcode: ${bibcode}`);

  res.status(200).json({
    responseHeader: { status: 0, QTime: 1, params: { q: `bibcode:${bibcode}` } },
    response: {
      numFound: 1,
      start: 0,
      docs: [
        {
          bibcode: bibcode,
          title: ['Dark Matter Distribution in Galaxies'],
          author: ['Smith, J.', 'Johnson, A.'],
          pubdate: '2020-08-00',
          citation_count: 42,
          abstract: 'We study the distribution of dark matter in spiral galaxies...',
          keyword: ['dark matter', 'galaxies'],
          aff: ['Harvard University', 'MIT'],
        },
      ],
    },
  });
});

// Library endpoints
app.get('/biblib/libraries', (req, res) => {
  const scenario = req.headers['x-test-scenario'];
  console.log(`[STUB] Libraries list requested, scenario: ${scenario || 'default'}`);

  if (scenario === 'bootstrap-authenticated') {
    return res.status(200).json({
      libraries: [
        { id: 'lib-1', name: 'My Papers', num_documents: 10, public: false },
        { id: 'lib-2', name: 'Research', num_documents: 25, public: true },
      ],
    });
  }

  return res.status(200).json({ libraries: [] });
});

app.post('/biblib/libraries/:id', (req, res) => {
  const { id } = req.params;
  console.log(`[STUB] Add to library ${id}`);

  res.status(200).json({
    number_added: 1,
    bibcode: req.body?.bibcode || ['2020ApJ...900....1S'],
  });
});

app.post('/biblib/libraries', (req, res) => {
  console.log('[STUB] Create new library');

  res.status(200).json({
    id: 'new-lib-id',
    name: req.body?.name || 'New Library',
  });
});

// Export endpoints
app.post('/export/:format', (req, res) => {
  const { format } = req.params;
  console.log(`[STUB] Export in format: ${format}`);

  const exportFormats = {
    bibtex:
      '@article{2020ApJ...900....1S,\n  author = {Smith, J. and Johnson, A.},\n  title = {Dark Matter Distribution in Galaxies},\n  journal = {ApJ},\n  year = {2020}\n}',
    ris: 'TY  - JOUR\nAU  - Smith, J.\nAU  - Johnson, A.\nTI  - Dark Matter Distribution in Galaxies\nPY  - 2020\nER  - ',
    endnote: '%0 Journal Article\n%A Smith, J.\n%A Johnson, A.\n%T Dark Matter Distribution in Galaxies\n%D 2020',
  };

  res.status(200).json({
    msg: 'Retrieved 1 abstract, starting with bibcode 2020ApJ...900....1S',
    export: exportFormats[format] || exportFormats.bibtex,
  });
});

app.listen(PORT, () => {
  console.log(`[STUB] E2E stub backend listening on http://127.0.0.1:${PORT}`);
  console.log('[STUB] Endpoints:');
  console.log('  - GET  /accounts/bootstrap');
  console.log('  - GET  /accounts/verify/:token');
  console.log('  - ALL  /link_gateway/*');
  console.log('  - GET  /vault/configuration/site_wide_message');
  console.log('  - GET  /vault/user-data');
  console.log('  - GET  /search/query');
  console.log('  - GET  /resolver/:bibcode');
  console.log('  - GET  /biblib/libraries');
  console.log('  - POST /biblib/libraries');
  console.log('  - POST /biblib/libraries/:id');
  console.log('  - POST /export/:format');
  console.log('  - GET  /__test__/calls');
  console.log('  - POST /__test__/reset');
});
