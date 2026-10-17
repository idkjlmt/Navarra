const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = readFileSync(require('node:path').join(__dirname, '../dist/supporters.js'), 'utf8');
async function setup(endpoint, responses, hidden = false) {
  const tiers = [1000, 2000, 3000, 4000, 5000].map((threshold, index) => {
    const tier = { dataset: { threshold: String(threshold) }, active: index === 0,
      setAttribute() {}, removeAttribute() {} };
    tier.classList = { toggle: (_, active) => { tier.active = active; } };
    return tier;
  });
  const nodes = {
    supporterCounter: { dataset: { endpoint } },
    preorderCount: { textContent: '—', removeAttribute() {} },
    supporterStatus: { textContent: 'pending' },
    donationAmount: { textContent: '—', removeAttribute() {} },
    donationStatus: { textContent: 'pending' }
  };
  const timers = new Map(); let id = 0; let calls = 0; let onVisibility;
  const document = { hidden, querySelectorAll: () => tiers, getElementById: key => nodes[key], addEventListener: (_, fn) => { onVisibility = fn; } };
  vm.runInNewContext(source, {
    document, Intl, Date, AbortController,
    setTimeout: (fn, delay) => { timers.set(++id, { fn, delay }); return id; },
    clearTimeout: key => timers.delete(key),
    fetch: async () => { calls++; const data = responses.shift(); if (data instanceof Error) throw data; return { ok: true, json: async () => data }; }
  });
  const settle = () => new Promise(resolve => setImmediate(resolve));
  await settle();
  return { nodes, tiers, timers, document, calls: () => calls, settle, visible: () => onVisibility() };
}
(async () => {
  let test = await setup('', []);
  assert.equal(test.calls(), 0);
  assert.deepEqual(test.tiers.map(t => t.active), [true, false, false, false, false]);
  const html = readFileSync(require('node:path').join(__dirname, '../dist/index.html'), 'utf8');
  const cards = html.match(/<article role="listitem"[^>]*>/g);
  assert.equal(cards.length, 5);
  assert.match(cards[0], /class="goal"/);
  assert.ok(cards.slice(1).every(card => !card.includes('class="goal"')));
  for (const [preorders, activeIndex] of [[0, 0], [999, 0], [1000, 0], [1999, 0], [2000, 1], [2999, 1], [3000, 2], [3999, 2], [4000, 3], [4999, 3], [5000, 4], [6000, 4]]) {
    const tierTest = await setup('/api/supporters', [{ preorderCount: preorders, donationTotalHuf: 0 }, new Error('offline')]);
    const expected = tierTest.tiers.map((_, index) => index === activeIndex);
    assert.deepEqual(tierTest.tiers.map(t => t.active), expected);
    await [...tierTest.timers.values()].find(t => t.delay === 60000).fn();
    assert.deepEqual(tierTest.tiers.map(t => t.active), expected);
  }
  test = await setup('/api/supporters', [{ preorderCount: 0, donationTotalHuf: 0 }, { preorderCount: 1234, donationTotalHuf: 12345678 }, new Error('offline')]);
  assert.equal(test.nodes.preorderCount.textContent, '0');
  assert.equal(test.nodes.donationAmount.textContent, '0');
  const poll = () => [...test.timers.values()].find(t => t.delay === 60000).fn();
  await poll();
  assert.equal(test.nodes.preorderCount.textContent, new Intl.NumberFormat('hu-HU').format(1234));
  assert.equal(test.nodes.donationAmount.textContent, new Intl.NumberFormat('hu-HU').format(12345678));
  await poll();
  assert.equal(test.nodes.preorderCount.textContent, new Intl.NumberFormat('hu-HU').format(1234));
  assert.match(test.nodes.supporterStatus.textContent, /átmenetileg/);
  for (const value of [-1, 1.5, '123', null, Number.MAX_SAFE_INTEGER + 1]) {
    test = await setup('/api/supporters', [{ preorderCount: value, donationTotalHuf: 1000 }]);
    assert.equal(test.nodes.preorderCount.textContent, '—');
    test = await setup('/api/supporters', [{ preorderCount: 42, donationTotalHuf: value }]);
    assert.equal(test.nodes.donationAmount.textContent, '—');
  }
  test = await setup('/api/supporters', [{ preorderCount: 42, donationTotalHuf: 1000 }], true);
  assert.equal(test.calls(), 0);
  test.document.hidden = false; test.visible(); await test.settle();
  assert.equal(test.nodes.preorderCount.textContent, '42');
  console.log('PASS: unconfigured, zero, valid, invalid, stale value, polling, visibility.');
})();
