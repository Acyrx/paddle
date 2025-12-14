export interface Tier {
  name: string;
  id: 'starter' | 'pro' | 'advanced';
  icon: string;
  description: string;
  features: string[];
  featured: boolean;
  priceId: Record<string, string>;
}

export const PricingTier: Tier[] = [
  // {
  //   name: 'Starter',
  //   id: 'starter',
  //   icon: '/assets/icons/price-tiers/free-icon.svg',
  //   description: 'Ideal for individuals who want to get started with simple design tasks.',
  //   features: ['Deep Insight', 'Access Javascript and Python', 'Chat Tutoring'],
  //   featured: false,
  //   priceId: { month: 'pri_01hsxyh9txq4rzbrhbyngkhy46', year: 'pri_01hsxyh9txq4rzbrhbyngkhy46' },
  // },
  {
    name: 'Pro',
    id: 'pro',
    icon: '/assets/icons/price-tiers/basic-icon.svg',
    description: 'Enhanced design tools for scaling teams who need more flexibility.',
    features: [
      'Access all language',
      'Voice tutoring',
      'Journey',
      'Share projects',
      'Everything in Starter',
      '5000000',
    ],
    featured: true,
    priceId: { month: 'pri_01kcdrdmyams9kk94qypmzds7m', year: 'pri_01kcdrtdy74pj77ejrwmd90hqs' },
  },
  {
    name: 'Advanced',
    id: 'advanced',
    icon: '/assets/icons/price-tiers/pro-icon.svg',
    description: 'Powerful tools designed for extensive collaboration and customization.',
    features: ['1000000 tokens', 'Everything in Pro'],
    featured: false,
    priceId: { month: 'pri_01kcdrjkt176fqaypy6w6637hk', year: 'pri_01kcdrqxhbxphw2x4ajmzmy61r' },
  },
];
