🧊 Antarctic Digital Twin

A Unified Platform for Antarctic Station Monitoring, Simulation & Decision Support

«OBSERVE → ANALYZE → SIMULATE → RECOMMEND → ACT»

A web-based Antarctic Digital Twin that creates a unified operational view of research stations by combining environmental monitoring, energy management, infrastructure health, inventory, logistics, alerts, and scenario simulation.

Developed for Smart India Hackathon 2026 — PS-26060.

---

🌐 Overview

Antarctic research stations operate in an extremely harsh and isolated environment where weather conditions, energy availability, resources, infrastructure, and logistics are closely interconnected.

The Antarctic Digital Twin provides a single interactive platform to monitor these systems and understand how different events can affect station operations.

The platform currently models Maitri and Bharati research stations and includes live simulated telemetry and scenario-based simulations.

---

🎯 Problem Statement

Challenge| Impact| Digital Twin Approach
🌡️ Rapid weather changes| Threat to personnel and operations| Environmental monitoring
⚡ Energy constraints| Reduced operational capability| Energy & battery tracking
🏗️ Equipment health| Unexpected infrastructure failures| Asset health monitoring
📦 Limited resources| Risk of critical shortages| Inventory monitoring
🚢 Logistics delays| Delayed resupply and field operations| Logistics simulation
🚨 Distributed information| Difficult decision-making| Unified operational dashboard
🧪 Uncertain scenarios| Difficult to predict consequences| What-if simulation

---

🛰️ Key Features

🗺️ Station Monitoring

- Maitri and Bharati station profiles
- Interactive Antarctic map
- Station-level operational overview
- Centralized monitoring dashboard

🌡️ Environment Monitoring

- Temperature
- Humidity
- Atmospheric pressure
- Wind speed and direction
- Historical environmental trends
- Live simulated telemetry

⚡ Energy Management

- Energy generation
- Energy consumption
- Battery status
- Fuel availability
- Historical energy data
- Energy balance monitoring

🏗️ Infrastructure Monitoring

Track the health and operational status of critical assets:

- Main Power System
- Heating System
- Fuel Farm
- Water System
- Satellite Communication
- Cold Storage
- Waste & Incineration
- External Operations

📦 Inventory & Logistics

Monitor critical station resources:

- Fuel
- Food
- Medical supplies
- Spare parts
- Critical equipment

The platform tracks current availability, consumption, priority, and estimated days remaining.

🚨 Alerts & Risk Detection

Automatically identify critical conditions such as:

- Extreme temperatures
- High wind speeds
- Low battery levels
- Low fuel availability
- Negative energy balance

🧪 Scenario Simulation

Test the impact of operational scenarios without affecting the station's baseline data.

Available scenarios:

- 🌨️ Extreme Weather
- ⚡ Energy Spike
- 🚢 Logistics Delay
- 🔴 Combined Stress

---

🔄 Core Operational Flow

flowchart TB
    A[Station Data] --> B[Digital Twin]
    B --> C[Monitor Station]
    C --> D[Analyze Conditions]

    D --> E{Risk Detected?}

    E -->|Yes| F[Generate Alert]
    E -->|No| G[Continue Normal Operations]

    F --> H[Assess Situation]
    G --> H

    D --> I[Run Scenario Simulation]
    I --> H

    H --> J[Risk Assessment]
    J --> K[Generate Recommendation]
    K --> L[Operational Action]

---

🧠 Digital Twin Architecture

flowchart TB
    A[Antarctic Research Stations]
    A --> B[Digital Twin Backend]

    B --> C[Station Data Layer]

    C --> D[Environment Data]
    C --> E[Energy Data]
    C --> F[Infrastructure Data]
    C --> G[Inventory Data]
    C --> H[Logistics Data]

    B --> I[Operational Engines]

    I --> J[Alert Engine]
    I --> K[Live Telemetry]
    I --> L[Simulation Engine]

    D --> M[REST API]
    E --> M
    F --> M
    G --> M
    H --> M
    J --> M
    K --> M
    L --> M

    M --> N[Interactive React Dashboard]

    N --> O[Monitoring]
    N --> P[Visualization]
    N --> Q[Risk Assessment]
    N --> R[Decision Support]

---

🧪 Scenario Simulation

The simulation engine applies controlled changes to the digital twin to estimate how a scenario could affect station operations.

