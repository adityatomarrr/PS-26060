const inventoryData = {
  maitri: {
    items: [
      {
        name: "Fuel",
        category: "Energy",
        current: 64,
        unit: "%",
        dailyConsumption: 2.1,
        daysRemaining: 30,
        status: "NORMAL",
        priority: "MEDIUM"
      },
      {
        name: "Food Supplies",
        category: "Life Support",
        current: 78,
        unit: "%",
        dailyConsumption: 1.4,
        daysRemaining: 56,
        status: "NORMAL",
        priority: "LOW"
      },
      {
        name: "Medical Supplies",
        category: "Safety",
        current: 61,
        unit: "%",
        dailyConsumption: 0.5,
        daysRemaining: 122,
        status: "NORMAL",
        priority: "LOW"
      },
      {
        name: "Spare Parts",
        category: "Maintenance",
        current: 43,
        unit: "%",
        dailyConsumption: 1.1,
        daysRemaining: 39,
        status: "LOW",
        priority: "HIGH"
      },
      {
        name: "Critical Equipment",
        category: "Operations",
        current: 86,
        unit: "%",
        dailyConsumption: 0.3,
        daysRemaining: 286,
        status: "NORMAL",
        priority: "LOW"
      }
    ]
  },

  bharati: {
    items: [
      {
        name: "Fuel",
        category: "Energy",
        current: 71,
        unit: "%",
        dailyConsumption: 1.8,
        daysRemaining: 39,
        status: "NORMAL",
        priority: "MEDIUM"
      },
      {
        name: "Food Supplies",
        category: "Life Support",
        current: 69,
        unit: "%",
        dailyConsumption: 1.3,
        daysRemaining: 53,
        status: "NORMAL",
        priority: "LOW"
      },
      {
        name: "Medical Supplies",
        category: "Safety",
        current: 48,
        unit: "%",
        dailyConsumption: 0.6,
        daysRemaining: 80,
        status: "LOW",
        priority: "MEDIUM"
      },
      {
        name: "Spare Parts",
        category: "Maintenance",
        current: 31,
        unit: "%",
        dailyConsumption: 1.0,
        daysRemaining: 31,
        status: "LOW",
        priority: "HIGH"
      },
      {
        name: "Critical Equipment",
        category: "Operations",
        current: 91,
        unit: "%",
        dailyConsumption: 0.2,
        daysRemaining: 455,
        status: "NORMAL",
        priority: "LOW"
      }
    ]
  }
};

module.exports = inventoryData;