import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatKES } from '../utils/formatters';
import { LOYALTY_REWARDS, getTierProgress, getTierPerks, getTierMultiplier } from '../utils/loyaltyUtils';
import { KENYA_COUNTIES } from '../data/kenyaLocations';
import {
  X,
  Coins,
  Gift,
  Truck,
  Ticket,
  Crown,
  Shield,
  Clock,
  ArrowUpRight,
  Copy,
  Check,
  Package,
  MapPin,
  User as UserIcon,
  Phone,
  Mail,
  ChevronRight,
  ExternalLink,
  ShoppingBag,
  Award,
  Zap,
  RotateCcw,
  Receipt,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';

export const CustomerProfileModal: React.FC = () => {
  const {
    currentUser,
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileActiveTab,
    setProfileActiveTab,
    redeemLoyaltyReward,
    updateUserProfile,
    orders,
    products,
    addToCart,
    setActiveView,
    setCurrentOrder,
    applyPromoCode,
    setIsCartOpen,
    cart,
    logout,
  } = useStore();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isRedeemingId, setIsRedeemingId] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'delivered'>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Profile Edit Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [county, setCounty] = useState(currentUser?.defaultCounty || 'Nyeri');
  const [town, setTown] = useState(currentUser?.defaultTown || 'Karatina CBD / Commercial Street');
  const [address, setAddress] = useState(currentUser?.defaultAddress || '');

  // Reset state on user change
  React.useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setPhone(currentUser.phone || '');
      setCounty(currentUser.defaultCounty || 'Nyeri');
      setTown(currentUser.defaultTown || 'Karatina CBD / Commercial Street');
      setAddress(currentUser.defaultAddress || '');
    }
  }, [currentUser]);

  if (!isProfileModalOpen || !currentUser) return null;

  const currentCoins = currentUser.kwetuCoins || 0;
  const lifetimeCoins = currentUser.lifetimeCoinsEarned || currentCoins;
  const tierProgress = getTierProgress(lifetimeCoins);
  const currentTier = tierProgress.currentTier;
  const multiplier = getTierMultiplier(currentTier);
  const userOrders = orders.filter(
    (o) => o.userId === currentUser.id || o.userEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  const getOrderCoins = (order: any) => {
    if (typeof order.kwetuCoinsEarned === 'number' && order.kwetuCoinsEarned > 0) {
      return order.kwetuCoinsEarned;
    }
    return Math.max(1, Math.round(((order.total || 0) / 100) * multiplier));
  };

  const totalUserSpend = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalCoinsFromOrders = userOrders.reduce((sum, o) => sum + getOrderCoins(o), 0);

  const filteredOrders = userOrders.filter((order) => {
    const matchesFilter =
      orderFilter === 'all'
        ? true
        : orderFilter === 'active'
        ? order.status !== 'delivered' && order.status !== 'cancelled'
        : order.status === 'delivered';

    const matchesSearch =
      !orderSearch.trim() ||
      order.orderNumber.toLowerCase().includes(orderSearch.toLowerCase().trim()) ||
      order.items.some((it: any) => it.productName.toLowerCase().includes(orderSearch.toLowerCase().trim())) ||
      (order.mpesaDetails?.receiptNumber &&
        order.mpesaDetails.receiptNumber.toLowerCase().includes(orderSearch.toLowerCase().trim()));

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return {
          label: 'Delivered',
          bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
          dot: 'bg-emerald-400',
        };
      case 'out_for_delivery':
        return {
          label: 'Out for Express Delivery',
          bg: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'preparing':
        return {
          label: 'Packaging & Seal',
          bg: 'bg-blue-950/80 text-blue-400 border-blue-800/60',
          dot: 'bg-blue-400',
        };
      case 'paid':
        return {
          label: 'Payment Confirmed',
          bg: 'bg-teal-950/80 text-teal-400 border-teal-800/60',
          dot: 'bg-teal-400',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          bg: 'bg-rose-950/80 text-rose-400 border-rose-800/60',
          dot: 'bg-rose-400',
        };
      case 'pending':
      default:
        return {
          label: 'Awaiting Payment',
          bg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
          dot: 'bg-zinc-400',
        };
    }
  };

  const handleReorder = (order: any) => {
    order.items.forEach((item: any) => {
      const matchedProduct = products.find((p) => p.id === item.productId);
      if (matchedProduct) {
        addToCart(matchedProduct, item.quantity);
      }
    });
    setIsProfileModalOpen(false);
    setIsCartOpen(true);
  };

  const handleCopyCode = async (code: string) => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2500);
      } catch (err) {
        console.warn('Copy failed', err);
      }
    }
  };

  const handleRedeem = async (rewardId: string) => {
    setIsRedeemingId(rewardId);
    await redeemLoyaltyReward(rewardId);
    setIsRedeemingId(null);
  };

  const handleApplyVoucherToCart = (code: string) => {
    const res = applyPromoCode(code);
    if (res.success) {
      setIsProfileModalOpen(false);
      setIsCartOpen(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    await updateUserProfile({
      fullName,
      phone,
      defaultCounty: county,
      defaultTown: town,
      defaultAddress: address,
    });
    setSaveLoading(false);
  };

  const handleViewOrderTracking = (order: any) => {
    setCurrentOrder(order);
    setIsProfileModalOpen(false);
    setActiveView('track-order');
  };

  const renderRewardIcon = (iconName: string) => {
    switch (iconName) {
      case 'Truck':
        return <Truck className="w-5 h-5 text-emerald-400" />;
      case 'Gift':
        return <Gift className="w-5 h-5 text-amber-400" />;
      case 'Award':
        return <Award className="w-5 h-5 text-[#d4af37]" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-purple-400" />;
      case 'Ticket':
      default:
        return <Ticket className="w-5 h-5 text-[#d4af37]" />;
    }
  };

  const selectedCountyObj = KENYA_COUNTIES.find((c) => c.name === county);
  const availableTowns = selectedCountyObj ? selectedCountyObj.towns : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#101117] border border-[#d4af37]/35 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(212,175,55,0.12)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header Bar */}
        <div className="relative p-5 sm:p-6 border-b border-zinc-800/80 bg-gradient-to-r from-[#141620] via-[#12131b] to-[#141620] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#d4af37]/30 to-amber-950/60 border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37] shadow-lg shadow-[#d4af37]/15">
                <UserIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#101117] flex items-center justify-center text-[10px] text-black font-bold">
                ✓
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-white truncate">
                  {currentUser.fullName}
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/40 shadow-sm font-mono">
                  <Award className="w-3 h-3" />
                  {currentTier} Member
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate mt-0.5">{currentUser.email}</p>
            </div>
          </div>

          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer shrink-0 border border-zinc-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-[#0c0d12] px-4 sm:px-6 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setProfileActiveTab('coins')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              profileActiveTab === 'coins'
                ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Kwetu Coins & Rewards</span>
            <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold font-mono">
              {currentCoins}
            </span>
          </button>

          <button
            onClick={() => setProfileActiveTab('orders')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              profileActiveTab === 'orders'
                ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders ({userOrders.length})</span>
          </button>

          <button
            onClick={() => setProfileActiveTab('profile')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              profileActiveTab === 'profile'
                ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Delivery & Profile</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: KWETU COINS & REWARDS WALLET */}
          {profileActiveTab === 'coins' && (
            <div className="space-y-6">
              {/* Grand Kwetu Coins Wallet Card */}
              <div className="relative bg-gradient-to-br from-[#1b1c26] via-[#151620] to-[#0e0f14] border border-[#d4af37]/40 rounded-2xl p-5 sm:p-6 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-[#d4af37]/15 rounded-full blur-2xl pointer-events-none" />

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Left: Balance */}
                  <div className="md:col-span-7 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 fill-[#d4af37]" />
                        BarKwetu Reserve Loyalty Wallet
                      </span>
                    </div>

                    <div className="flex items-baseline gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37]">
                          <Coins className="w-5 h-5" />
                        </div>
                        <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                          {currentCoins.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-[#d4af37] font-serif">
                        Kwetu Coins
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400">
                      Value: <strong className="text-white font-mono">{formatKES(currentCoins)}</strong> in discount vouchers · Earning Rate: <strong className="text-[#d4af37]">{multiplier}x Coins</strong> on every KSh 100 spent
                    </p>
                  </div>

                  {/* Right: Tier Status & Progress */}
                  <div className="md:col-span-5 bg-[#0a0b0e]/90 border border-zinc-800 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Current Tier:</span>
                      <span className="font-bold text-[#d4af37] flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5" />
                        {currentTier}
                      </span>
                    </div>

                    {tierProgress.nextTier ? (
                      <div>
                        <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                          <span>Next: {tierProgress.nextTier}</span>
                          <span className="font-mono text-zinc-300">
                            {tierProgress.coinsNeeded} coins to level up
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 via-[#d4af37] to-yellow-300 rounded-full transition-all duration-500"
                            style={{ width: `${tierProgress.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5" />
                        Top Tier Reached (2.0x Double Coins Enabled!)
                      </div>
                    )}

                    <div className="text-[10px] text-zinc-500 border-t border-zinc-800/80 pt-2 flex justify-between">
                      <span>Lifetime Earned:</span>
                      <span className="font-mono text-zinc-300">{lifetimeCoins.toLocaleString()} Coins</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Redeemable Rewards Catalog */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#d4af37]" />
                      <span>Redeemable Vouchers & Rewards</span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Exchange your Kwetu Coins for instant promo codes and free delivery vouchers
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {LOYALTY_REWARDS.map((reward) => {
                    const canAfford = currentCoins >= reward.coinCost;
                    const isRedeeming = isRedeemingId === reward.id;

                    return (
                      <div
                        key={reward.id}
                        className={`relative rounded-xl p-4 border transition-all flex flex-col justify-between ${
                          canAfford
                            ? 'bg-[#13141c] border-[#d4af37]/35 hover:border-[#d4af37] shadow-lg shadow-black/40'
                            : 'bg-[#0e0f14] border-zinc-800/70 opacity-75'
                        }`}
                      >
                        {reward.badge && (
                          <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                            {reward.badge}
                          </span>
                        )}

                        <div>
                          <div className="w-10 h-10 rounded-xl bg-[#090a0d] border border-zinc-800 flex items-center justify-center mb-3 shadow-inner">
                            {renderRewardIcon(reward.iconName)}
                          </div>

                          <h4 className="text-sm font-bold text-white mb-1">{reward.title}</h4>
                          <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                            {reward.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-zinc-800/80 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400">Required:</span>
                            <span className="font-bold text-[#d4af37] font-mono flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5" />
                              {reward.coinCost} Coins
                            </span>
                          </div>

                          <button
                            onClick={() => handleRedeem(reward.id)}
                            disabled={!canAfford || isRedeeming}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              canAfford
                                ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black hover:brightness-110 shadow-md shadow-[#d4af37]/15 active:scale-98'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                          >
                            <Gift className="w-3.5 h-3.5" />
                            <span>
                              {isRedeeming
                                ? 'Unlocking Voucher...'
                                : canAfford
                                ? 'Redeem Voucher'
                                : `Need ${reward.coinCost - currentCoins} more coins`}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active & Generated Vouchers from Redeemed History */}
              {currentUser.coinsHistory &&
                currentUser.coinsHistory.some((tx) => tx.promoCodeGenerated) && (
                  <div className="bg-[#0e0f14] border border-zinc-800 rounded-2xl p-4 sm:p-5">
                    <h4 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Ticket className="w-4 h-4" />
                      <span>Your Redeemed Promo Codes & Vouchers</span>
                    </h4>

                    <div className="space-y-2">
                      {currentUser.coinsHistory
                        .filter((tx) => tx.promoCodeGenerated)
                        .map((tx) => (
                          <div
                            key={tx.id}
                            className="bg-[#141620] border border-zinc-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-white bg-black/60 px-2.5 py-1 rounded-lg border border-[#d4af37]/40 tracking-wider">
                                  {tx.promoCodeGenerated}
                                </span>
                                <button
                                  onClick={() => handleCopyCode(tx.promoCodeGenerated!)}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800 transition-colors cursor-pointer"
                                  title="Copy Code"
                                >
                                  {copiedCode === tx.promoCodeGenerated ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-1">{tx.description}</p>
                            </div>

                            <button
                              onClick={() => handleApplyVoucherToCart(tx.promoCodeGenerated!)}
                              className="px-3 py-1.5 bg-[#d4af37]/20 hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#d4af37]/40 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Apply to Basket</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Kwetu Coins Activity Ledger */}
              <div>
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#d4af37]" />
                  <span>Kwetu Coins Activity Ledger</span>
                </h4>

                {currentUser.coinsHistory && currentUser.coinsHistory.length > 0 ? (
                  <div className="bg-[#0b0c10] border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/60">
                    {currentUser.coinsHistory.map((tx) => {
                      const isEarned = tx.amount > 0;
                      return (
                        <div
                          key={tx.id}
                          className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-zinc-900/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isEarned
                                  ? 'bg-emerald-950/60 border border-emerald-800/40 text-emerald-400'
                                  : 'bg-amber-950/60 border border-amber-800/40 text-amber-400'
                              }`}
                            >
                              <Coins className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-200 truncate">{tx.description}</p>
                              <p className="text-[10px] text-zinc-500">
                                {new Date(tx.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`font-mono font-bold text-sm shrink-0 ${
                              isEarned ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {isEarned ? `+${tx.amount}` : tx.amount} Coins
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 bg-[#0b0c10] border border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
                    No loyalty transactions recorded yet. Complete an order to earn Kwetu Coins!
                  </div>
                )}
              </div>

              {/* Tier Benefits Summary */}
              <div className="p-4 bg-gradient-to-br from-[#12131b] to-[#0a0b0e] border border-zinc-800 rounded-2xl">
                <h4 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Crown className="w-4 h-4" />
                  <span>{currentTier} Tier Perks & Privilege</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                  {getTierPerks(currentTier).map((perk, i) => (
                    <div key={i} className="flex items-center gap-2 bg-[#161822] p-2.5 rounded-lg border border-zinc-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY ORDERS (Order History) */}
          {profileActiveTab === 'orders' && (
            <div className="space-y-5">
              {/* Top Header & High-Level Summary Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#d4af37]" />
                    <span>Order History & Kwetu Coins Earned</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    View your past spirit purchases, dispatch delivery progress, and total loyalty coins rewarded.
                  </p>
                </div>
              </div>

              {/* Order History Summary Metrics */}
              {userOrders.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#12141c] border border-zinc-800/90 rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-[#d4af37] shrink-0">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Total Orders</span>
                      <span className="text-lg font-bold font-mono text-white">{userOrders.length} Completed</span>
                    </div>
                  </div>

                  <div className="bg-[#12141c] border border-zinc-800/90 rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-emerald-400 shrink-0">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Total Spent</span>
                      <span className="text-lg font-bold font-mono text-white">{formatKES(totalUserSpend)}</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-[#1a1710] to-[#12141c] border border-[#d4af37]/40 rounded-xl p-3.5 flex items-center gap-3 shadow-md shadow-[#d4af37]/5">
                    <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shrink-0">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#d4af37] uppercase font-bold block">Coins Earned on Orders</span>
                      <span className="text-lg font-bold font-mono text-white">+{totalCoinsFromOrders.toLocaleString()} Coins</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter Tabs & Search Bar */}
              {userOrders.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setOrderFilter('all')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        orderFilter === 'all'
                          ? 'bg-[#d4af37] text-black shadow-sm font-bold'
                          : 'bg-[#12131a] text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      All ({userOrders.length})
                    </button>
                    <button
                      onClick={() => setOrderFilter('active')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        orderFilter === 'active'
                          ? 'bg-[#d4af37] text-black shadow-sm font-bold'
                          : 'bg-[#12131a] text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      In Transit / Active ({userOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length})
                    </button>
                    <button
                      onClick={() => setOrderFilter('delivered')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        orderFilter === 'delivered'
                          ? 'bg-[#d4af37] text-black shadow-sm font-bold'
                          : 'bg-[#12131a] text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      Delivered ({userOrders.filter((o) => o.status === 'delivered').length})
                    </button>
                  </div>

                  {/* Search orders */}
                  <div className="relative min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Search order # or spirit..."
                      className="w-full bg-[#0e0f14] border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              )}

              {/* Order Cards List */}
              {filteredOrders.length > 0 ? (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const statusInfo = getStatusBadge(order.status);
                    const earnedCoins = getOrderCoins(order);
                    const formattedDate = new Date(order.createdAt).toLocaleDateString('en-KE', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={order.id}
                        className="bg-[#12141c] border border-zinc-800/90 hover:border-[#d4af37]/50 rounded-2xl p-4 sm:p-5 transition-all shadow-lg space-y-4"
                      >
                        {/* Order Header: ID, Date, Status, and Total Kwetu Coins Earned */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm sm:text-base font-extrabold text-white bg-black/50 px-2.5 py-0.5 rounded-lg border border-zinc-700">
                                #{order.orderNumber}
                              </span>

                              {/* Copy Order Number */}
                              <button
                                onClick={() => handleCopyCode(order.orderNumber)}
                                className="p-1 rounded-md text-zinc-400 hover:text-white bg-zinc-800/70 hover:bg-zinc-700 transition-colors cursor-pointer"
                                title="Copy Order Number"
                              >
                                {copiedCode === order.orderNumber ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>

                              {/* Order Status Badge */}
                              <span
                                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${statusInfo.bg}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                                <span>{statusInfo.label}</span>
                              </span>
                            </div>

                            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 flex-wrap">
                              <span>Placed on {formattedDate}</span>
                              <span className="text-zinc-600">·</span>
                              <span>
                                M-Pesa:{' '}
                                <strong className="text-zinc-200 font-mono">
                                  {order.mpesaDetails?.receiptNumber || 'Validated STK'}
                                </strong>
                              </span>
                            </p>
                          </div>

                          {/* Coins Earned High-Visibility Pill & Order Total */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/50">
                            {/* Coins Earned Highlight */}
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#d4af37]/20 to-amber-600/15 border border-[#d4af37]/40 shadow-sm">
                              <Coins className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span className="text-xs font-bold text-[#d4af37] font-mono">
                                +{earnedCoins.toLocaleString()} Coins Earned
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-base sm:text-lg font-bold font-mono text-white tabular-nums block">
                                {formatKES(order.total)}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                {order.items.reduce((s, it) => s + it.quantity, 0)} {order.items.reduce((s, it) => s + it.quantity, 0) === 1 ? 'bottle' : 'bottles'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Order Items Detailed List */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Purchased Spirits & Botanicals
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {order.items.map((item, idx) => (
                              <div
                                key={`${item.productId}-${idx}`}
                                className="bg-[#0b0c10] border border-zinc-800/80 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-10 h-10 rounded-lg bg-[#141620] border border-zinc-800 flex items-center justify-center p-1 shrink-0">
                                    <img
                                      src={item.image}
                                      alt={item.productName}
                                      className="max-h-full max-w-full object-contain"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-zinc-200 truncate leading-snug">
                                      {item.productName}
                                    </p>
                                    <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[#d4af37] font-medium">{item.brand}</span>
                                      <span className="text-zinc-600">·</span>
                                      <span>{item.volume}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-xs font-bold font-mono text-zinc-200 block">
                                    {formatKES(item.price * item.quantity)}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 font-mono">
                                    {item.quantity} × {formatKES(item.price)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Details & Financial Footer */}
                        <div className="bg-[#0a0b0e] border border-zinc-800/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-300">
                          <div className="flex items-center gap-2 min-w-0">
                            <MapPin className="w-4 h-4 text-[#d4af37] shrink-0" />
                            <div className="min-w-0">
                              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Delivery Destination</span>
                              <p className="font-medium text-zinc-200 truncate">
                                {order.shippingAddress.town}, {order.shippingAddress.county}
                                {order.shippingAddress.exactLocation ? ` (${order.shippingAddress.exactLocation})` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {/* Track Order CTA */}
                            <button
                              onClick={() => handleViewOrderTracking(order)}
                              className="px-3.5 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e5b869] text-black font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#d4af37]/15"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Live GPS Track</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>

                            {/* Reorder Button */}
                            <button
                              onClick={() => handleReorder(order)}
                              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
                              title="Add all items to current basket"
                            >
                              <RotateCcw className="w-3 h-3 text-[#d4af37]" />
                              <span>Reorder</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 bg-[#0c0d12] border border-zinc-800 rounded-2xl text-center space-y-3">
                  <Package className="w-12 h-12 stroke-1 text-zinc-600 mx-auto" />
                  <h4 className="text-base font-bold text-white">
                    {userOrders.length === 0 ? 'No Orders Found' : 'No Matching Orders'}
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    {userOrders.length === 0
                      ? "You haven't placed any orders with this account yet. Browse our reserve catalog to get started and earn Kwetu Coins on your first purchase."
                      : 'Try clearing your search query or filter to view past orders.'}
                  </p>
                  {userOrders.length === 0 ? (
                    <button
                      onClick={() => {
                        setIsProfileModalOpen(false);
                        setActiveView('store');
                      }}
                      className="py-2.5 px-5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-[#d4af37]/20"
                    >
                      Browse Cellar Spirits
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setOrderFilter('all');
                        setOrderSearch('');
                      }}
                      className="py-2 px-4 bg-zinc-800 text-zinc-200 hover:text-white font-medium text-xs rounded-xl cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DELIVERY & PROFILE SETTINGS */}
          {profileActiveTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-serif font-bold text-white">Customer Account Settings</h3>
                <p className="text-xs text-zinc-400">
                  Update your default shipping address for faster 1-click Kenyan checkout
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      M-Pesa Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Default County
                    </label>
                    <select
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37] cursor-pointer"
                    >
                      {KENYA_COUNTIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name} County
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Default Delivery Town
                    </label>
                    <select
                      value={town}
                      onChange={(e) => setTown(e.target.value)}
                      className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37] cursor-pointer"
                    >
                      {availableTowns.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Exact Street Address & Gate Description
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Commercial Street, Opp. Karatina Open Air Market, Near Jamii Towers"
                    className="w-full bg-[#0b0c10] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="py-2.5 px-5 bg-[#d4af37] hover:brightness-110 text-black font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-[#d4af37]/20"
                  >
                    {saveLoading ? 'Saving...' : 'Save Profile Changes'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      logout();
                    }}
                    className="py-2 px-4 rounded-xl border border-rose-900/50 hover:bg-rose-950/40 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
