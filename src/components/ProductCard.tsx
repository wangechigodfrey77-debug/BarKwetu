import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { formatKES } from '../utils/formatters';
import { ShoppingBag, Eye, Wine, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    addToCart,
    setSelectedProductId,
    getProductRatingStats,
    setActiveView,
    currentUser,
    openAuthModal,
  } = useStore();
  const [imageError, setImageError] = useState(false);

  const stats = getProductRatingStats(product.id);
  const ratingVal = stats.count > 0 ? stats.average : (product.rating || 5.0);
  const reviewsCountVal = stats.count > 0 ? stats.count : (product.reviewsCount || 0);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const hasSale = product.salePrice && product.salePrice < product.price;

  const handleImageClick = () => {
    if (isOutOfStock) return;
    addToCart(product, 1);
    if (!currentUser) {
      openAuthModal('signin', 'checkout');
    } else {
      setActiveView('checkout');
    }
  };

  return (
    <div className="group relative bg-[#121318] border border-zinc-800/70 hover:border-[#d4af37]/40 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60 flex flex-col justify-between">
      {/* Sale or Feature badge in clean unboxed style */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {hasSale && (
          <span className="bg-[#d4af37] text-black text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
            Save {formatKES(product.price - (product.salePrice || 0))}
          </span>
        )}
        {product.isFeatured && !hasSale && (
          <span className="bg-zinc-800/90 text-[#d4af37] text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm border border-[#d4af37]/20 backdrop-blur-sm">
            Reserve Choice
          </span>
        )}
      </div>

      {/* Image Container */}
      <div
        onClick={handleImageClick}
        title="Click to Order"
        className="relative w-full aspect-square bg-[#0c0d11] overflow-hidden cursor-pointer flex items-center justify-center p-4 group/img"
      >
        {!imageError && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
            <Wine className="w-12 h-12 stroke-1 text-[#d4af37]/40 mb-2" />
            <span className="text-xs text-zinc-500 font-serif">{product.brand}</span>
          </div>
        )}

        {/* Hover Quick Action Buttons */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProductId(product.id);
            }}
            className="p-2.5 rounded-full bg-zinc-900/90 text-white hover:text-[#d4af37] border border-zinc-700 hover:border-[#d4af37] transition-all transform translate-y-2 group-hover:translate-y-0 cursor-pointer shadow-lg"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {!isOutOfStock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product, 1);
              }}
              className="p-2.5 rounded-full bg-[#d4af37] text-black hover:bg-[#e5b869] transition-all transform translate-y-2 group-hover:translate-y-0 cursor-pointer shadow-lg"
              title="Add to Basket"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Unboxed Metadata: Brand, Volume, ABV */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5 tracking-wide">
            <span className="font-semibold text-[#d4af37] uppercase text-[11px]">{product.brand}</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>{product.volume}</span>
            {product.abv && product.abv !== 'N/A' && (
              <>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>{product.abv} ABV</span>
              </>
            )}
          </div>

          {/* Product Title */}
          <h3
            onClick={() => setSelectedProductId(product.id)}
            className="text-sm sm:text-[15px] font-semibold text-zinc-100 line-clamp-2 hover:text-[#d4af37] transition-colors cursor-pointer leading-snug mb-1.5"
          >
            {product.name}
          </h3>

          {/* Rating Stars & Review Count */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
              <span className="ml-1 font-semibold text-zinc-200 tabular-nums text-xs">
                {ratingVal.toFixed(1)}
              </span>
            </div>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="text-[11px] text-zinc-500 tabular-nums">
              ({reviewsCountVal} {reviewsCountVal === 1 ? 'review' : 'reviews'})
            </span>
          </div>

          {/* Stock Status text */}
          <div className="text-[11px] mb-3">
            {isOutOfStock ? (
              <span className="text-rose-400 font-medium">Out of Stock</span>
            ) : isLowStock ? (
              <span className="text-amber-400 font-medium">Low Stock · Only {product.stock} left</span>
            ) : (
              <span className="text-emerald-400 font-medium">In Stock</span>
            )}
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          <div>
            {hasSale ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-bold text-white tabular-nums">
                  {formatKES(product.salePrice!)}
                </span>
                <span className="text-xs text-zinc-500 line-through tabular-nums">
                  {formatKES(product.price)}
                </span>
              </div>
            ) : (
              <span className="text-base sm:text-lg font-bold text-white tabular-nums">
                {formatKES(product.price)}
              </span>
            )}
          </div>

          <button
            disabled={isOutOfStock}
            onClick={() => addToCart(product, 1)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              isOutOfStock
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-zinc-800 hover:bg-[#d4af37] text-zinc-200 hover:text-black active:scale-95'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
