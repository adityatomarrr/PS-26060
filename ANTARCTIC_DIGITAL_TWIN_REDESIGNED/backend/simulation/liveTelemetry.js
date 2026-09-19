const environmentData = require("../data/environment");
const energyData = require("../data/energy");

const liveState = {};

for (const stationId of Object.keys(environmentData)) {
  liveState[stationId] = {
    environment: JSON.parse(JSON.stringify(environmentData[stationId])),
    energy: JSON.parse(JSON.stringify(energyData[stationId])),
    updatedAt: new Date().toISOString()
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function vary(value, amount) {
  return value + (Math.random() * 2 - 1) * amount;
}

function updateStation(stationId) {
  const state = liveState[stationId];
  if (!state) return null;

  const e = state.environment;
  const p = state.energy;

  e.temperature = Number(vary(e.temperature, 0.3).toFixed(1));
  e.humidity = Math.round(clamp(vary(e.humidity, 1), 20, 95));
  e.pressure = Math.round(clamp(vary(e.pressure, 1), 900, 1050));
  e.windSpeed = Math.round(clamp(vary(e.windSpeed, 1.5), 0, 80));

  p.generation = Math.round(clamp(vary(p.generation, 2), 40, 130));
  p.consumption = Math.round(clamp(vary(p.consumption, 1.5), 30, 120));
  p.battery = Number(clamp(
    p.battery + (p.generation - p.consumption) * 0.01,
    0, 100
  ).toFixed(1));
  p.fuel = Number(clamp(p.fuel - 0.02, 0, 100).toFixed(1));

  p.status =
    p.battery <= 20 || p.fuel <= 20 ? "Critical" :
    p.battery <= 40 || p.fuel <= 35 ? "Warning" :
    "Normal";

  state.updatedAt = new Date().toISOString();
  return state;
}

function getLiveState(stationId) {
  return updateStation(stationId);
}

module.exports = { getLiveState };
