function createAlert(severity, system, title, reason, action) {
  return {
    severity,
    system,
    title,
    reason,
    action
  };
}

function generateAlerts(environment, energy) {
  const alerts = [];

  if (environment.temperature <= -25) {
    alerts.push(
      createAlert(
        "CRITICAL",
        "Environment",
        "Extreme Temperature",
        `Temperature is ${environment.temperature}°C.`,
        "Increase heating reserve and restrict non-essential activity."
      )
    );
  } else if (environment.temperature <= -15) {
    alerts.push(
      createAlert(
        "WARNING",
        "Environment",
        "Low Temperature",
        `Temperature is ${environment.temperature}°C.`,
        "Monitor heating load and thermal systems."
      )
    );
  }

  if (environment.windSpeed >= 35) {
    alerts.push(
      createAlert(
        "CRITICAL",
        "Environment",
        "Severe Wind Conditions",
        `Wind speed is ${environment.windSpeed} km/h.`,
        "Suspend exposed outdoor operations."
      )
    );
  } else if (environment.windSpeed >= 25) {
    alerts.push(
      createAlert(
        "WARNING",
        "Environment",
        "High Wind",
        `Wind speed is ${environment.windSpeed} km/h.`,
        "Monitor external infrastructure and logistics."
      )
    );
  }

  if (energy.battery <= 20) {
    alerts.push(
      createAlert(
        "CRITICAL",
        "Energy",
        "Critical Battery Reserve",
        `Battery reserve is ${energy.battery}%.`,
        "Reduce non-essential loads and preserve emergency power."
      )
    );
  } else if (energy.battery <= 40) {
    alerts.push(
      createAlert(
        "WARNING",
        "Energy",
        "Low Battery Reserve",
        `Battery reserve is ${energy.battery}%.`,
        "Monitor consumption and charging capacity."
      )
    );
  }

  if (energy.fuel <= 20) {
    alerts.push(
      createAlert(
        "CRITICAL",
        "Energy",
        "Critical Fuel Reserve",
        `Fuel reserve is ${energy.fuel}%.`,
        "Prioritize fuel resupply planning."
      )
    );
  } else if (energy.fuel <= 35) {
    alerts.push(
      createAlert(
        "WARNING",
        "Energy",
        "Low Fuel Reserve",
        `Fuel reserve is ${energy.fuel}%.`,
        "Schedule fuel replenishment."
      )
    );
  }

  const energyBalance =
    energy.generation - energy.consumption;

  if (energyBalance < 0) {
    alerts.push(
      createAlert(
        energyBalance <= -10 ? "CRITICAL" : "WARNING",
        "Energy",
        "Negative Energy Balance",
        `Consumption exceeds generation by ${Math.abs(energyBalance)} kW.`,
        "Reduce non-essential loads and monitor reserves."
      )
    );
  }

  if (alerts.length === 0) {
    alerts.push(
      createAlert(
        "NORMAL",
        "System",
        "All Systems Normal",
        "No threshold-based operational alerts detected.",
        "Continue normal monitoring."
      )
    );
  }

  return alerts;
}

module.exports = {
  generateAlerts
};