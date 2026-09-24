import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RulesBasedRecommendationEngine } from '../src/modules/recommendation/index.ts';

describe('RulesBasedRecommendationEngine (PRD §15 & Architecture §16)', () => {
  const engine = new RulesBasedRecommendationEngine();

  it('recommends Ultimate PPF for luxury vehicles with protection goals', async () => {
    const result = await engine.recommend({
      vehicle: {
        brand: 'Porsche',
        model: '911 GT3',
        year: 2024,
        type: 'LUXURY',
      },
      desiredResult: 'Stone chip protection and track day defence',
      budgetRange: { min: 80000, max: 150000 },
    });

    assert.strictEqual(result.recommendation.packageSlug, 'ultimate-ppf');
    assert.strictEqual(result.recommendation.serviceSlug, 'paint-protection-film');
    assert.ok(result.recommendation.confidence >= 0.9);
    assert.ok(result.recommendation.rationale.includes('Porsche 911 GT3'));
    assert.ok(result.alternatives.length > 0);
  });

  it('recommends Paint Correction & Ceramic Shield for oxidized/swirled paint', async () => {
    const result = await engine.recommend({
      vehicle: {
        brand: 'BMW',
        model: '330i',
        year: 2021,
        type: 'SEDAN',
      },
      condition: {
        existingScratches: true,
        paintCondition: 'Heavy Swirls & Scratches',
      },
      desiredResult: 'Restore mirror reflection',
    });

    assert.strictEqual(result.recommendation.packageSlug, 'ceramic-shield');
    assert.strictEqual(result.recommendation.serviceSlug, 'paint-correction');
    assert.ok(result.recommendation.confidence >= 0.85);
    assert.ok(result.recommendation.rationale.toLowerCase().includes('swirl marks'));
  });

  it('recommends Preservation Detail for budget under ₹35,000 or interior sanitization', async () => {
    const result = await engine.recommend({
      vehicle: {
        brand: 'Hyundai',
        model: 'i20',
        year: 2022,
        type: 'HATCHBACK',
      },
      desiredResult: 'Interior deep clean and leather restoration',
      budgetRange: { min: 10000, max: 25000 },
    });

    assert.strictEqual(result.recommendation.packageSlug, 'preservation-detail');
    assert.strictEqual(result.recommendation.serviceSlug, 'interior-detailing');
    assert.ok(result.recommendation.confidence >= 0.8);
    assert.ok(result.recommendation.rationale.includes('Hyundai i20'));
  });

  it('provides default ceramic coating recommendation when inputs are neutral', async () => {
    const result = await engine.recommend({
      vehicle: {
        brand: 'Honda',
        model: 'City',
        year: 2020,
        type: 'SEDAN',
      },
    });

    assert.strictEqual(result.recommendation.packageSlug, 'ceramic-shield');
    assert.strictEqual(result.recommendation.serviceSlug, 'ceramic-coating');
    assert.ok(result.recommendation.confidence > 0.8);
    assert.ok(result.alternatives.some((a) => a.packageSlug === 'ultimate-ppf'));
  });
});
