const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = readFileSync(require('node:path').join(__dirname, '../dist/supporters.js'), 'utf8');
async function setup(endpoint, responses, hidden = false) {
  const nodes = {
    supporterCounter: { dataset: { endpoint } },
    supporterCount: { textContent: '—', removeAttribute() {} },
    supporterStatus: { textContent: 'pending' },
    donationAmount: { textContent: '—', removeAttribute() {} },
    donationStatus: { textContent: 'pending' }
  };
  const timers = new Map(); let id = 0; let calls = 0; let onVisibility;
  const document = { hidden, getElementById: key => nodes[key], addEventListener: (_, fn) => { onVisibility = fn; } };
  vm.runInNewContext(source, {
    document, Intl, Date, AbortController,
    setTimeout: (fn, delay) => { timers.set(++id, { fn, delay }); return id; },
    clearTimeout: key => timers.delete(key),
    fetch: async () => { calls++; const data = responses.shift(); if (data instanceof Error) throw data; return { ok: true, json: async () => data }; }
  });
  const settle = () => new Promise(resolve => setImmediate(resolve));
  await settle();
  return { nodes, timers, document, calls: () => calls, settle, visible: () => onVisibility() };
}
(async () => {
  let test = await setup('', []);
  assert.equal(test.calls(), 0);
  test = await setup('/api/supporters', [{ supporterCount: 0, donationTotalHuf: 0 }, { supporterCount: 1234, donationTotalHuf: 12345678 }, new Error('offline')]);
  assert.equal(test.nodes.supporterCount.textContent, '0');
  assert.equal(test.nodes.donationAmount.textContent, '0');
  const poll = () => [...test.timers.values()].find(t => t.delay === 60000).fn();
  await poll();
  assert.equal(test.nodes.supporterCount.textContent, new Intl.NumberFormat('hu-HU').format(1234));
  assert.equal(test.nodes.donationAmount.textContent, new Intl.NumberFormat('hu-HU').format(12345678));
  await poll();
  assert.equal(test.nodes.supporterCount.textContent, new Intl.NumberFormat('hu-HU').format(1234));
  assert.match(test.nodes.supporterStatus.textContent, /átmenetileg/);
  for (const value of [-1, 1.5, '123', null, Number.MAX_SAFE_INTEGER + 1]) {
    test = await setup('/api/supporters', [{ supporterCount: value, donationTotalHuf: 1000 }]);
    assert.equal(test.nodes.supporterCount.textContent, '—');
    test = await setup('/api/supporters', [{ supporterCount: 42, donationTotalHuf: value }]);
    assert.equal(test.nodes.donationAmount.textContent, '—');
  }
  test = await setup('/api/supporters', [{ supporterCount: 42, donationTotalHuf: 1000 }], true);
  assert.equal(test.calls(), 0);
  test.document.hidden = false; test.visible(); await test.settle();
  assert.equal(test.nodes.supporterCount.textContent, '42');
  console.log('PASS: unconfigured, zero, valid, invalid, stale value, polling, visibility.');
})();
