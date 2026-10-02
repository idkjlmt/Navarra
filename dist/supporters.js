(() => {
  const counter = document.getElementById('supporterCounter');
  if (!counter) return;
  const endpoint = counter.dataset.endpoint.trim();
  // No placeholder statistics and no requests until a public aggregate endpoint is configured.
  if (!endpoint) return;
  const count = document.getElementById('supporterCount');
  const status = document.getElementById('supporterStatus');
  const amount = document.getElementById('donationAmount');
  const amountStatus = document.getElementById('donationStatus');
  const format = new Intl.NumberFormat('hu-HU');
  let timer;
  let inFlight = false;
  let hasValue = false;
  let lastSuccess;

  async function refresh() {
    clearTimeout(timer);
    if (inFlight || document.hidden) return;
    inFlight = true;
    if (!hasValue) {
      status.textContent = 'Támogatók számának betöltése…';
      amountStatus.textContent = 'Támogatások összegének betöltése…';
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(endpoint, { cache: 'no-store', credentials: 'omit', signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Request failed');
      const data = await response.json();
      if (!Number.isSafeInteger(data?.supporterCount) || data.supporterCount < 0) throw new Error('Invalid count');
      if (!Number.isSafeInteger(data?.donationTotalHuf) || data.donationTotalHuf < 0) throw new Error('Invalid amount');
      count.textContent = format.format(data.supporterCount);
      count.removeAttribute('aria-label');
      amount.textContent = format.format(data.donationTotalHuf);
      amount.removeAttribute('aria-label');
      hasValue = true;
      lastSuccess = new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
      status.textContent = `Legutóbbi frissítés: ${lastSuccess}. Automatikusan frissül.`;
      amountStatus.textContent = status.textContent;
    } catch {
      status.textContent = hasValue
        ? `A frissítés átmenetileg nem elérhető. Utolsó sikeres frissítés: ${lastSuccess}.`
        : 'A támogatók száma átmenetileg nem elérhető.';
      amountStatus.textContent = hasValue ? status.textContent : 'A támogatások összege átmenetileg nem elérhető.';
    } finally {
      clearTimeout(timeout);
      inFlight = false;
      if (!document.hidden) timer = setTimeout(refresh, 60000);
    }
  }
  document.addEventListener('visibilitychange', () => {
    clearTimeout(timer);
    if (!document.hidden) refresh();
  });
  refresh();
})();
