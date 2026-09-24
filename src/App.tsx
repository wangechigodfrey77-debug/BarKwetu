import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AgeGateModal } from './components/AgeGateModal';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { PalPlussMpesaModal } from './components/PalPlussMpesaModal';
import { ToastContainer } from './components/Toast';
import { GridRise } from './components/GridRise';

import { StorefrontView } from './views/StorefrontView';
import { CheckoutView } from './views/CheckoutView';
import { OrderConfirmationView } from './views/OrderConfirmationView';
import { TrackDeliveryView } from './views/TrackDeliveryView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { RiderAppView } from './components/rider/RiderAppView';

const MainLayout: React.FC = () => {
  const { activeView } = useStore();

  return (
    <div className="min-h-screen bg-[#090a0d] text-zinc-100 flex flex-col font-sans selection:bg-[#d4af37] selection:text-black relative">
      {/* Raymarched Grid Rise Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
        <GridRise />
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

        {/* Global Slide-outs and Modals */}
        <ProductQuickViewModal />
        <CartDrawer />
        <AuthModal />
        <PalPlussMpesaModal />
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
