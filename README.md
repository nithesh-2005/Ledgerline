# LedgerLine — Personal Expense Tracker

A clean, dependency-free expense tracker built with **HTML, CSS, and vanilla JavaScript**. Log income and expenses, set a monthly budget, and see a live category breakdown — all stored locally in the browser, no backend or sign-up required.

Built as a small, portfolio-ready CSE project: a single, focused idea, executed fully.

## Features

- **Add / edit / delete transactions** — description, amount, category, date, and type (income or expense)
- **Monthly summary stamps** — running balance, this month's income, this month's spend
- **Budget tracker** — set a monthly budget and watch a progress bar that turns amber near the limit and red once you're over
- **Category breakdown** — a hand-drawn donut chart (plain `<canvas>`, no charting library) with a matching legend
- **Search & filter** — filter the ledger by description, category, or transaction type
- **CSV export** — download your full transaction history as a `.csv` file
- **Persistent storage** — everything is saved to `localStorage`, so your data survives a page refresh
- **Responsive layout** — usable from a phone up to a desktop screen
- **No build step, no dependencies** — open `index.html` and it works

## Tech stack

| Layer     | Choice                                   |
|-----------|-------------------------------------------|
| Structure | Semantic HTML5                            |
| Styling   | Hand-written CSS (custom properties, grid/flexbox, no framework) |
| Behavior  | Vanilla JavaScript (ES6+), no build tools |
| Storage   | Browser `localStorage`                    |
| Charting  | Native Canvas API (no Chart.js/D3)        |
| Fonts     | Google Fonts — Fraunces, IBM Plex Mono, Inter |

## Project structure

```
ledgerline/
├── index.html          # Page structure and markup
├── css/
│   └── style.css       # All styling (design tokens at the top of the file)
├── js/
│   └── script.js       # App logic: state, storage, rendering, chart
├── LICENSE
└── README.md
```

## Getting started

No installation needed.

1. Clone the repo:
   ```bash
   git clone https://github.com/<your-username>/ledgerline.git
   cd ledgerline
   ```
2. Open `index.html` in any modern browser — double-click it, or serve it locally:
   ```bash
   # Python
   python3 -m http.server 8000
   # then visit http://localhost:8000
   ```
3. Start logging transactions. A few sample entries are pre-loaded on first run so the ledger isn't empty; delete them whenever you like.

### Deploying to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Source**, select the `main` branch and `/root`.
4. Your tracker will be live at `https://<your-username>.github.io/ledgerline/`.

## How it works

- All transactions are kept in a single array in memory and mirrored to `localStorage` on every change (`ledgerline:transactions`).
- The monthly budget is stored separately under `ledgerline:budget`.
- The category chart is drawn manually on a `<canvas>` element by computing per-category totals and slicing a circle by angle — a good example of using the Canvas API directly instead of a charting library.
- The whole app is a single IIFE in `js/script.js` with no global namespace pollution.

## Possible extensions

- Add a backend (Node/Express + MongoDB or Firebase) to sync data across devices
- Multi-currency support
- Recurring transactions (rent, subscriptions)
- Yearly view with month-over-month trend line
- User accounts and authentication

## License

MIT — see [LICENSE](LICENSE).
