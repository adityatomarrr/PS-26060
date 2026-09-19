const environmentData = {
  maitri: {
    temperature: -18,
    humidity: 61,
    pressure: 982,
    windSpeed: 18,
    windDirection: "SW",
    history: [
      { time: "00:00", temperature: -20, windSpeed: 15 },
      { time: "04:00", temperature: -19, windSpeed: 17 },
      { time: "08:00", temperature: -18, windSpeed: 18 },
      { time: "12:00", temperature: -16, windSpeed: 21 },
      { time: "16:00", temperature: -17, windSpeed: 19 },
      { time: "20:00", temperature: -18, windSpeed: 18 }
    ]
  },

  bharati: {
    temperature: -12,
    humidity: 68,
    pressure: 976,
    windSpeed: 24,
    windDirection: "NW",
    history: [
      { time: "00:00", temperature: -14, windSpeed: 20 },
      { time: "04:00", temperature: -13, windSpeed: 22 },
      { time: "08:00", temperature: -12, windSpeed: 24 },
      { time: "12:00", temperature: -10, windSpeed: 27 },
      { time: "16:00", temperature: -11, windSpeed: 25 },
      { time: "20:00", temperature: -12, windSpeed: 24 }
    ]
  }
};

module.exports = environmentData;