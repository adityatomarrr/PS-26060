const energyData = {
  maitri: {
    generation: 82,
    consumption: 68,
    battery: 76,
    fuel: 64,
    status: "Normal",
    history: [
      { time: "00:00", generation: 70, consumption: 61 },
      { time: "04:00", generation: 68, consumption: 59 },
      { time: "08:00", generation: 75, consumption: 63 },
      { time: "12:00", generation: 91, consumption: 72 },
      { time: "16:00", generation: 86, consumption: 70 },
      { time: "20:00", generation: 82, consumption: 68 }
    ]
  },

  bharati: {
    generation: 94,
    consumption: 81,
    battery: 83,
    fuel: 71,
    status: "Normal",
    history: [
      { time: "00:00", generation: 82, consumption: 70 },
      { time: "04:00", generation: 79, consumption: 68 },
      { time: "08:00", generation: 88, consumption: 75 },
      { time: "12:00", generation: 101, consumption: 86 },
      { time: "16:00", generation: 97, consumption: 83 },
      { time: "20:00", generation: 94, consumption: 81 }
    ]
  }
};

module.exports = energyData;