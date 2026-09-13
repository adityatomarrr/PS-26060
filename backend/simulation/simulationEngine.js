const environmentData = require("../data/environment");
const energyData = require("../data/energy");
const inventoryData = require("../data/inventory");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function runSimulation(stationId, scenario = "extreme_weather") {
  const baseEnvironment = environmentData[stationId];
  const baseEnergy = energyData[stationId];
  const baseInventory = inventoryData[stationId];

  if (!baseEnvironment || !baseEnergy || !baseInventory) {
    return null;
  }

  let temperature = baseEnvironment.temperature;
  let humidity = baseEnvironment.humidity;
  let pressure = baseEnvironment.pressure;
  let windSpeed = baseEnvironment.windSpeed;
  let windDirection = baseEnvironment.windDirection;

  let generation = baseEnergy.generation;
  let consumption = baseEnergy.consumption;
  let battery = baseEnergy.battery;
  let fuel = baseEnergy.fuel;

  let inventory = JSON.parse(
    JSON.stringify(baseInventory)
  );

  const effects = [];
  const recommendations = [];

  if (scenario === "extreme_weather") {
    temperature -= 12;
    windSpeed += 15;
    consumption += 15;
    battery -= 10;

    effects.push(
      `Temperature drops to ${temperature}°C, increasing heating demand.`
    );

    effects.push(
      `Wind speed rises to ${windSpeed} km/h, increasing external operational risk.`
    );

    effects.push(
      `Energy consumption increases to ${consumption} kW.`
    );

    recommendations.push(
      "Increase heating reserve and monitor thermal systems."
    );

    recommendations.push(
      "Restrict non-essential outdoor operations during severe conditions."
    );
  }

  if (scenario === "energy_spike") {
    consumption += 30;
    battery -= 18;

    effects.push(
      `Station consumption rises to ${consumption} kW due to increased electrical demand.`
    );

    effects.push(
      `Battery reserve decreases to ${clamp(battery, 0, 100)}%.`
    );

    recommendations.push(
      "Reduce non-essential electrical loads."
    );

    recommendations.push(
      "Preserve battery reserve for critical station systems."
    );
  }

  if (scenario === "logistics_delay") {
    inventory.items = inventory.items.map((item) => {
      const additionalConsumption =
        item.dailyConsumption * 10;

      const newCurrent = clamp(
        item.current - additionalConsumption,
        0,
        100
      );

      const remaining =
        item.dailyConsumption > 0
          ? Math.floor(
              newCurrent / item.dailyConsumption
            )
          : item.daysRemaining;

      return {
        ...item,
        current: Number(newCurrent.toFixed(1)),
        daysRemaining: Math.max(0, remaining),
        status:
          newCurrent <= 20
            ? "CRITICAL"
            : newCurrent <= 50
            ? "LOW"
            : "NORMAL"
      };
    });

    fuel -= 8;

    effects.push(
      "Resupply is delayed by 10 days."
    );

    effects.push(
      "Inventory reserves decrease according to daily consumption."
    );

    effects.push(
      "Fuel reserve decreases as logistics operations continue."
    );

    recommendations.push(
      "Prioritize critical and low-stock inventory for the next resupply mission."
    );

    recommendations.push(
      "Review fuel and spare-parts availability before the next logistics window."
    );
  }

  if (scenario === "combined_stress") {
    temperature -= 10;
    windSpeed += 12;
    consumption += 25;
    battery -= 18;
    fuel -= 10;

    inventory.items = inventory.items.map((item) => {
      const additionalConsumption =
        item.dailyConsumption * 7;

      const newCurrent = clamp(
        item.current - additionalConsumption,
        0,
        100
      );

      const remaining =
        item.dailyConsumption > 0
          ? Math.floor(
              newCurrent / item.dailyConsumption
            )
          : item.daysRemaining;

      return {
        ...item,
        current: Number(newCurrent.toFixed(1)),
        daysRemaining: Math.max(0, remaining),
        status:
          newCurrent <= 20
            ? "CRITICAL"
            : newCurrent <= 50
            ? "LOW"
            : "NORMAL"
      };
    });

    effects.push(
      `Temperature falls to ${temperature}°C, increasing heating demand.`
    );

    effects.push(
      `Wind speed increases to ${windSpeed} km/h.`
    );

    effects.push(
      `Energy consumption increases to ${consumption} kW.`
    );

    effects.push(
      "Logistics disruption reduces available inventory reserves."
    );

    recommendations.push(
      "Prioritize critical station systems and emergency power reserves."
    );

    recommendations.push(
      "Restrict non-essential outdoor and electrical operations."
    );

    recommendations.push(
      "Prepare high-priority inventory for accelerated resupply."
    );
  }

  temperature = Number(temperature.toFixed(1));
  windSpeed = Number(windSpeed.toFixed(1));
  generation = Number(generation.toFixed(1));
  consumption = Number(consumption.toFixed(1));

  battery = clamp(
    Number(battery.toFixed(1)),
    0,
    100
  );

  fuel = clamp(
    Number(fuel.toFixed(1)),
    0,
    100
  );

  const energyBalance = Number(
    (generation - consumption).toFixed(1)
  );

  const risks = [];

  if (temperature <= -25) {
    risks.push({
      severity: "CRITICAL",
      system: "Environment",
      title: "Extreme Temperature",
      reason: `Projected temperature is ${temperature}°C.`,
      action:
        "Increase heating reserve and restrict non-essential activity."
    });
  } else if (temperature <= -15) {
    risks.push({
      severity: "WARNING",
      system: "Environment",
      title: "Low Temperature",
      reason: `Projected temperature is ${temperature}°C.`,
      action:
        "Monitor heating load and thermal systems."
    });
  }

  if (windSpeed >= 35) {
    risks.push({
      severity: "CRITICAL",
      system: "Environment",
      title: "Severe Wind Conditions",
      reason: `Projected wind speed is ${windSpeed} km/h.`,
      action:
        "Suspend exposed outdoor operations."
    });
  } else if (windSpeed >= 25) {
    risks.push({
      severity: "WARNING",
      system: "Environment",
      title: "High Wind",
      reason: `Projected wind speed is ${windSpeed} km/h.`,
      action:
        "Monitor external infrastructure and logistics."
    });
  }

  if (battery <= 20) {
    risks.push({
      severity: "CRITICAL",
      system: "Energy",
      title: "Critical Battery Reserve",
      reason: `Projected battery reserve is ${battery}%.`,
      action:
        "Reduce non-essential loads and preserve emergency power."
    });
  } else if (battery <= 40) {
    risks.push({
      severity: "WARNING",
      system: "Energy",
      title: "Low Battery Reserve",
      reason: `Projected battery reserve is ${battery}%.`,
      action:
        "Monitor consumption and charging capacity."
    });
  }

  if (fuel <= 20) {
    risks.push({
      severity: "CRITICAL",
      system: "Energy",
      title: "Critical Fuel Reserve",
      reason: `Projected fuel reserve is ${fuel}%.`,
      action:
        "Prioritize fuel resupply planning."
    });
  } else if (fuel <= 35) {
    risks.push({
      severity: "WARNING",
      system: "Energy",
      title: "Low Fuel Reserve",
      reason: `Projected fuel reserve is ${fuel}%.`,
      action:
        "Schedule fuel replenishment."
    });
  }

  if (energyBalance < 0) {
    risks.push({
      severity:
        energyBalance <= -10
          ? "CRITICAL"
          : "WARNING",
      system: "Energy",
      title: "Negative Energy Balance",
      reason:
        `Consumption exceeds generation by ${Math.abs(
          energyBalance
        )} kW.`,
      action:
        "Reduce non-essential loads and monitor reserves."
    });
  }

  const lowStockItems =
    inventory.items.filter(
      (item) =>
        item.status === "LOW" ||
        item.status === "CRITICAL"
    );

  if (lowStockItems.length > 0) {
    risks.push({
      severity:
        lowStockItems.some(
          (item) => item.status === "CRITICAL"
        )
          ? "CRITICAL"
          : "WARNING",
      system: "Logistics",
      title: "Inventory Resupply Risk",
      reason:
        `${lowStockItems.length} inventory item(s) require attention.`,
      action:
        "Prioritize affected items in the next logistics planning cycle."
    });
  }

  let riskScore = 0;

  risks.forEach((risk) => {
    if (risk.severity === "CRITICAL") {
      riskScore += 30;
    }

    if (risk.severity === "WARNING") {
      riskScore += 15;
    }
  });

  riskScore = clamp(
    riskScore,
    0,
    100
  );

  let riskLevel = "NORMAL";

  if (riskScore >= 60) {
    riskLevel = "CRITICAL";
  } else if (riskScore >= 20) {
    riskLevel = "WARNING";
  }

  if (risks.length === 0) {
    effects.push(
      "No major threshold-based operational risks detected."
    );

    recommendations.push(
      "Continue normal monitoring of station systems."
    );
  }

  return {
    station: stationId,
    scenario,

    riskScore,
    riskLevel,

    environment: {
      temperature,
      humidity,
      pressure,
      windSpeed,
      windDirection,
      history: baseEnvironment.history
    },

    energy: {
      generation,
      consumption,
      battery,
      fuel,
      status:
        energyBalance >= 0
          ? "Normal"
          : "Under Pressure",
      history: baseEnergy.history
    },

    inventory,

    energyBalance,

    effects,
    recommendations,
    risks,

    generatedAt:
      new Date().toISOString()
  };
}

module.exports = {
  runSimulation
};