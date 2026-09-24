import { describe, it } from 'node:test';
import assert from 'node:assert';

function calculateEstimate(basePrice: number, vehicleType?: string, condition?: string) {
  let vehicleMultiplier = 1.1;
  switch (vehicleType) {
    case 'HATCHBACK':
      vehicleMultiplier = 1.0;
      break;
    case 'SEDAN':
      vehicleMultiplier = 1.15;
      break;
    case 'SUV':
    case 'MUV':
      vehicleMultiplier = 1.3;
      break;
    case 'LUXURY':
      vehicleMultiplier = 1.5;
      break;
    case 'TWO_WHEELER':
      vehicleMultiplier = 0.5;
      break;
  }

  let conditionMultiplier = 1.0;
  if (condition === 'Heavy Swirls & Scratches') {
    conditionMultiplier = 1.2;
  } else if (condition === 'Paint Oxidation / Faded') {
    conditionMultiplier = 1.3;
  }

  const calculated = Math.round((basePrice * vehicleMultiplier * conditionMultiplier) / 500) * 500;
  const estimateMin = calculated;
  const estimateMax = Math.round((calculated * 1.25) / 500) * 500;

  return { min: estimateMin, max: estimateMax };
}

describe('Algorithmic Estimate Calculations (Architecture §13.2 & PRD QR-1)', () => {
  const ceramicBasePrice = 25000;

  it('calculates correct multiplier for Hatchback with standard paint', () => {
    const est = calculateEstimate(ceramicBasePrice, 'HATCHBACK', 'New Car / Minor Swirls');
    // 25000 * 1.0 * 1.0 = 25000
    assert.strictEqual(est.min, 25000);
    // 25000 * 1.25 = 31250 -> rounded to nearest 500 = 31500
    assert.strictEqual(est.max, 31500);
  });

  it('calculates correct multiplier for SUV with heavy scratches', () => {
    const est = calculateEstimate(ceramicBasePrice, 'SUV', 'Heavy Swirls & Scratches');
    // 25000 * 1.3 * 1.2 = 39000
    assert.strictEqual(est.min, 39000);
    // 39000 * 1.25 = 48750 -> rounded to nearest 500 = 49000
    assert.strictEqual(est.max, 49000);
  });

  it('calculates correct multiplier for Luxury vehicle with paint oxidation', () => {
    const est = calculateEstimate(ceramicBasePrice, 'LUXURY', 'Paint Oxidation / Faded');
    // 25000 * 1.5 * 1.3 = 48750 -> rounded to nearest 500 = 49000
    assert.strictEqual(est.min, 49000);
    // 49000 * 1.25 = 61250 -> rounded to nearest 500 = 61500
    assert.strictEqual(est.max, 61500);
  });

  it('calculates correct half-rate multiplier for Two Wheelers', () => {
    const est = calculateEstimate(10000, 'TWO_WHEELER');
    // 10000 * 0.5 = 5000
    assert.strictEqual(est.min, 5000);
    assert.strictEqual(est.max, 6500);
  });
});
