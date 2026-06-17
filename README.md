# 🚀 BigQuery Release Pulse

[![Flask](https://img.shields.io/badge/Flask-v3.0.3-00e5ff?style=flat-square&logo=flask&logoColor=black)](https://flask.palletsprojects.com/)
[![Python](https://img.shields.io/badge/Python-v3.14-bd00ff?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-1d9bf0?style=flat-square&logo=github&logoColor=white)](https://github.com/divya-gh/antigravity-event-talks-app)

An elegant, high-fidelity developer dashboard that parses, caches, and visualizes Google Cloud BigQuery release notes in real time, featuring an interactive X/Twitter composer modal for instant sharing.

Designed with a premium **dark-space glassmorphism** aesthetic, glowing status badges, and dynamic animations.

---

## 🌟 Key Features

* **📡 Live XML Feed Parsing & Splitting**: Automatically fetches the official GCP BigQuery release notes and parses the HTML CDATA block, splitting entries by category headers (*Features*, *Issues*, *Announcements*, *Deprecations*) for individual reading.
* **📊 Analytics Dashboard Widgets**: High-level telemetry cards showcasing total release count, features count, known issues, and announcements based on current timeline filters.
* **🔍 Instant Search & Multi-Filters**: Real-time client-side search engine combined with category tabs and a dynamically compiled month/year dropdown filter.
* **🐦 Custom Tweet Composer & Preview**: An interactive, inside-app Twitter composer mockup that pre-drafts post summaries with appropriate hashtags and character limits, updating a live circular progress ring.
* **⚡ Time-Aware Caching Layer**: Maintains a 30-minute in-memory cache to ensure sub-millisecond responses and protect against Google API rate limits, featuring a manual refresh fallback structure.
* **📋 Copy Utilities**: Single-click clipboard actions for capturing direct documentation links or structured plain-text descriptions.

---

## 🛠️ Tech Stack

* **Backend Engine**:
  * **Python 3.14** — Core language
  * **Flask** — Server-side routing and template engine
  * **xml.etree.ElementTree** & **Regular Expressions (re)** — High-speed XML/HTML document parsing (zero external XML library dependencies)
  * **Requests** — Remote API resource fetching
* **Frontend Design**:
  * **HTML5** & **Vanilla CSS3** — Flexbox/Grid structures, Custom CSS Variables, Glassmorphic panels, keyframe twinkle animations, and particle star elements
  * **Vanilla JS (ES6)** — Dynamic DOM rendering, State Store (`activeFilters`), Clipboard APIs, and Modal triggers
  * **Google Fonts** (`Outfit`, `Inter`, `JetBrains Mono`) & **FontAwesome Icons**

---

## 📁 Project Structure

```
bigquery-release-viewer/
│
├── app.py                      # Flask Application Server & Feed Parser
├── requirements.txt            # Python Dependencies
├── project_architecture_guide.md # Architectural Details & Flowcharts
├── README.md                   # Beautiful Project Documentation
│
├── templates/
│   └── index.html              # HTML Dashboard Structure & Modals
│
└── static/
    ├── style.css               # Cosmic Dark Theme & Layout stylesheet
    └── script.js               # Reactive Frontend Controllers
```

---

## 🚀 Setup & Installation

Follow these steps to spin up the application locally:

### 1. Clone the Repository
```bash
git clone https://github.com/divya-gh/antigravity-event-talks-app.git
cd antigravity-event-talks-app
```

### 2. Configure Virtual Environment & Install Packages
Create a self-contained Python virtual environment, activate it, and install dependencies:

**On Windows:**
```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

**On macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Run the Flask Server
```bash
python app.py
```

The application will start running at:
* Local Address: [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 🌌 Visual Design & User Experience

* **Atmospheric Theme**: Built with a midnight-blue gradient base (`#070b13` to `#0c1220`) coupled with glowing radial lights and twinkle-delay star particles.
* **Glassmorphic Cards**: Cards utilize `backdrop-filter: blur(16px)` and semi-transparent borders to separate items cleanly against the background.
* **Responsive Layout**: Adapts dynamically from multi-column desktop grids down to single-column phone screens for readable tracking on any device.
* **Actionable Badges**: Visual color-coded indicators for quick classification:
  * <span style="color:#00f5d4">■</span> **Features** (Mint Green)
  * <span style="color:#ffb703">■</span> **Issues** (Warm Gold)
  * <span style="color:#bd00ff">■</span> **Announcements** (Purple)
  * <span style="color:#ff4d6d">■</span> **Deprecations** (Rose Red)

---

## 🔮 Future Roadmap & UX Improvements

Planned enhancements to elevate usability, accessibility, and fidelity:

* **🔍 Keyword Highlighting**: Visually highlight active search terms within the release note descriptions to show users matches immediately.
* **⌨️ Keyboard Navigation Shortcuts**: Autofocus search bar on page load, support `/` hotkey for search, and bind `Escape` key to close modals.
* **📄 Skeleton Screen Loading**: Replace the traditional loading spinner with a shimmering skeleton card layout to minimize perceived load times.
* **🔝 Scroll-to-Top Button**: Introduce a floating "Back to Top" button for quick navigation on deep scrollable lists.
* **⏳ Animated Toast Progress**: Add a countdown indicator bar at the bottom of copy toasts to show users exactly when the notice will disappear.
* **❌ Granular Search Resets**: Offer independent search clear actions so users don't lose active category filters when correcting a search typo.