flowchart TB
    A[Operator Selects Scenario]
    A --> B[Simulation Engine]

    B --> C[Apply Scenario Conditions]

    C --> D[Environmental Impact]
    C --> E[Energy Impact]
    C --> F[Resource Impact]
    C --> G[Logistics Impact]

    D --> H[Calculate Overall Impact]
    E --> H
    F --> H
    G --> H

    H --> I[Risk Assessment]
    I --> J[Generate Recommendations]
    J --> K[Display Simulation Results]
    K --> L[Operational Decision]

Example: Extreme Weather

Extreme Weather
       ↓
Temperature & Wind Change
       ↓
Higher Energy Demand
       ↓
Battery / Fuel Impact
       ↓
Resource & Operational Risk
       ↓
Recommended Response

---

🏗️ System Architecture

flowchart TB
    A[Operator]
    A --> B[React Frontend]

    B --> C[Dashboard]
    B --> D[Interactive Map]
    B --> E[Charts & Analytics]
    B --> F[Simulation Panel]

    C --> G[REST API]
    D --> G
    E --> G
    F --> G

    G --> H[Node.js + Express Backend]

    H --> I[Environment]
    H --> J[Energy]
    H --> K[Infrastructure]
    H --> L[Inventory & Logistics]
    H --> M[Alert Engine]
    H --> N[Live Telemetry]
    H --> O[Simulation Engine]

    I --> P[Operational Insights]
    J --> P
    K --> P
    L --> P
    M --> P
    N --> P
    O --> P

    P --> Q[Risk Assessment]
    Q --> R[Recommendations]
    R --> S[Operator Decision]

---

📊 Platform Modules

Module| Purpose
Overview| Overall station operational status
Stations| Station information and location
Environment| Environmental conditions and trends
Energy| Power, battery and fuel monitoring
Infrastructure| Critical asset health
Logistics| Resource and logistics status
Alerts| Operational risk notifications
Simulation| What-if scenario analysis
Satellite Link| Communication interface
Data Monitor| Telemetry monitoring

---

🏔️ Supported Stations

Maitri

Location: Schirmacher Oasis, Antarctica

The digital twin includes environmental, energy, infrastructure, inventory, and operational information for the Maitri station.

Bharati

Location: Stornes Peninsula, Antarctica

Bharati is represented as a second Antarctic research station, demonstrating multi-station monitoring through the same platform.

---

🛠️ Tech Stack

Category| Technology
Frontend| React 19
Build Tool| Vite
Styling| CSS, Tailwind CSS
Maps| Leaflet, React Leaflet
Charts| Recharts
Icons| Lucide React
Backend| Node.js, Express
API| REST
Data| JavaScript-based datasets
Simulation| Node.js simulation engine

---

📁 Project Structure

PS-26060-final-platform/
│
├── backend/
│   ├── data/
│   │   ├── alerts.js
│   │   ├── energy.js
│   │   ├── environment.js
│   │   ├── inventory.js
│   │   └── stations.js
│   │
│   ├── simulation/
│   │   ├── liveTelemetry.js
│   │   └── simulationEngine.js
│   │
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── assets/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── SimulationPanel.jsx
    │   ├── index.css
    │   └── theme.css
    │
    ├── index.html
    ├── vite.config.js
    └── package.json

---

🔌 API Endpoints

GET  /api/health

GET  /api/stations
GET  /api/stations/:id

GET  /api/stations/:id/environment
GET  /api/stations/:id/energy
GET  /api/stations/:id/inventory
GET  /api/stations/:id/assets
GET  /api/stations/:id/logistics
GET  /api/stations/:id/alerts
GET  /api/stations/:id/live

POST /api/simulation/run

---

🚀 Getting Started

Prerequisites

- Node.js
- npm

Backend

cd backend
npm install
node server.js

Backend runs on:

http://localhost:5000

Frontend

Open another terminal:

cd frontend
npm install
npm run dev

Frontend normally runs on:

http://localhost:5173

---

💡 Digital Twin in Action

The platform connects different station systems instead of treating them independently.

Weather Event
      ↓
Environmental Change
      ↓
Energy Consumption ↑
      ↓
Battery / Fuel ↓
      ↓
Operational Risk ↑
      ↓
Alert + Simulation
      ↓
Recommended Action

This allows operators to move from simply observing current conditions to understanding the potential operational consequences of a scenario.

---

🎯 Project Objective

To provide a unified, interactive, and simulation-driven operational platform for Antarctic research stations that helps users monitor station health, identify risks, and evaluate possible responses to challenging conditions.

«One platform. One operational view. Better decisions.»

---

👥 Smart India Hackathon 2026

Problem Statement: PS-26060
Project: Antarctic Digital Twin
Domain: Antarctic Research Station Operations & Decision Support

---
