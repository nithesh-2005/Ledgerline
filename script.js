/* ==========================================================
   LedgerLine — app logic
   All data lives in localStorage under 'ledgerline:transactions'
   and 'ledgerline:budget'. No backend, no external requests.
   ========================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'ledgerline:transactions';
  const BUDGET_KEY = 'ledgerline:budget';

  const CATEGORIES = [
    { id: 'food', label: 'Food & Canteen', color: '#e8a33d' },
    { id: 'travel', label: 'Travel & Transit', color: '#4fb286' },
    { id: 'academics', label: 'Academics & Books', color: '#5b8def' },
    { id: 'hostel', label: 'Hostel & Rent', color: '#c869d1' },
    { id: 'subscriptions', label: 'Subscriptions', color: '#e2604f' },
    { id: 'entertainment', label: 'Entertainment', color: '#3fbfbf' },
    { id: 'income', label: 'Income & Payouts', color: '#9aa5b1' },
    { id: 'other', label: 'Other', color: '#7a8494' }
  ];

  const $ = (sel) => document.querySelector(sel);
  const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /** @type {Array<{id:string,type:'income'|'expense',desc:string,amount:number,category:string,date:string}>} */
  let transactions = load();

  // ---------- persistence ----------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : seedData();
    } catch (e) {
      console.error('Failed to load transactions', e);
      return [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }

  function seedData() {
    // small starter set so the ledger isn't empty on first run
    const today = new Date();
    const iso = (offsetDays) => {
      const d = new Date(today);
      d.setDate(d.getDate() - offsetDays);
      return d.toISOString().slice(0, 10);
    };
    const seed = [
      { id: uid(), type: 'income', desc: 'Freelance web project', amount: 6000, category: 'income', date: iso(2) },
      { id: uid(), type: 'expense', desc: 'Canteen lunch', amount: 90, category: 'food', date: iso(1) },
      { id: uid(), type: 'expense', desc: 'Bus pass top-up', amount: 400, category: 'travel', date: iso(3) },
      { id: uid(), type: 'expense', desc: 'Course reference book', amount: 650, category: 'academics', date: iso(5) },
      { id: uid(), type: 'expense', desc: 'Spotify subscription', amount: 119, category: 'subscriptions', date: iso(6) }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- category helpers ----------
  function categoryMeta(id) {
    return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
  }

  function populateCategorySelects() {
    const targets = [$('#category-input'), $('#edit-category'), $('#filter-category')];
    targets.forEach((select, idx) => {
      const isFilter = idx === 2;
      const base = isFilter ? '<option value="all">All categories</option>' : '';
      select.innerHTML = base + CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join('');
    });
  }

  // ---------- date ----------
  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function isThisMonth(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }

  // ---------- rendering: stat stamps ----------
  function renderStats() {
    const monthTx = transactions.filter((t) => isThisMonth(t.date));
    const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const allTimeBalance = transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);

    $('#stat-balance').textContent = fmt(allTimeBalance);
    $('#stat-income').textContent = fmt(income);
    $('#stat-expense').textContent = fmt(expense);

    renderBudget(expense);
    renderChart(monthTx);
  }

  // ---------- budget ----------
  function renderBudget(monthExpense) {
    const budget = Number(localStorage.getItem(BUDGET_KEY) || 0);
    const input = $('#budget-input');
    if (document.activeElement !== input) input.value = budget || '';

    const fill = $('#budget-fill');
    const status = $('#budget-status');

    if (!budget) {
      fill.style.width = '0%';
      fill.className = 'budget-fill';
      status.textContent = 'No budget set for this month';
      status.className = 'budget-status';
      return;
    }

    const pct = Math.min(100, (monthExpense / budget) * 100);
    fill.style.width = pct + '%';

    if (monthExpense > budget) {
      fill.className = 'budget-fill over';
      status.className = 'budget-status over';
      status.textContent = `${fmt(monthExpense - budget)} over budget`;
    } else if (pct >= 80) {
      fill.className = 'budget-fill warn';
      status.className = 'budget-status';
      status.textContent = `${pct.toFixed(0)}% of budget used`;
    } else {
      fill.className = 'budget-fill';
      status.className = 'budget-status';
      status.textContent = `${pct.toFixed(0)}% of budget used`;
    }
  }

  // ---------- chart (hand-drawn canvas pie, no external deps) ----------
  function renderChart(monthTx) {
    const canvas = $('#category-chart');
    const ctx = canvas.getContext('2d');
    const empty = $('#chart-empty');
    const legend = $('#category-legend');

    const expenses = monthTx.filter((t) => t.type === 'expense');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (expenses.length === 0) {
      canvas.style.display = 'none';
      empty.style.display = 'block';
      legend.innerHTML = '';
      return;
    }
    canvas.style.display = 'block';
    empty.style.display = 'none';

    const totals = {};
    expenses.forEach((t) => { totals[t.category] = (totals[t.category] || 0) + t.amount; });
    const sum = Object.values(totals).reduce((a, b) => a + b, 0);

    const cx = canvas.width / 2, cy = canvas.height / 2, r = Math.min(cx, cy) - 12;
    let startAngle = -Math.PI / 2;

    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

    entries.forEach(([catId, amt]) => {
      const slice = (amt / sum) * Math.PI * 2;
      const meta = categoryMeta(catId);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = meta.color;
      ctx.fill();
      startAngle += slice;
    });

    // donut hole
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.body).backgroundColor || '#171f2a';
    ctx.fillStyle = '#171f2a';
    ctx.fill();

    // center total
    ctx.fillStyle = '#ede9e2';
    ctx.font = '600 15px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fmt(sum), cx, cy);

    legend.innerHTML = entries.map(([catId, amt]) => {
      const meta = categoryMeta(catId);
      return `<li><span class="swatch" style="background:${meta.color}"></span>
        <span class="legend-label">${meta.label}</span>
        <span class="legend-amount">${fmt(amt)}</span></li>`;
    }).join('');
  }

  // ---------- rendering: table ----------
  function renderTable() {
    const search = $('#search-input').value.trim().toLowerCase();
    const catFilter = $('#filter-category').value;
    const typeFilter = $('#filter-type').value;

    let rows = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

    if (search) rows = rows.filter((t) => t.desc.toLowerCase().includes(search));
    if (catFilter !== 'all') rows = rows.filter((t) => t.category === catFilter);
    if (typeFilter !== 'all') rows = rows.filter((t) => t.type === typeFilter);

    const body = $('#ledger-body');
    const emptyNote = $('#ledger-empty');

    if (rows.length === 0) {
      body.innerHTML = '';
      emptyNote.style.display = 'block';
      emptyNote.textContent = transactions.length === 0
        ? 'Nothing logged yet — your first entry starts the ledger above.'
        : 'No entries match your search or filters.';
      return;
    }
    emptyNote.style.display = 'none';

    body.innerHTML = rows.map((t) => {
      const meta = categoryMeta(t.category);
      const sign = t.type === 'income' ? '+' : '−';
      const amtClass = t.type === 'income' ? 'amount-income' : 'amount-expense';
      const dateLabel = new Date(t.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      return `
        <tr data-id="${t.id}">
          <td class="col-date">${dateLabel}</td>
          <td class="col-desc">${escapeHtml(t.desc)}</td>
          <td class="col-cat"><span class="cat-pill">${meta.label}</span></td>
          <td class="col-amount ${amtClass}">${sign} ${fmt(t.amount)}</td>
          <td class="col-actions">
            <button class="row-btn edit-btn" data-id="${t.id}">Edit</button>
            <button class="row-btn danger delete-btn" data-id="${t.id}">Delete</button>
          </td>
        </tr>`;
    }).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderAll() {
    renderStats();
    renderTable();
  }

  // ---------- form: add ----------
  $('#entry-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.querySelector('input[name="type"]:checked').value;
    const desc = $('#desc-input').value.trim();
    const amount = parseFloat($('#amount-input').value);
    const date = $('#date-input').value;
    const category = $('#category-input').value;

    if (!desc || !amount || amount <= 0 || !date) return;

    transactions.push({ id: uid(), type, desc, amount, category, date });
    save();
    renderAll();

    $('#entry-form').reset();
    $('#date-input').value = todayISO();
    document.getElementById('type-expense').checked = true;

    const hint = $('#form-hint');
    hint.textContent = 'Added to the ledger.';
    setTimeout(() => { hint.textContent = ''; }, 2000);
  });

  // ---------- table: edit / delete ----------
  $('#ledger-body').addEventListener('click', (e) => {
    const editId = e.target.closest('.edit-btn')?.dataset.id;
    const delId = e.target.closest('.delete-btn')?.dataset.id;

    if (editId) openEditModal(editId);
    if (delId) {
      if (confirm('Delete this entry? This cannot be undone.')) {
        transactions = transactions.filter((t) => t.id !== delId);
        save();
        renderAll();
      }
    }
  });

  function openEditModal(id) {
    const t = transactions.find((x) => x.id === id);
    if (!t) return;
    $('#edit-id').value = t.id;
    $('#edit-desc').value = t.desc;
    $('#edit-amount').value = t.amount;
    $('#edit-date').value = t.date;
    $('#edit-category').value = t.category;
    document.getElementById(t.type === 'income' ? 'edit-type-income' : 'edit-type-expense').checked = true;
    $('#modal-backdrop').classList.add('open');
  }

  function closeEditModal() {
    $('#modal-backdrop').classList.remove('open');
  }

  $('#modal-cancel').addEventListener('click', closeEditModal);
  $('#modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeEditModal();
  });

  $('#edit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('#edit-id').value;
    const t = transactions.find((x) => x.id === id);
    if (!t) return;
    t.type = document.querySelector('input[name="edit-type"]:checked').value;
    t.desc = $('#edit-desc').value.trim();
    t.amount = parseFloat($('#edit-amount').value);
    t.date = $('#edit-date').value;
    t.category = $('#edit-category').value;
    save();
    renderAll();
    closeEditModal();
  });

  // ---------- filters / search ----------
  $('#search-input').addEventListener('input', renderTable);
  $('#filter-category').addEventListener('change', renderTable);
  $('#filter-type').addEventListener('change', renderTable);

  // ---------- budget ----------
  $('#budget-save').addEventListener('click', () => {
    const val = Number($('#budget-input').value) || 0;
    localStorage.setItem(BUDGET_KEY, String(val));
    renderStats();
  });

  // ---------- CSV export ----------
  $('#export-btn').addEventListener('click', () => {
    if (transactions.length === 0) return;
    const header = ['Date', 'Type', 'Description', 'Category', 'Amount'];
    const rows = [...transactions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => [t.date, t.type, `"${t.desc.replace(/"/g, '""')}"`, categoryMeta(t.category).label, t.amount]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledgerline-export-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // ---------- init ----------
  function init() {
    populateCategorySelects();
    $('#date-input').value = todayISO();
    $('#today-date').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
