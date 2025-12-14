import { PricingTier } from '@/constants/pricing-tier';

/**
 * Get token limit based on price_id
 * Pro: 5,000,000 tokens
 * Advanced: 1,000,000 tokens
 * Starter: 50,000 tokens (default)
 */
export function getTokenLimitFromPriceId(priceId: string | null | undefined): number {
  if (!priceId) return 50000; // Default for Starter

  // Find the tier that matches this price_id
  for (const tier of PricingTier) {
    if (tier.priceId.month === priceId || tier.priceId.year === priceId) {
      switch (tier.id) {
        case 'pro':
          return 5000000;
        case 'advanced':
          return 1000000;
        case 'starter':
        default:
          return 50000;
      }
    }
  }

  return 50000; // Default fallback
}
