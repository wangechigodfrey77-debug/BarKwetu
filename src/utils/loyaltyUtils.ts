import { LoyaltyReward, LoyaltyTier, KwetuCoinTransaction } from '../types';

export const LOYALTY_REWARDS: LoyaltyReward[] = [
  {
    id: 'reward-100kes',
    title: 'KSh 100 Instant Discount',
    description: 'Redeemable on any reserve bottle or spirit order across Kenya.',
    coinCost: 100,
    discountType: 'fixed',
    discountValue: 100,
    minSpend: 1000,
    badge: 'Popular',
    iconName: 'Ticket',
  },
  {
    id: 'reward-free-delivery',
    title: 'Free Express Karatina Delivery',
    description: 'Waives the entire KSh 100 express dispatch fee on your next order.',
    coinCost: 100,
    discountType: 'free_delivery',
    discountValue: 100,
    minSpend: 500,
    badge: 'Best Convenience',
    iconName: 'Truck',
  },
  {
    id: 'reward-250kes',
    title: 'KSh 250 Reserve Voucher',
    description: 'Special member discount with 20 bonus coin discount savings.',
    coinCost: 230,
    discountType: 'fixed',
    discountValue: 250,
    minSpend: 2500,
    badge: 'Save 20 Coins',
    iconName: 'Gift',
  },
  {
    id: 'reward-500kes',
    title: 'KSh 500 Cellar Voucher',
    description: 'Premium discount applied immediately at checkout on orders over KSh 4,500.',
    coinCost: 450,
    discountType: 'fixed',
    discountValue: 500,
    minSpend: 4500,
    badge: 'Save 50 Coins',
    iconName: 'Sparkles',
  },
  {
    id: 'reward-1000kes',
    title: 'KSh 1,000 VIP Gold Voucher',
    description: 'Ultimate connoisseur discount on premium single malts and vintage cognacs.',
    coinCost: 850,
    discountType: 'fixed',
    discountValue: 1000,
    minSpend: 8000,
    badge: 'Save 150 Coins',
    iconName: 'Crown',
  },
];

export const TIER_THRESHOLDS = {
  Bronze: { min: 0, max: 499, multiplier: 1.0, name: 'Bronze Cellar' },
  Silver: { min: 500, max: 1499, multiplier: 1.25, name: 'Silver Cellar' },
  Gold: { min: 1500, max: 3999, multiplier: 1.5, name: 'Gold Reserve' },
  'Platinum VIP': { min: 4000, max: Infinity, multiplier: 2.0, name: 'Platinum VIP' },
};

export const calculateTier = (lifetimeCoins: number = 0): LoyaltyTier => {
  if (lifetimeCoins >= 4000) return 'Platinum VIP';
  if (lifetimeCoins >= 1500) return 'Gold';
  if (lifetimeCoins >= 500) return 'Silver';
  return 'Bronze';
};

export const getTierMultiplier = (tier: LoyaltyTier = 'Bronze'): number => {
  return TIER_THRESHOLDS[tier]?.multiplier || 1.0;
};

export const getTierProgress = (lifetimeCoins: number = 0) => {
  const currentTier = calculateTier(lifetimeCoins);
  if (currentTier === 'Platinum VIP') {
    return {
      currentTier,
      nextTier: null,
      coinsNeeded: 0,
      progressPercent: 100,
      currentTierInfo: TIER_THRESHOLDS[currentTier],
    };
  }

  let nextTier: LoyaltyTier = 'Silver';
  let target = 500;
  let base = 0;

  if (currentTier === 'Bronze') {
    nextTier = 'Silver';
    base = 0;
    target = 500;
  } else if (currentTier === 'Silver') {
    nextTier = 'Gold';
    base = 500;
    target = 1500;
  } else if (currentTier === 'Gold') {
    nextTier = 'Platinum VIP';
    base = 1500;
    target = 4000;
  }

  const earnedInTier = Math.max(0, lifetimeCoins - base);
  const totalInTier = target - base;
  const progressPercent = Math.min(100, Math.round((earnedInTier / totalInTier) * 100));
  const coinsNeeded = Math.max(0, target - lifetimeCoins);

  return {
    currentTier,
    nextTier,
    coinsNeeded,
    progressPercent,
    currentTierInfo: TIER_THRESHOLDS[currentTier],
    nextTierInfo: TIER_THRESHOLDS[nextTier],
  };
};

export const getTierPerks = (tier: LoyaltyTier = 'Bronze') => {
  switch (tier) {
    case 'Platinum VIP':
      return [
        '2.0x Double Kwetu Coins on every order',
        'Private Sommelier direct hotline assistance',
        'Guaranteed reservation on rare limited casks',
        'Exclusive invitations to private distillery tastings',
      ];
    case 'Gold':
      return [
        '1.5x Kwetu Coins boost on all spirits',
        'Priority express dispatch & packaging seal',
        'Complimentary cocktail garnish pairing packs',
        'Early access to seasonal rare single malts',
      ];
    case 'Silver':
      return [
        '1.25x Kwetu Coins on every bottle purchased',
        'Access to exclusive Silver Member discount vouchers',
        'Priority customer care & tracking alerts',
      ];
    case 'Bronze':
    default:
      return [
        'Earn 1 Kwetu Coin per KSh 100 spent',
        '100 Welcome Bonus Coins on registration',
        'Instant voucher redemption starting at 100 Coins',
      ];
  }
};
