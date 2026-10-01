import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AgeGateModal } from './components/AgeGateModal';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { PalPlussMpesaModal } from './components/PalPlussMpesaModal';
import { LegalPolicyModal } from './components/legal/LegalPolicyModal';
import { ToastContainer } from './components/Toast';
import ShapeGrid from './components/ShapeGrid';

import { StorefrontView } from './views/StorefrontView';
import { CheckoutView } from './views/CheckoutView';
import { OrderConfirmationView } from './views/OrderConfirmationView';
import { TrackDeliveryView } from './views/TrackDeliveryView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { RiderAppView } from './components/rider/RiderAppView';

const MainLayout: React.FC = () => {
  const { activeView, isLegalModalOpen, legalModalPolicy, closeLegalModal } = useStore();

  return (
    <div className="min-h-screen bg-[#090a0d] text-zinc-100 flex flex-col font-sans selection:bg-[#d4af37] selection:text-black relative pb-16 md:pb-0">
      {/* Fullscreen Interactive ShapeGrid Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction="diagonal" // up, down, left, right, diagonal
          borderColor="#fff"
          hoverFillColor="#222"
          shape="square" // square, hexagon, circle, triangle
          hoverTrailAmount={5} // number of trailing hovered shapes (0 = no trail)
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Age verification gate (Strict 18+ enforcement) */}
        <AgeGateModal />

        {/* Global Header (Sticky navigation bar) */}
        {activeView !== 'admin' && <Header />}

        {/* Main View Switcher */}
        <div className="flex-1">
          {activeView === 'store' && <StorefrontView />}
          {activeView === 'checkout' && <CheckoutView />}
          {activeView === 'order-confirmation' && <OrderConfirmationView />}
          {activeView === 'track-order' && <TrackDeliveryView />}
          {activeView === 'admin' && <AdminDashboardView />}
          {activeView === 'rider' && <RiderAppView />}
        </div>

        {/* Global Footer (Trust badges, legal disclaimers) */}
        {activeView !== 'admin' && <Footer />}

        {/* Mobile Bottom Navigation Bar */}
        {activeView !== 'admin' && <MobileBottomNav />}

        {/* Global Slide-outs and Modals */}
        <ProductQuickViewModal />
        <CartDrawer />
        <AuthModal />
        <CustomerProfileModal />
        <PalPlussMpesaModal />
        <LegalPolicyModal
          isOpen={isLegalModalOpen}
          initialPolicy={legalModalPolicy}
          onClose={closeLegalModal}
        />
        <ToastContainer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
}
