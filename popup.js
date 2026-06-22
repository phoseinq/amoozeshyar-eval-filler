const OPTIONS = [
  { title: 'خیلی خوب', level: 5, color: '#16a34a', tint: '#dcfce7' },
  { title: 'خوب',      level: 4, color: '#65a30d', tint: '#ecfccb' },
  { title: 'متوسط',     level: 3, color: '#ca8a04', tint: '#fef9c3' },
  { title: 'قابل قبول', level: 2, color: '#ea580c', tint: '#ffedd5' },
  { title: 'ضعیف',     level: 1, color: '#dc2626', tint: '#fee2e2' },
];

let selected = null;
const opts = document.getElementById('opts');
const applyBtn = document.getElementById('apply');
const status = document.getElementById('status');

OPTIONS.forEach((o) => {
  const el = document.createElement('div');
  el.className = 'opt';
  el.style.setProperty('--c', o.color);
  el.style.setProperty('--tint', o.tint);
  const bars = Array.from({ length: 5 }, (_, i) =>
    `<i class="${i < o.level ? 'on' : ''}"></i>`).join('');
  el.innerHTML = `<span class="name"><span class="dot"></span>${o.title}</span><span class="bars">${bars}</span>`;
  el.addEventListener('click', () => {
    selected = o.title;
    document.querySelectorAll('.opt').forEach((x) => x.classList.remove('sel'));
    el.classList.add('sel');
    applyBtn.disabled = false;
    applyBtn.textContent = `اعمال «${o.title}» روی همه`;
    status.textContent = '';
  });
  opts.appendChild(el);
});

async function runInPage(func, args) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func, args });
  return res && res.result;
}

applyBtn.addEventListener('click', async () => {
  if (!selected) return;
  const n = await runInPage(fillAll, [selected]);
  status.textContent = n ? `${n} سوال روی «${selected}» تنظیم شد ✔` : 'سوالی پیدا نشد.';
});

document.getElementById('clear').addEventListener('click', async () => {
  const n = await runInPage(clearAll, []);
  selected = null;
  document.querySelectorAll('.opt').forEach((x) => x.classList.remove('sel'));
  applyBtn.disabled = true;
  applyBtn.textContent = 'اعمال روی همه';
  status.textContent = n ? `${n} سوال پاک شد.` : 'چیزی برای پاک کردن نبود.';
});

// ---- injected into the page ----
function fillAll(title) {
  const radios = document.querySelectorAll('input[type="radio"][title="' + title + '"]');
  if (radios.length === 0) { return 0; }
  radios.forEach((r) => r.click()); // click() also fires the page onclick that sets the hidden validation field
  toast('تکمیل شد ✓', radios.length + ' سوال با «' + title + '»', '#059669');
  return radios.length;

  function toast(t, sub, c) {
    let b = document.getElementById('__evalToast');
    if (!b) {
      b = document.createElement('div');
      b.id = '__evalToast';
      document.body.appendChild(b);
    }
    b.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;color:#1f2937;padding:24px 40px;border-radius:16px;border-top:5px solid ' + c + ';font-family:Vazirmatn,Tahoma,sans-serif;font-size:20px;font-weight:700;z-index:2147483647;box-shadow:0 12px 40px rgba(0,0,0,.18);text-align:center;direction:rtl;';
    b.innerHTML = '<div>' + t + '</div><div style="font-size:13px;font-weight:400;color:#6b7280;margin-top:8px;">' + sub + '</div>';
    clearTimeout(b._t);
    b._t = setTimeout(() => b.remove(), 2200);
  }
}

function clearAll() {
  const titles = ['خیلی خوب', 'خوب', 'متوسط', 'قابل قبول', 'ضعیف'];
  const sel = titles.map((t) => 'input[type="radio"][title="' + t + '"]').join(',');
  const radios = document.querySelectorAll(sel);
  radios.forEach((r) => { r.checked = false; });
  document.querySelectorAll('input[type="hidden"][id^="text__"]').forEach((h) => { h.value = ''; });
  return radios.length;
}
