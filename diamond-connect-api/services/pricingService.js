// services/pricingService.js

const calculatePrice = (diamondDetails) => {
  const { carat, color, clarity } = diamondDetails;

  let estimatedPrice = carat * 5000;

  const colorMultipliers = { 'D': 1.5, 'E': 1.4, 'F': 1.3, 'G': 1.2, 'H': 1.1, 'I': 1.0, 'J': 0.9 };
  estimatedPrice *= colorMultipliers[color.toUpperCase()] || 1;

  const clarityMultipliers = { 'IF': 1.5, 'VVS1': 1.4, 'VVS2': 1.3, 'VS1': 1.2, 'VS2': 1.1, 'SI1': 1.0, 'SI2': 0.9, 'I1': 0.8 };
  estimatedPrice *= clarityMultipliers[clarity.toUpperCase()] || 1;

  return parseFloat(estimatedPrice.toFixed(2));
};

module.exports = {
  calculatePrice,
};