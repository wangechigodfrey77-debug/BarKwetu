import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatKES } from '../utils/formatters';
import { X, ShoppingBag, Wine, Truck, ShieldCheck, Check, Sparkles, MapPin } from 'lucide-react';

export const ProductQuickViewModal: React.FC = () => {
  const {
    products,
    selectedProductId,
    setSelectedProductId,
    addToCart,
    setIsCartOpen,
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!selectedProductId) return null;

  const product = products.find((p) => p.id === selectedProductId);
  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const hasSale = product.salePrice && product.salePrice < product.price;

  // Related products in the same category
  const related = products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id && p.isActive)
    .slice(0, 3);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsCartOpen(true);
    setSelectedProductId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#121318] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => setSelectedProductId(null)}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Image Showcase */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full bg-[#0b0c10] border border-zinc-800/80 rounded-xl overflow-hidden flex items-center justify-center p-6">
              {product.images[activeImageIndex] ? (
                <img
                  src={product.images[activeImageIndex]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-600">
                  <Wine className="w-16 h-16 stroke-1 text-[#d4af37]/40 mb-2" />
                  <span className="text-sm font-serif">{product.brand}</span>
                </div>
              )}

              {hasSale && (
                <span className="absolute top-4 left-4 bg-[#d4af37] text-black text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                  On Sale
                </span>
              )}
            </div>

            {/* Multiple thumbnails if present */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-lg bg-[#0b0c10] border p-1 overflow-hidden transition-all ${
                      activeImageIndex === idx
                        ? 'border-[#d4af37] ring-1 ring-[#d4af37]'
                        : 'border-zinc-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Trust Badges */}
            <div className="bg-[#171920] border border-zinc-800/60 rounded-xl p-3.5 space-y-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>Fixed KSh 100 Delivery in Nairobi within 60 mins</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>100% Guaranteed Authentic Duty-Paid Spirit</span>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Purchase Module */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Brand, Origin, Spirit Type */}
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                <span className="font-bold text-[#d4af37] uppercase tracking-wider text-[11px]">{product.brand}</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-zinc-500" />
                  {product.origin}
                </span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>{product.categoryName}</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight leading-snug mb-3">
                {product.name}
              </h2>

              {/* Price */}
              <div className="mb-4 flex items-baseline gap-3">
                {hasSale ? (
                  <>
                    <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                      {formatKES(product.salePrice!)}
                    </span>
                    <span className="text-base text-zinc-500 line-through tabular-nums">
                      {formatKES(product.price)}
                    </span>
                    <span className="text-xs text-[#d4af37] font-semibold bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/20">
                      Save {formatKES(product.price - product.salePrice!)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                    {formatKES(product.price)}
                  </span>
                )}
              </div>

              {/* Key Specs: Volume, ABV, Stock */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-[#0d0e12] border border-zinc-800/80 rounded-xl text-center mb-5 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Bottle Size</span>
                  <span className="font-semibold text-zinc-200">{product.volume}</span>
                </div>
                <div className="border-x border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase">Strength</span>
                  <span className="font-semibold text-zinc-200">{product.abv || 'Standard'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Availability</span>
                  <span className={`font-semibold ${isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {isOutOfStock ? 'Out of Stock' : isLowStock ? `${product.stock} left` : 'In Stock'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-zinc-300 leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Tasting Notes */}
              {product.tastingNotes && (
                <div className="bg-[#15171f] border border-zinc-800/80 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#d4af37] uppercase tracking-wider mb-2.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sommelier Tasting Notes</span>
                  </div>
                  <div className="space-y-2 text-xs text-zinc-300">
                    {product.tastingNotes.nose && (
                      <p><strong className="text-zinc-100 font-medium">Nose:</strong> {product.tastingNotes.nose}</p>
                    )}
                    {product.tastingNotes.palate && (
                      <p><strong className="text-zinc-100 font-medium">Palate:</strong> {product.tastingNotes.palate}</p>
                    )}
                    {product.tastingNotes.finish && (
                      <p><strong className="text-zinc-100 font-medium">Finish:</strong> {product.tastingNotes.finish}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Purchase Controls */}
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-4">
                {/* Quantity Stepper */}
                <div className="flex items-center bg-[#0d0e12] border border-zinc-800 rounded-xl p-1">
                  <button
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer text-lg font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-white tabular-nums">
                    {quantity}
                  </span>
                  <button
                    disabled={quantity >= product.stock || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer text-lg font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Primary Buy CTA */}
                <button
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isOutOfStock
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black hover:brightness-110 active:scale-98 shadow-lg shadow-[#d4af37]/20'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                  <span>{isOutOfStock ? 'Currently Out of Stock' : `Add to Basket · ${formatKES((product.salePrice ?? product.price) * quantity)}`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Footer inside Modal */}
        {related.length > 0 && (
          <div className="border-t border-zinc-800/80 bg-[#0e0f14] p-6 sm:px-8">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Connoisseurs also enjoyed
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {related.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => {
                    setSelectedProductId(rel.id);
                    setQuantity(1);
                  }}
                  className="bg-[#14161d] border border-zinc-800/60 hover:border-[#d4af37]/40 p-2.5 rounded-lg flex items-center gap-3 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 bg-[#0a0b0e] rounded p-1 flex items-center justify-center shrink-0">
                    <img src={rel.images[0]} alt={rel.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-200 font-medium truncate">{rel.name}</p>
                    <p className="text-[11px] text-[#d4af37] font-bold tabular-nums">
                      {formatKES(rel.salePrice ?? rel.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
