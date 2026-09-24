/**
 * Recommendation Module — Implementation
 * Architecture §16 & PRD §15
 *
 * Exposes a stable RecommendationEngine interface with a deterministic
 * rules-based implementation for MVP, designed for zero-code-change swap
 * to an AI-assisted/LLM engine in Phase 3.
 */

export type VehicleType = 'HATCHBACK' | 'SEDAN' | 'SUV' | 'MUV' | 'LUXURY' | 'TWO_WHEELER';

export interface RecommendationInput {
  vehicle: {
    brand: string;
    model: string;
    year?: number;
    type?: VehicleType;
  };
  condition?: {
    existingScratches?: boolean;
    paintCondition?: string;
    existingCoatingOrPpf?: string;
  };
  desiredResult?: string;
  budgetRange?: {
    min?: number;
    max?: number;
  };
}

export interface RecommendationOutput {
  recommendation: {
    packageSlug?: string;
    serviceSlug?: string;
    confidence: number;
    rationale: string;
  };
  alternatives: Array<{
    packageSlug?: string;
    serviceSlug?: string;
    confidence: number;
  }>;
}

export interface RecommendationEngine {
  recommend(input: RecommendationInput): Promise<RecommendationOutput>;
}

/**
 * MVP Deterministic Rules-Based Recommendation Engine
 * Uses vehicle segment, paint condition keywords, and budget band to
 * return transparent, explainable detailing package and service suggestions.
 */
export class RulesBasedRecommendationEngine implements RecommendationEngine {
  async recommend(input: RecommendationInput): Promise<RecommendationOutput> {
    const { vehicle, condition, desiredResult, budgetRange } = input;
    const paintCond = (condition?.paintCondition || '').toLowerCase();
    const resultGoal = (desiredResult || '').toLowerCase();
    const maxBudget = budgetRange?.max ?? Infinity;
    const isLuxuryOrNew =
      vehicle.type === 'LUXURY' ||
      (vehicle.year && vehicle.year >= new Date().getFullYear() - 1);

    // Rule 1: High budget or luxury vehicle wanting maximum paint protection
    if (
      (isLuxuryOrNew || maxBudget >= 80000) &&
      (resultGoal.includes('ppf') || resultGoal.includes('protection') || resultGoal.includes('stone chip'))
    ) {
      return {
        recommendation: {
          packageSlug: 'ultimate-ppf',
          serviceSlug: 'paint-protection-film',
          confidence: 0.94,
          rationale: `For your ${vehicle.brand} ${vehicle.model}, our Ultimate TPU Paint Protection Film package provides complete self-healing defense against stone chips, scratches, and UV degradation with a 10-year warranty.`,
        },
        alternatives: [
          { packageSlug: 'ceramic-shield', serviceSlug: 'ceramic-coating', confidence: 0.78 },
          { packageSlug: 'preservation-detail', serviceSlug: 'paint-correction', confidence: 0.65 },
        ],
      };
    }

    // Rule 2: Heavy scratches or oxidation requiring multi-stage paint correction first
    if (
      condition?.existingScratches ||
      paintCond.includes('heavy') ||
      paintCond.includes('oxidation') ||
      paintCond.includes('swirl')
    ) {
      return {
        recommendation: {
          packageSlug: 'ceramic-shield',
          serviceSlug: 'paint-correction',
          confidence: 0.88,
          rationale: `Given the existing swirl marks and paint condition on your ${vehicle.brand} ${vehicle.model}, we recommend our Multi-Stage Paint Correction paired with a 9H Ceramic Coating to permanently restore optical gloss before sealing.`,
        },
        alternatives: [
          { packageSlug: 'preservation-detail', serviceSlug: 'exterior-detailing', confidence: 0.75 },
          { packageSlug: 'ultimate-ppf', serviceSlug: 'paint-protection-film', confidence: 0.62 },
        ],
      };
    }

    // Rule 3: Budget under ₹35,000 or routine rejuvenation
    if (maxBudget < 35000 || resultGoal.includes('interior') || resultGoal.includes('clean')) {
      return {
        recommendation: {
          packageSlug: 'preservation-detail',
          serviceSlug: 'interior-detailing',
          confidence: 0.85,
          rationale: `The Complete Preservation Detail revitalizes your ${vehicle.brand} ${vehicle.model} with multi-stage interior steam sanitization, leather conditioning, and single-step high-gloss exterior polishing.`,
        },
        alternatives: [
          { packageSlug: 'ceramic-shield', serviceSlug: 'ceramic-coating', confidence: 0.70 },
          { serviceSlug: 'exterior-detailing', confidence: 0.68 },
        ],
      };
    }

    // Default Rule: Ceramic Coating Protection Package
    return {
      recommendation: {
        packageSlug: 'ceramic-shield',
        serviceSlug: 'ceramic-coating',
        confidence: 0.82,
        rationale: `Our 9H Multi-Year Ceramic Coating package gives your ${vehicle.brand} ${vehicle.model} extreme hydrophobic water beading, deep wet-look gloss, and effortless maintenance.`,
      },
      alternatives: [
        { packageSlug: 'ultimate-ppf', serviceSlug: 'paint-protection-film', confidence: 0.74 },
        { packageSlug: 'preservation-detail', serviceSlug: 'paint-correction', confidence: 0.69 },
      ],
    };
  }
}

/**
 * Factory returning the active engine based on configuration.
 * Swap to AiRecommendationEngine in Phase 3 without changing callers.
 */
let instance: RecommendationEngine | null = null;

export function getRecommendationEngine(): RecommendationEngine {
  if (!instance) {
    instance = new RulesBasedRecommendationEngine();
  }
  return instance;
}
