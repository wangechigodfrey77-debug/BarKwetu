import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { formatKES } from '../utils/formatters';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingBag,
  Sparkles,
  Wine,
  Flame,
  ArrowUpRight,
} from 'lucide-react';

export const FloatingProductBanner: React.FC = () => {
  const { products, setSelectedProductId, addToCart, currentUser, openAuthModal, setActiveView } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Active products only
  const activeProducts = products.filter((p) => p.isActive);

  // Check scroll bounds
  const updateScrollBounds = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollBounds, { passive: true });
    updateScrollBounds();
    return () => el.removeEventListener('scroll', updateScrollBounds);
  }, [activeProducts]);

  // Gentle auto-scroll ticker when not hovered
  useEffect(() => {
    if (isHovered || activeProducts.length === 0) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 180, behavior: 'smooth' });
        }
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [isHovered, activeProducts.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleFastOrder = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    addToCart(product, 1);
    if (!currentUser) {
      openAuthModal('signin', 'checkout');
    } else {
      setActiveView('checkout');
    }
  };

  if (activeProducts.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-6 sm:-mt-8 mb-4">
      {/* Floating Glassmorphic Container */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative bg-gradient-to-r from-[#111218]/95 via-[#181924]/95 to-[#111218]/95 backdrop-blur-xl border border-[#d4af37]/35 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(212,175,55,0.08)] overflow-hidden"
      >
        {/* Subtle Ambient Gold Glow Top-Right & Bottom-Left */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Banner Top Header */}
        <div className="flex items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#d4af37]/20 to-amber-900/30 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-serif font-bold text-white tracking-wide">
                  Reserve Spirits Showcase
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Cellar
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 hidden sm:block">
                All {activeProducts.length} authentic reserve bottles available for express Karatina dispatch
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer ${
                canScrollLeft
                  ? 'bg-zinc-900/80 border-zinc-700 text-white hover:border-[#d4af37] hover:text-[#d4af37]'
                  : 'bg-zinc-900/30 border-zinc-800/50 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer ${
                canScrollRight
                  ? 'bg-zinc-900/80 border-zinc-700 text-white hover:border-[#d4af37] hover:text-[#d4af37]'
                  : 'bg-zinc-900/30 border-zinc-800/50 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Product Carousel Track */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-3 overflow-x-auto scrollbar-none scroll-smooth pb-1 pt-0.5 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {activeProducts.map((product, idx) => {
            const hasSale = product.salePrice && product.salePrice < product.price;
            const effectivePrice = product.salePrice ?? product.price;
            const isOutOfStock = product.stock <= 0;

            return (
              <div
                key={`${product.id}-${idx}`}
                onClick={() => setSelectedProductId(product.id)}
                className="group relative flex-shrink-0 w-44 sm:w-52 bg-[#0c0d12]/90 hover:bg-[#14161f] border border-zinc-800/90 hover:border-[#d4af37]/60 rounded-xl p-2.5 sm:p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/70 cursor-pointer flex flex-col justify-between"
              >
                {/* Sale / Featured Badge */}
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                  {hasSale && (
                    <span className="bg-gradient-to-r from-amber-500 to-[#d4af37] text-black text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" />
                      Sale
                    </span>
                  )}
                  {product.isFeatured && !hasSale && (
                    <span className="bg-[#12131a]/90 text-[#d4af37] text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border border-[#d4af37]/30 backdrop-blur-sm">
                      Reserve
                    </span>
                  )}
                </div>

                {/* Stock Tag on Top Right */}
                <div className="absolute top-2 right-2 z-10">
                  {isOutOfStock ? (
                    <span className="text-[9px] text-rose-400 font-semibold bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/40">
                      Out of Stock
                    </span>
                  ) : product.stock <= 5 ? (
                    <span className="text-[9px] text-amber-400 font-medium bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                      {product.stock} left
                    </span>
                  ) : null}
                </div>

                {/* Product Image Frame */}
                <div className="relative w-full h-28 sm:h-32 bg-[#08090c] rounded-lg p-2 mb-2.5 flex items-center justify-center overflow-hidden group-hover:bg-[#0a0b10] transition-colors">
                  {product.images && product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <Wine className="w-8 h-8 text-[#d4af37]/40" />
                  )}

                  {/* Hover Quick Action Layer */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProductId(product.id);
                      }}
                      className="p-1.5 rounded-lg bg-zinc-900 text-white hover:text-[#d4af37] border border-zinc-700 transition-colors"
                      title="Quick View"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {!isOutOfStock && (
                      <button
                        onClick={(e) => handleFastOrder(e, product)}
                        className="p-1.5 rounded-lg bg-[#d4af37] text-black hover:bg-[#e6c158] transition-colors"
                        title="Express Checkout"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-[#d4af37] block truncate">
                    {product.brand}
                  </span>
                  <h4 className="text-xs font-semibold text-white group-hover:text-[#d4af37] transition-colors truncate">
                    {product.name}
                  </h4>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                    <span>{product.volume}</span>
                    {product.abv && <span>{product.abv}</span>}
                  </div>

                  {/* Price & Action Row */}
                  <div className="flex items-baseline justify-between pt-1 border-t border-zinc-800/60">
                    <div>
                      <span className="text-xs font-bold text-white font-mono">
                        {formatKES(effectivePrice)}
                      </span>
                      {hasSale && (
                        <span className="text-[10px] text-zinc-500 line-through font-mono ml-1.5">
                          {formatKES(product.price)}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#d4af37] group-hover:translate-x-0.5 transition-transform flex items-center">
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
