import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatKES } from '../utils/formatters';
import {
  X,
  ShoppingBag,
  Wine,
  Truck,
  ShieldCheck,
  Check,
  Sparkles,
  MapPin,
  Star,
  MessageSquare,
  UserCheck,
  PenLine,
  Trash2,
  Lock,
} from 'lucide-react';

export const ProductQuickViewModal: React.FC = () => {
  const {
    products,
    selectedProductId,
    setSelectedProductId,
    addToCart,
    setIsCartOpen,
    currentUser,
    setIsAuthModalOpen,
    getProductReviews,
    getProductRatingStats,
    submitProductReview,
    deleteReview,
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Review Form States
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewTitleInput, setReviewTitleInput] = useState('');
  const [reviewCommentInput, setReviewCommentInput] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  if (!selectedProductId) return null;

  const product = products.find((p) => p.id === selectedProductId);
  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const hasSale = product.salePrice && product.salePrice < product.price;

  const productReviews = getProductReviews(product.id);
  const ratingStats = getProductRatingStats(product.id);

  // Related products in the same category
  const related = products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id && p.isActive)
    .slice(0, 3);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsCartOpen(true);
    setSelectedProductId(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewCommentInput.trim()) return;

    setIsSubmittingReview(true);
    const result = await submitProductReview({
      productId: product.id,
      rating: ratingInput,
      title: reviewTitleInput,
      comment: reviewCommentInput,
    });
    setIsSubmittingReview(false);

    if (result.success) {
      setReviewTitleInput('');
      setReviewCommentInput('');
      setIsReviewFormOpen(false);
    }
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return 'Exceptional (5/5)';
      case 4:
        return 'Very Good (4/5)';
      case 3:
        return 'Good (3/5)';
      case 2:
        return 'Fair (2/5)';
      case 1:
        return 'Poor (1/5)';
      default:
        return '';
    }
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
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight leading-snug mb-2">
                {product.name}
              </h2>

              {/* Rating Star Badge in Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(ratingStats.average)
                          ? 'fill-amber-400 stroke-amber-400'
                          : 'stroke-zinc-600 text-transparent'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-white tabular-nums">
                  {ratingStats.average.toFixed(1)}
                </span>
                <span className="text-zinc-500 text-xs">
                  ({ratingStats.count} {ratingStats.count === 1 ? 'review' : 'reviews'})
                </span>
                <button
                  type="button"
                  onClick={() => setIsReviewFormOpen(true)}
                  className="ml-2 text-xs text-[#d4af37] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  <PenLine className="w-3 h-3" />
                  <span>Write a review</span>
                </button>
              </div>

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

        {/* Customer Reviews & Sommelier Tasting Ratings Section */}
        <div className="border-t border-zinc-800 bg-[#0e1015] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
            <div>
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#d4af37]" />
                <span>Customer Tasting Reviews & Ratings</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Authentic feedback from verified spirits connoisseurs in Kenya.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  setIsAuthModalOpen(true);
                } else {
                  setIsReviewFormOpen((prev) => !prev);
                }
              }}
              className="px-4 py-2 rounded-xl bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#d4af37] border border-[#d4af37]/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <PenLine className="w-4 h-4" />
              <span>{isReviewFormOpen ? 'Close Review Form' : 'Write a Review'}</span>
            </button>
          </div>

          {/* Ratings Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#14161f] border border-zinc-800/80 rounded-2xl p-5 sm:p-6">
            {/* Overall Score */}
            <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-zinc-800">
              <span className="text-4xl sm:text-5xl font-serif font-bold text-white tabular-nums tracking-tight">
                {ratingStats.average.toFixed(1)}
              </span>
              <div className="flex items-center text-amber-400 my-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(ratingStats.average)
                        ? 'fill-amber-400 stroke-amber-400'
                        : 'stroke-zinc-600 text-transparent'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-zinc-400">
                Based on <strong className="text-zinc-200">{ratingStats.count}</strong> {ratingStats.count === 1 ? 'rating' : 'ratings'}
              </span>
            </div>

            {/* Star Distribution Progress Bars */}
            <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
              {[5, 4, 3, 2, 1].map((starNum) => {
                const count = ratingStats.breakdown[starNum] || 0;
                const percentage = ratingStats.count > 0 ? (count / ratingStats.count) * 100 : 0;
                return (
                  <div key={starNum} className="flex items-center gap-3 text-xs">
                    <span className="w-12 font-medium text-zinc-300 flex items-center gap-1 justify-end">
                      <span>{starNum}</span>
                      <Star className="w-3 h-3 fill-amber-400 stroke-amber-400 inline" />
                    </span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-zinc-500 tabular-nums">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Submission Form Drawer / Card */}
          {isReviewFormOpen && (
            <div className="bg-[#171922] border border-[#d4af37]/30 rounded-2xl p-5 sm:p-6 shadow-xl animate-fade-in">
              {currentUser ? (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#d4af37]" />
                      <span>Review as {currentUser.fullName || currentUser.username}</span>
                    </h4>
                    <span className="text-[11px] text-zinc-400">
                      {currentUser.role === 'admin' || currentUser.role === 'superadmin' ? 'Official Admin Review' : 'Verified Buyer'}
                    </span>
                  </div>

                  {/* Interactive Star Rating Selector */}
                  <div>
                    <label className="block text-xs text-zinc-400 font-medium mb-1.5">
                      Your Rating <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingInput(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            className="p-1 text-zinc-600 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                (hoverRating || ratingInput) >= star
                                  ? 'fill-amber-400 stroke-amber-400 text-amber-400'
                                  : 'stroke-zinc-600 text-transparent'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-[#d4af37] pl-2 border-l border-zinc-700">
                        {getRatingLabel(hoverRating || ratingInput)}
                      </span>
                    </div>
                  </div>

                  {/* Review Title Input */}
                  <div>
                    <label className="block text-xs text-zinc-400 font-medium mb-1">
                      Headline / Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={reviewTitleInput}
                      onChange={(e) => setReviewTitleInput(e.target.value)}
                      placeholder="e.g. Incredibly smooth with distinct vanilla & oak notes"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0f14] border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  {/* Review Comment Textarea */}
                  <div>
                    <label className="block text-xs text-zinc-400 font-medium mb-1">
                      Detailed Tasting Notes & Experience <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={reviewCommentInput}
                      onChange={(e) => setReviewCommentInput(e.target.value)}
                      placeholder="Share your tasting impressions, aroma notes, finish, serving recommendation, or fast delivery experience in Karatina..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0f14] border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#d4af37] resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsReviewFormOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReview || !reviewCommentInput.trim()}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:brightness-110 text-black text-xs font-bold transition-all shadow-md shadow-[#d4af37]/20 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <Lock className="w-8 h-8 text-[#d4af37] mx-auto opacity-70" />
                  <h4 className="text-sm font-semibold text-white">Sign In to Leave a Review</h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    To maintain verified authenticity of tasting notes and avoid spam, only registered customers can post reviews.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsReviewFormOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="px-5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e5b869] text-black font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Sign In or Create Account
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {productReviews.length === 0 ? (
              <div className="text-center py-8 bg-[#12131a] rounded-2xl border border-zinc-800/60 p-6 space-y-2">
                <Wine className="w-8 h-8 text-zinc-600 mx-auto stroke-1" />
                <p className="text-sm font-medium text-zinc-300">No customer reviews yet</p>
                <p className="text-xs text-zinc-500">
                  Be the first connoisseur to taste and review this spirit!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) setIsAuthModalOpen(true);
                    else setIsReviewFormOpen(true);
                  }}
                  className="mt-2 text-xs text-[#d4af37] hover:underline font-semibold cursor-pointer"
                >
                  Write the first review →
                </button>
              </div>
            ) : (
              productReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-[#12131a] border border-zinc-800/80 rounded-xl p-4 sm:p-5 space-y-2.5 transition-colors hover:border-zinc-700/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {/* Avatar Circle */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-amber-700 text-black font-bold text-xs flex items-center justify-center shrink-0">
                        {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-200">{rev.userName}</span>
                          {rev.verifiedPurchase && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.2 rounded font-medium">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              <span>Verified Buyer</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(rev.createdAt).toLocaleDateString('en-KE', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Star Score & Options */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating
                                ? 'fill-amber-400 stroke-amber-400'
                                : 'stroke-zinc-600 text-transparent'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Delete review if user is admin or author */}
                      {(currentUser?.role === 'admin' ||
                        currentUser?.role === 'superadmin' ||
                        currentUser?.id === rev.userId) && (
                        <button
                          type="button"
                          onClick={() => deleteReview(rev.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {rev.title && (
                    <h5 className="text-xs font-semibold text-zinc-100">
                      {rev.title}
                    </h5>
                  )}

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
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
