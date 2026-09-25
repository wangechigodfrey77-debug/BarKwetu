import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { HERO_IMAGE } from '../data/seedData';
import { Search, SlidersHorizontal, ArrowRight, Sparkles, Wine, ShieldCheck, Truck, Clock } from 'lucide-react';

export const StorefrontView: React.FC = () => {
  const {
    products,
    categories,
    selectedCategorySlug,
    setSelectedCategorySlug,
    searchQuery,
    setSearchQuery,
    setActiveView,
  } = useStore();

  // Local filter states
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [onlyOnSale, setOnlyOnSale] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'name'>('featured');
  const [priceMax, setPriceMax] = useState<number>(45000);

  // Extract unique brands
  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;

      // Category filter
      if (selectedCategorySlug) {
        const cat = categories.find((c) => c.slug === selectedCategorySlug);
        if (cat && p.categoryId !== cat.id && p.spiritType !== cat.spiritType) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchBrand = p.brand.toLowerCase().includes(q);
        const matchCategory = p.categoryName.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchCategory && !matchDesc) {
          return false;
        }
      }

      // Brand filter
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) {
        return false;
      }

      // Sale filter
      if (onlyOnSale && (!p.salePrice || p.salePrice >= p.price)) {
        return false;
      }

      // Stock filter
      if (onlyInStock && p.stock <= 0) {
        return false;
      }

      // Max price filter
      const effectivePrice = p.salePrice ?? p.price;
      if (effectivePrice > priceMax) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.salePrice ?? a.price;
      const priceB = b.salePrice ?? b.price;

      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [products, categories, selectedCategorySlug, searchQuery, selectedBrand, onlyOnSale, onlyInStock, priceMax, sortBy]);

  // Featured and Sale Collections for Homepage
  const featuredProducts = useMemo(() => {
    return products.filter((p) => p.isFeatured && p.isActive).slice(0, 4);
  }, [products]);

  const saleProducts = useMemo(() => {
    return products.filter((p) => p.salePrice && p.salePrice < p.price && p.isActive).slice(0, 4);
  }, [products]);

  return (
    <div className="min-h-screen bg-[#090a0d] pb-24">
      {/* 1. HERO CAMPAIGN BANNER (Diageo thebar.com Style) */}
      {!selectedCategorySlug && !searchQuery && (
        <section className="relative w-full min-h-[520px] lg:min-h-[580px] bg-[#0c0d12] overflow-hidden flex items-center border-b border-zinc-800/80">
          {/* Background Photography with Scrim */}
          <div className="absolute inset-0 z-0">
            <img
              src={HERO_IMAGE}
              alt="BarKwetu Reserve Collection"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center brightness-75 scale-105 transition-transform duration-10000"
            />
            {/* Measured Gradient Scrim for WCAG AA readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090a0d] via-transparent to-black/50" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold uppercase tracking-[0.2em] mb-4 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Reserve Spirits of Kenya</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.08] text-balance mb-6">
                Exceptional Single Malts & Rare Botanicals.
              </h1>

              <p className="text-base sm:text-lg text-zinc-300 font-light leading-relaxed mb-8 max-w-xl">
                Curated duty-paid Scotch whiskies, artisanal gins, and aged tequilas delivered cold to your doorstep across Karatina Town & Mathira within 30–45 minutes for a fixed fee of KSh 100.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => {
                    const catalogEl = document.getElementById('spirits-catalog');
                    catalogEl?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-semibold text-sm hover:brightness-110 active:scale-98 transition-all flex items-center gap-2 shadow-xl shadow-[#d4af37]/25 cursor-pointer"
                >
                  <span>Explore Reserve Catalog</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>

                <button
                  onClick={() => setActiveView('track-order')}
                  className="py-3.5 px-6 rounded-xl bg-black/60 hover:bg-black/90 text-white font-medium text-sm border border-zinc-700 hover:border-zinc-500 backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Truck className="w-4 h-4 text-[#d4af37]" />
                  <span>Track Live Order</span>
                </button>
              </div>

              {/* Quick Trust Ticker */}
              <div className="mt-10 pt-6 border-t border-zinc-800/80 flex flex-wrap items-center gap-6 text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#d4af37]" />
                  Fixed KSh 100 Delivery
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#d4af37]" />
                  30–45 Mins Karatina Express
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                  PalPluss STK Push Secure
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. CATEGORIES HORIZONTAL GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Curated by Spirit Type
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Explore authentic spirits by master blenders and distillers</p>
          </div>
          {selectedCategorySlug && (
            <button
              onClick={() => setSelectedCategorySlug(null)}
              className="text-xs text-[#d4af37] hover:underline font-semibold cursor-pointer"
            >
              View All Categories
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.filter((c) => c.isActive).map((cat) => {
            const isSelected = selectedCategorySlug === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategorySlug(isSelected ? null : cat.slug);
                  const catalogEl = document.getElementById('spirits-catalog');
                  catalogEl?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`relative p-4 rounded-xl border text-left flex flex-col justify-between overflow-hidden transition-all duration-300 group cursor-pointer aspect-[4/3] ${
                  isSelected
                    ? 'bg-[#1e1f29] border-[#d4af37] ring-1 ring-[#d4af37]'
                    : 'bg-[#121319] border-zinc-800/80 hover:border-[#d4af37]/50 hover:bg-[#161722]'
                }`}
              >
                {/* Background image tint */}
                <div className="absolute inset-0 z-0 opacity-25 group-hover:opacity-40 transition-opacity">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090a0d] via-[#090a0d]/60 to-transparent" />
                </div>

                <div className="relative z-10">
                  <Wine className={`w-5 h-5 mb-2 transition-transform group-hover:scale-110 ${isSelected ? 'text-[#d4af37]' : 'text-zinc-400 group-hover:text-[#d4af37]'}`} />
                </div>

                <div className="relative z-10">
                  <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#d4af37] transition-colors leading-tight">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                    {cat.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. MAIN CATALOG & FILTER ENGINE */}
      <section id="spirits-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls Bar */}
        <div className="bg-[#121318] border border-zinc-800/80 rounded-2xl p-4 sm:p-5 mb-8 shadow-xl">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Johnnie Walker, Singleton, Tanqueray, Don Julio, Tequila..."
                className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-zinc-500 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Brand Filter */}
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-[#090a0d] border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#d4af37] cursor-pointer"
              >
                <option value="all">All Brands ({brands.length})</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#090a0d] border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#d4af37] cursor-pointer"
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Customer Rated</option>
                <option value="name">Brand Name (A-Z)</option>
              </select>

              {/* Toggle: On Sale */}
              <button
                onClick={() => setOnlyOnSale(!onlyOnSale)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  onlyOnSale
                    ? 'bg-[#d4af37] text-black border-[#d4af37]'
                    : 'bg-[#090a0d] text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                On Sale
              </button>

              {/* Toggle: In Stock */}
              <button
                onClick={() => setOnlyInStock(!onlyInStock)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  onlyInStock
                    ? 'bg-[#d4af37] text-black border-[#d4af37]'
                    : 'bg-[#090a0d] text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                In Stock Only
              </button>
            </div>
          </div>

          {/* Active Filter Tags */}
          {(selectedCategorySlug || selectedBrand !== 'all' || onlyOnSale || onlyInStock || searchQuery) && (
            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between flex-wrap gap-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-zinc-500 font-medium">Active Filters:</span>
                {selectedCategorySlug && (
                  <span className="bg-zinc-800 text-[#d4af37] px-2 py-0.5 rounded text-[11px]">
                    Category: {categories.find((c) => c.slug === selectedCategorySlug)?.name}
                  </span>
                )}
                {selectedBrand !== 'all' && (
                  <span className="bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded text-[11px]">
                    Brand: {selectedBrand}
                  </span>
                )}
                {onlyOnSale && (
                  <span className="bg-zinc-800 text-[#d4af37] px-2 py-0.5 rounded text-[11px]">
                    On Sale Only
                  </span>
                )}
                {onlyInStock && (
                  <span className="bg-zinc-800 text-emerald-400 px-2 py-0.5 rounded text-[11px]">
                    In Stock Only
                  </span>
                )}
                {searchQuery && (
                  <span className="bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded text-[11px]">
                    &quot;{searchQuery}&quot;
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedCategorySlug(null);
                  setSelectedBrand('all');
                  setOnlyOnSale(false);
                  setOnlyInStock(false);
                  setSearchQuery('');
                }}
                className="text-xs text-[#d4af37] hover:underline font-semibold cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6 text-xs text-zinc-400">
          <span className="tabular-nums font-medium">
            Showing <strong className="text-white">{filteredProducts.length}</strong> spirits in stock
          </span>
          <span className="text-zinc-500 hidden sm:inline">
            Fixed KSh 100 Express Delivery on Every Order
          </span>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-[#121318] border border-zinc-800 rounded-2xl p-8">
            <Wine className="w-16 h-16 stroke-1 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-bold text-white mb-2">No Spirits Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6">
              We couldn&apos;t find any bottles matching your exact filters. Try clearing your search or switching categories.
            </p>
            <button
              onClick={() => {
                setSelectedCategorySlug(null);
                setSelectedBrand('all');
                setOnlyOnSale(false);
                setOnlyInStock(false);
                setSearchQuery('');
              }}
              className="py-2.5 px-6 rounded-xl bg-[#d4af37] text-black text-xs font-semibold hover:brightness-110 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. CURATED STORY & BRAND VALUES (DIAGEO CRAFTSMANSHIP) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-[#14161f] to-[#0c0d12] border border-zinc-800/80 rounded-2xl p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-xl">
            <span className="text-xs uppercase tracking-[0.2em] text-[#d4af37] font-semibold mb-2 block">
              The Art of Exceptional Drinking
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight mb-4">
              Directly Sourced. Masterfully Delivered.
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed mb-6 font-light">
              Every bottle in the BarKwetu vault is sourced directly through certified master distributors and official distilleries with full duty stamps. Our cold-chain delivery riders ensure your bottles arrive at proper cellar temperature across Nairobi.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800 text-xs">
              <div>
                <p className="font-bold text-[#d4af37] text-lg tabular-nums">100%</p>
                <p className="text-zinc-400">Authentic Sealed Stock</p>
              </div>
              <div>
                <p className="font-bold text-[#d4af37] text-lg tabular-nums">KSh 100</p>
                <p className="text-zinc-400">Guaranteed Flat Delivery</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
