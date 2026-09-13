const express = require("express");
const cors = require("cors");

const stations = require("./data/stations");
const environmentData = require("./data/environment");
const energyData = require("./data/energy");
const inventoryData = require("./data/inventory");

const {
  generateAlerts
} = require("./data/alerts");

const {
  getLiveState
} = require("./simulation/liveTelemetry");

const {
  runSimulation
} = require("./simulation/simulationEngine");

const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());


// ===============================
// HEALTH
// ===============================

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Antarctic Digital Twin API",
    timestamp: new Date().toISOString()
  });
});


// ===============================
// STATIONS
// ===============================

app.get("/api/stations", (req, res) => {
  res.json(stations);
});


app.get("/api/stations/:id", (req, res) => {
  const station = stations.find(
    station =>
      station.id === req.params.id
  );

  if (!station) {
    return res.status(404).json({
      message: "Station not found"
    });
  }

  res.json(station);
});


// ===============================
// ENVIRONMENT
// ===============================

app.get(
  "/api/stations/:id/environment",
  (req, res) => {
    const data =
      environmentData[
        req.params.id
      ];

    if (!data) {
      return res.status(404).json({
        message:
          "Environment data not found"
      });
    }

    res.json(data);
  }
);


// ===============================
// ENERGY
// ===============================

app.get(
  "/api/stations/:id/energy",
  (req, res) => {
    const data =
      energyData[
        req.params.id
      ];

    if (!data) {
      return res.status(404).json({
        message:
          "Energy data not found"
      });
    }

    res.json(data);
  }
);


// ===============================
// INVENTORY
// ===============================

app.get(
  "/api/stations/:id/inventory",
  (req, res) => {
    const data =
      inventoryData[
        req.params.id
      ];

    if (!data) {
      return res.status(404).json({
        message:
          "Inventory data not found"
      });
    }

    res.json(data);
  }
);


// ===============================
// INFRASTRUCTURE / ASSETS
// ===============================

app.get(
  "/api/stations/:id/assets",
  (req, res) => {

    const station =
      stations.find(
        station =>
          station.id ===
          req.params.id
      );

    if (!station) {
      return res.status(404).json({
        message:
          "Station not found"
      });
    }

    res.json({
      stationId:
        station.id,

      assets: [
        {
          id: "power-system",
          name: "Main Power System",
          category: "Energy",
          status: "NORMAL",
          health: 94
        },
        {
          id: "heating-system",
          name: "Heating System",
          category: "Life Support",
          status: "NORMAL",
          health: 91
        },
        {
          id: "fuel-farm",
          name: "Fuel Farm",
          category: "Energy",
          status: "NORMAL",
          health: 88
        },
        {
          id: "water-system",
          name: "Water System",
          category: "Utilities",
          status: "NORMAL",
          health: 93
        },
        {
          id: "satellite",
          name: "Satellite Communication",
          category: "Communication",
          status: "NORMAL",
          health: 97
        },
        {
          id: "cold-storage",
          name: "Cold Storage",
          category: "Life Support",
          status: "NORMAL",
          health: 89
        },
        {
          id: "waste-system",
          name: "Waste / Incineration",
          category: "Utilities",
          status: "NORMAL",
          health: 86
        },
        {
          id: "external-operations",
          name: "External Operations",
          category: "Logistics",
          status: "NORMAL",
          health: 92
        }
      ]
    });
  }
);


// ===============================
// LOGISTICS
// ===============================

app.get(
  "/api/stations/:id/logistics",
  (req, res) => {

    const inventory =
      inventoryData[
        req.params.id
      ];

    if (!inventory) {
      return res.status(404).json({
        message:
          "Logistics data not found"
      });
    }

    const lowStockItems =
      inventory.items.filter(
        item =>
          item.status === "LOW"
      );

    const highPriorityItems =
      inventory.items.filter(
        item =>
          item.priority ===
          "HIGH"
      );

    res.json({
      stationId:
        req.params.id,

      resupplyRequired:
        lowStockItems.length > 0,

      lowStockItems,

      highPriorityItems,

      nextResupplyWindow:
        "14 days",

      status:
        lowStockItems.length > 0
          ? "MONITOR"
          : "READY"
    });
  }
);


// ===============================
// ALERTS
// ===============================

app.get(
  "/api/stations/:id/alerts",
  (req, res) => {

    const environment =
      environmentData[
        req.params.id
      ];

    const energy =
      energyData[
        req.params.id
      ];

    if (
      !environment ||
      !energy
    ) {
      return res.status(404).json({
        message:
          "Station data not found"
      });
    }

    const alerts =
      generateAlerts(
        environment,
        energy
      );

    res.json({
      stationId:
        req.params.id,
      alerts
    });
  }
);


// ===============================
// LIVE TELEMETRY
// ===============================

app.get(
  "/api/stations/:id/live",
  (req, res) => {

    const state =
      getLiveState(
        req.params.id
      );

    if (!state) {
      return res.status(404).json({
        message:
          "Station not found"
      });
    }

    res.json(state);
  }
);


// ===============================
// SIMULATION
// ===============================

app.post(
  "/api/simulation/run",
  (req, res) => {

    const {
      stationId,
      scenario
    } = req.body;

    if (!stationId) {
      return res.status(400).json({
        message:
          "stationId is required"
      });
    }

    if (!scenario) {
      return res.status(400).json({
        message:
          "scenario is required"
      });
    }

    const validScenarios = [
      "extreme_weather",
      "energy_spike",
      "logistics_delay",
      "combined_stress"
    ];

    if (
      !validScenarios.includes(
        scenario
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid simulation scenario",

        validScenarios
      });
    }

    try {

      const result =
        runSimulation(
          stationId,
          scenario
        );

      if (!result) {
        return res.status(404).json({
          message:
            "Station not found"
        });
      }

      res.json(result);

    } catch (error) {

      console.error(
        "Simulation error:",
        error
      );

      res.status(500).json({
        message:
          "Simulation failed"
      });
    }
  }
);


// ===============================
// START
// ===============================

app.listen(
  PORT,
  () => {
    console.log(
      `Antarctic Digital Twin API running on http://localhost:${PORT}`
    );
  }
);