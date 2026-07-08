# 🏎️ F1 Telemetry Dashboard

A modern, real-time Formula 1 dashboard built with React — featuring live driver & constructor standings, race calendar, and race results, wrapped in a sleek Ferrari-inspired telemetry design.

![Status](https://img.shields.io/badge/status-live-e24b4a?style=flat-square)
![React](https://img.shields.io/badge/React-Vite-DC0000?style=flat-square&logo=react)
![License](https://img.shields.io/badge/license-MIT-white?style=flat-square)

🔗 **Live Demo:** [wahidkherchache.github.io/F1-Dashboard](https://wahidkherchache.github.io/F1-Dashboard/)

---

## ✨ Features

- 🏁 **Overview** — next race countdown, current championship leaders
- 👨‍✈️ **Driver Standings** — full ranking table with points, wins, and progress bars
- 🏆 **Constructor Standings** — team rankings for the season
- 📅 **Race Calendar** — full season schedule with completed/upcoming status
- 🥇 **Last Race Results** — podium highlight + complete results table
- 📊 **Points Progression** — season points evolution per driver

## 🎨 Design

Inspired by Ferrari's racing identity — Rosso Corsa red, carbon-black backgrounds, and HUD/telemetry-style UI elements including animated start-light loaders and gauge-style progress indicators.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Routing | React Router |
| Styling | CSS |
| Data Source | [Jolpica-F1 API](https://api.jolpi.ca/ergast/f1/) |
| Deployment | GitHub Pages |

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/Wahidkherchache/f1-dashboard.git
cd f1-dashboard

# Install dependencies
npm install

# Run locally
npm run dev
```

The app will be available at `http://localhost:5173/F1-Dashboard/`

## 📦 Deployment

This project deploys to GitHub Pages via the `gh-pages` package:

```bash
npm run deploy
```

## 📡 API Reference

Data is fetched from the free, Ergast-compatible **Jolpica-F1 API**:

```
https://api.jolpi.ca/ergast/f1/{season}/driverStandings.json
https://api.jolpi.ca/ergast/f1/{season}/constructorStandings.json
https://api.jolpi.ca/ergast/f1/{season}/races.json
https://api.jolpi.ca/ergast/f1/{season}/last/results.json
```

Responses are cached client-side (`sessionStorage`, 5-minute TTL) to reduce redundant requests and respect API rate limits.

## 🗺️ Roadmap

- [ ] Individual driver profile pages
- [ ] Head-to-head driver comparison
- [ ] Lap-by-lap telemetry charts
- [ ] Dark/light theme toggle

## 👤 Author

**Abdelouahid Kherchache**
GitHub: [@Wahidkherchache](https://github.com/Wahidkherchache)

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">Built with 🔴 passion for Formula 1 and Ferrari</p>
