import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatKES, formatKenyanPhone, formatDateTime } from '../../utils/formatters';
import { generateExecutiveReportPDF } from '../../utils/pdfReportGenerator';
import { BulkInventoryUploadModal } from './BulkInventoryUploadModal';
import { Order, Product, Category, User, PromoCode } from '../../types';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Download,
  Printer,
  PieChart,
  Package,
  Truck,
  Users,
  Award,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Filter,
  FileSpreadsheet,
  Layers,
  Wine,
  FileText,
  RefreshCw,
  AlertTriangle,
  ShoppingBag,
  Percent,
  MapPin,
  ChevronRight,
  ExternalLink,
  FileDown,
  UploadCloud,
} from 'lucide-react';

type ReportPeriod = 'all' | 'today' | '7days' | '30days' | 'this_month';
type ReportSubSection = 'sales' | 'products' | 'logistics' | 'customers';

export const ReportsTab: React.FC = () => {
  const {
    currentUser,
    orders,
    products,
    categories,
    adminUsers,
    promoCodes,
    settings,
    showToast,
    setActiveView,
    setCurrentOrder,
  } = useStore();

  const [period, setPeriod] = useState<ReportPeriod>('all');
  const [subSection, setSubSection] = useState<ReportSubSection>('sales');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Filter orders by selected time period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      if (isNaN(orderDate.getTime())) return true;

      if (period === 'today') {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      if (period === '7days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= sevenDaysAgo;
      }
      if (period === '30days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= thirtyDaysAgo;
      }
      if (period === 'this_month') {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      return true; // 'all'
    });
  }, [orders, period]);

  // Aggregate Core Metrics
  const grossRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [filteredOrders]);

  const netSpiritsRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  }, [filteredOrders]);

  const totalDeliveryFees = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  }, [filteredOrders]);

  const totalDiscountsGiven = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
  }, [filteredOrders]);

  const totalBottlesSold = useMemo(() => {
    return filteredOrders.reduce(
      (sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );
  }, [filteredOrders]);

  const averageOrderValue = useMemo(() => {
    return filteredOrders.length > 0 ? Math.round(grossRevenue / filteredOrders.length) : 0;
  }, [grossRevenue, filteredOrders.length]);

  const deliveredOrdersCount = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'delivered').length;
  }, [filteredOrders]);

  const inTransitOrdersCount = useMemo(() => {
    return filteredOrders.filter(
      (o) => o.status === 'out_for_delivery' || o.status === 'preparing' || o.status === 'paid'
    ).length;
  }, [filteredOrders]);

  const pendingOrdersCount = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'pending').length;
  }, [filteredOrders]);

  // Total Cellar Inventory Valuation
  const totalStockCount = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.stock || 0), 0);
  }, [products]);

  const totalInventoryValuation = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => (p.stock || 0) <= 10);
  }, [products]);

  // Product Sales Rankings
  const productSalesMap = useMemo(() => {
    const map: Record<
      string,
      {
        productId: string;
        productName: string;
        brand: string;
        image: string;
        unitsSold: number;
        revenue: number;
        categoryName?: string;
        currentStock: number;
      }
    > = {};

    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!map[item.productId]) {
          const matchedProd = products.find((p) => p.id === item.productId);
          map[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            brand: item.brand,
            image: item.image,
            unitsSold: 0,
            revenue: 0,
            categoryName: matchedProd?.categoryName || 'Spirits',
            currentStock: matchedProd?.stock ?? 0,
          };
        }
        map[item.productId].unitsSold += item.quantity;
        map[item.productId].revenue += item.price * item.quantity;
      });
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, products]);

  // Category Sales Share
  const categorySalesMap = useMemo(() => {
    const map: Record<string, { categoryId: string; categoryName: string; revenue: number; units: number }> = {};

    categories.forEach((cat) => {
      map[cat.id] = {
        categoryId: cat.id,
        categoryName: cat.name,
        revenue: 0,
        units: 0,
      };
    });

    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const catId = prod?.categoryId || categories[0]?.id || 'cat-whisky';
        const catName = prod?.categoryName || categories[0]?.name || 'Whisky';

        if (!map[catId]) {
          map[catId] = { categoryId: catId, categoryName: catName, revenue: 0, units: 0 };
        }
        map[catId].revenue += item.price * item.quantity;
        map[catId].units += item.quantity;
      });
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, categories, products]);

  // Location / Destination Distribution
  const locationBreakdown = useMemo(() => {
    const map: Record<string, { town: string; county: string; count: number; totalRevenue: number }> = {};

    filteredOrders.forEach((o) => {
      const town = o.shippingAddress?.town || 'Karatina CBD';
      const county = o.shippingAddress?.county || 'Nyeri';
      const key = `${town}__${county}`;

      if (!map[key]) {
        map[key] = { town, county, count: 0, totalRevenue: 0 };
      }
      map[key].count += 1;
      map[key].totalRevenue += o.total;
    });

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filteredOrders]);

  // Rider Delivery Stats
  const riderStats = useMemo(() => {
    const riders = adminUsers.filter((u) => u.role === 'rider');
    return riders.map((rider) => {
      const assigned = filteredOrders.filter(
        (o) => o.assignedRiderId === rider.id || o.assignedRiderName === rider.fullName
      );
      const delivered = assigned.filter((o) => o.status === 'delivered');
      const inTransit = assigned.filter((o) => o.status === 'out_for_delivery');
      const revenueHandled = assigned.reduce((sum, o) => sum + o.total, 0);

      return {
        rider,
        totalAssigned: assigned.length,
        deliveredCount: delivered.length,
        inTransitCount: inTransit.length,
        revenueHandled,
        completionRate: assigned.length > 0 ? Math.round((delivered.length / assigned.length) * 100) : 100,
      };
    });
  }, [adminUsers, filteredOrders]);

  // Customer Loyalty & Kwetu Coins Overview
  const loyaltyMetrics = useMemo(() => {
    const customers = adminUsers.filter((u) => u.role === 'customer' || !u.role);
    const totalCoinsInCirculation = customers.reduce((sum, c) => sum + (c.kwetuCoins || 0), 0);
    const lifetimeCoinsRewarded = customers.reduce(
      (sum, c) => sum + (c.lifetimeCoinsEarned || c.kwetuCoins || 0),
      0
    );

    const tierCounts = {
      Bronze: customers.filter((c) => (c.loyaltyTier || 'Bronze') === 'Bronze').length,
      Silver: customers.filter((c) => c.loyaltyTier === 'Silver').length,
      Gold: customers.filter((c) => c.loyaltyTier === 'Gold').length,
      Platinum: customers.filter((c) => c.loyaltyTier === 'Platinum VIP').length,
    };

    return {
      totalCustomers: customers.length,
      totalCoinsInCirculation,
      lifetimeCoinsRewarded,
      tierCounts,
    };
  }, [adminUsers]);

  // CSV Export Handler
  const handleExportCSV = (type: 'orders' | 'inventory' | 'sales_by_product') => {
    let csvContent = '';
    let filename = `barkwetu_${type}_report_${new Date().toISOString().slice(0, 10)}.csv`;

    if (type === 'orders') {
      const headers = [
        'Order Number',
        'Date Placed',
        'Customer Name',
        'Customer Phone',
        'Town',
        'County',
        'Items Purchased',
        'Subtotal (KES)',
        'Delivery Fee (KES)',
        'Discount (KES)',
        'Total (KES)',
        'Status',
        'Payment Method',
        'M-Pesa Receipt',
        'Assigned Rider',
      ];
      const rows = filteredOrders.map((o) => [
        `"${o.orderNumber}"`,
        `"${formatDateTime(o.createdAt)}"`,
        `"${o.userName.replace(/"/g, '""')}"`,
        `"${o.phone}"`,
        `"${(o.shippingAddress?.town || '').replace(/"/g, '""')}"`,
        `"${(o.shippingAddress?.county || '').replace(/"/g, '""')}"`,
        `"${o.items.map((it) => `${it.productName} (x${it.quantity})`).join('; ')}"`,
        o.subtotal,
        o.deliveryFee,
        o.discount,
        o.total,
        o.status,
        o.paymentMethod,
        `"${o.mpesaDetails?.receiptNumber || 'PENDING'}"`,
        `"${o.assignedRiderName || 'Unassigned'}"`,
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (type === 'inventory') {
      const headers = [
        'Product ID',
        'Spirit Name',
        'Brand',
        'Category',
        'Spirit Type',
        'Volume',
        'ABV',
        'Price (KES)',
        'Stock Level',
        'Inventory Value (KES)',
        'Status',
      ];
      const rows = products.map((p) => [
        `"${p.id}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.brand}"`,
        `"${p.categoryName}"`,
        p.spiritType,
        p.volume,
        p.abv,
        p.price,
        p.stock,
        p.price * p.stock,
        p.isActive ? 'Active' : 'Disabled',
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (type === 'sales_by_product') {
      const headers = [
        'Product ID',
        'Spirit Name',
        'Brand',
        'Category',
        'Units Sold',
        'Gross Revenue (KES)',
        'Current Stock Level',
      ];
      const rows = productSalesMap.map((p) => [
        `"${p.productId}"`,
        `"${p.productName.replace(/"/g, '""')}"`,
        `"${p.brand}"`,
        `"${p.categoryName}"`,
        p.unitsSold,
        p.revenue,
        p.currentStock,
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filename} successfully!`, 'success');
  };

  // PDF Export Handler
  const handleDownloadPDF = (reportType: 'full' | 'sales' | 'inventory' | 'logistics' = 'full') => {
    try {
      const periodLabelMap: Record<ReportPeriod, string> = {
        all: 'All Time Records',
        today: 'Today Only',
        '7days': 'Last 7 Days',
        '30days': 'Last 30 Days',
        this_month: 'This Month',
      };

      const topProducts = productSalesMap.map((p) => ({
        productName: p.productName,
        brand: p.brand,
        unitsSold: p.unitsSold,
        revenue: p.revenue,
        currentStock: p.currentStock,
      }));

      const filename = generateExecutiveReportPDF(
        {
          periodLabel: periodLabelMap[period] || 'Selected Timeframe',
          adminName: currentUser?.fullName || 'BarKwetu Administrator',
          orders: filteredOrders,
          products,
          categories,
          adminUsers,
          promoCodes,
          grossRevenue,
          netSpiritsRevenue,
          totalDeliveryFees,
          totalDiscountsGiven,
          averageOrderValue,
          totalBottlesSold,
          totalInventoryValuation,
          totalStockCount,
          categorySales: categorySalesMap,
          topProducts,
          riderStats,
        },
        reportType
      );

      showToast(`Generated & downloaded ${filename}!`, 'success');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      showToast('Could not generate PDF. Please try again.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in print:space-y-4 print:text-black">
      {/* Top Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#12141c] border border-zinc-800/90 rounded-2xl p-5 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-serif font-bold text-white tracking-tight">
              Executive Reports & Intelligence Hub
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Real-time sales performance, PalPluss M-Pesa receipts, cellar inventory valuation, and rider analytics.
          </p>
        </div>

        {/* Time Period Filter & Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector */}
          <div className="flex items-center bg-[#0b0c10] border border-zinc-800 rounded-xl p-1 text-xs">
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: '7days', label: 'Last 7 Days' },
                { id: '30days', label: 'Last 30 Days' },
                { id: 'this_month', label: 'This Month' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`py-1.5 px-3 rounded-lg font-medium transition-colors cursor-pointer ${
                  period === p.id
                    ? 'bg-[#d4af37] text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Export Dropdown / Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadPDF('full')}
              className="py-2 px-3.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:brightness-110 text-black rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#d4af37]/20 cursor-pointer"
              title="Download Comprehensive Executive PDF Report"
            >
              <FileDown className="w-4 h-4 stroke-[2.5]" />
              <span>Download PDF Report</span>
            </button>

            <button
              onClick={() => handleExportCSV('orders')}
              className="py-2 px-3 bg-[#181a24] hover:bg-[#202434] border border-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download Orders CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Summary Report"
            >
              <Printer className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-gradient-to-br from-[#161822] to-[#101118] border border-zinc-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md group hover:border-[#d4af37]/40 transition-colors">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Gross Sales Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatKES(grossRevenue)}
            </div>
            <p className="text-[11px] text-zinc-400">
              Spirits: <strong className="text-zinc-200">{formatKES(netSpiritsRevenue)}</strong> · Delivery:{' '}
              <strong className="text-[#d4af37]">{formatKES(totalDeliveryFees)}</strong>
            </p>
          </div>
        </div>

        {/* Orders Volume & Fulfillment */}
        <div className="bg-gradient-to-br from-[#161822] to-[#101118] border border-zinc-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md group hover:border-[#d4af37]/40 transition-colors">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Orders Placed
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-700/50 flex items-center justify-center text-blue-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {filteredOrders.length} Orders
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">{deliveredOrdersCount} Delivered</span>
              <span className="text-zinc-600">·</span>
              <span className="text-amber-400 font-semibold">{inTransitOrdersCount} Active</span>
            </p>
          </div>
        </div>

        {/* Average Order Value (AOV) & Bottles Sold */}
        <div className="bg-gradient-to-br from-[#161822] to-[#101118] border border-zinc-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md group hover:border-[#d4af37]/40 transition-colors">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Average Order (AOV)
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-700/50 flex items-center justify-center text-purple-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatKES(averageOrderValue)}
            </div>
            <p className="text-[11px] text-zinc-400">
              Total <strong className="text-zinc-200">{totalBottlesSold} bottles</strong> dispatched
            </p>
          </div>
        </div>

        {/* Cellar Inventory Valuation */}
        <div className="bg-gradient-to-br from-[#161822] to-[#101118] border border-zinc-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md group hover:border-[#d4af37]/40 transition-colors">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Cellar Stock Valuation
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Wine className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {formatKES(totalInventoryValuation)}
            </div>
            <p className="text-[11px] text-zinc-400">
              Across <strong className="text-zinc-200">{totalStockCount} bottles</strong> in vault (
              <span className={lowStockProducts.length > 0 ? 'text-rose-400 font-semibold' : 'text-zinc-400'}>
                {lowStockProducts.length} low stock
              </span>
              )
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Section Navigation Tabs */}
      <div className="flex border-b border-zinc-800 gap-2 pb-px overflow-x-auto no-scrollbar">
        {[
          { id: 'sales', label: 'Sales & Revenue Breakdown', icon: TrendingUp },
          { id: 'products', label: 'Product & Spirits Performance', icon: Wine },
          { id: 'logistics', label: 'Logistics & Dispatch Fleet', icon: Truck },
          { id: 'customers', label: 'Customers & Kwetu Coins Economy', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubSection(tab.id as ReportSubSection)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-[#d4af37] text-white bg-zinc-900/40 rounded-t-xl'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#d4af37]' : 'text-zinc-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: SALES & REVENUE BREAKDOWN */}
      {subSection === 'sales' && (
        <div className="space-y-6">
          {/* Revenue Breakdown Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Gateway & PalPluss Status */}
            <div className="bg-[#12141c] border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-serif font-bold text-white">Payment Method & M-Pesa</h3>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  PalPluss STK
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0c10] border border-zinc-800/80">
                  <span className="text-zinc-400">M-Pesa STK Push Volume</span>
                  <span className="font-bold text-white font-mono">{filteredOrders.length} Transactions</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0c10] border border-zinc-800/80">
                  <span className="text-zinc-400">Total Settled via PalPluss</span>
                  <span className="font-bold text-emerald-400 font-mono">{formatKES(grossRevenue)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0c10] border border-zinc-800/80">
                  <span className="text-zinc-400">Fixed Delivery Revenue (KES 100)</span>
                  <span className="font-bold text-[#d4af37] font-mono">{formatKES(totalDeliveryFees)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0c10] border border-zinc-800/80">
                  <span className="text-zinc-400">Voucher Discounts Absorbed</span>
                  <span className="font-bold text-rose-400 font-mono">-{formatKES(totalDiscountsGiven)}</span>
                </div>
              </div>
            </div>

            {/* Category Revenue Distribution */}
            <div className="bg-[#12141c] border border-zinc-800 rounded-2xl p-5 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#d4af37]" />
                  <h3 className="text-sm font-serif font-bold text-white">Revenue by Spirit Category</h3>
                </div>
                <span className="text-xs text-zinc-400">
                  Total Spirits Subtotal: <strong className="text-white">{formatKES(netSpiritsRevenue)}</strong>
                </span>
              </div>

              <div className="space-y-3.5">
                {categorySalesMap.map((cat) => {
                  const percentage =
                    netSpiritsRevenue > 0 ? Math.round((cat.revenue / netSpiritsRevenue) * 100) : 0;
                  return (
                    <div key={cat.categoryId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-200">{cat.categoryName}</span>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-zinc-400">{cat.units} bottles</span>
                          <span className="font-bold text-white">{formatKES(cat.revenue)}</span>
                          <span className="text-[#d4af37] font-semibold w-10 text-right">{percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Orders Audit Table for Selected Period */}
          <div className="bg-[#12141c] border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-serif font-bold text-white">Order Transactions Audit Log</h3>
                <p className="text-xs text-zinc-400">
                  Showing {filteredOrders.length} orders within the selected time window
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => handleDownloadPDF('sales')}
                  className="py-1.5 px-3 bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#d4af37] border border-[#d4af37]/40 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download Sales PDF</span>
                </button>
                <button
                  onClick={() => handleExportCSV('orders')}
                  className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-[#0b0c10] text-zinc-400 uppercase text-[10px] font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="p-3">Order #</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Destination</th>
                      <th className="p-3">Spirits / Bottles</th>
                      <th className="p-3">Total (KES)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">M-Pesa Receipt</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-[#d4af37]">#{order.orderNumber}</td>
                        <td className="p-3 text-zinc-400">{formatDateTime(order.createdAt)}</td>
                        <td className="p-3">
                          <p className="font-semibold text-white">{order.userName}</p>
                          <p className="text-[11px] text-zinc-400">{order.phone}</p>
                        </td>
                        <td className="p-3">
                          <p className="text-zinc-200">{order.shippingAddress?.town || 'Karatina'}</p>
                          <p className="text-[10px] text-zinc-500 truncate max-w-[140px]">
                            {order.shippingAddress?.county}
                          </p>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-white">
                            {order.items.reduce((s, it) => s + it.quantity, 0)} bottles
                          </span>
                          <span className="text-[10px] text-zinc-500 block">({order.items.length} unique)</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-white">{formatKES(order.total)}</td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              order.status === 'delivered'
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/50'
                                : order.status === 'out_for_delivery'
                                ? 'bg-amber-950/80 text-amber-400 border-amber-800/50'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-zinc-300">
                          {order.mpesaDetails?.receiptNumber || (
                            <span className="text-zinc-600 italic">Pending</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setCurrentOrder(order);
                              setActiveView('track-order');
                            }}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-[#d4af37] text-zinc-300 hover:text-black transition-colors cursor-pointer"
                            title="Inspect Order Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500 text-xs">
                No orders found for the selected time period.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: PRODUCT & SPIRITS PERFORMANCE */}
      {subSection === 'products' && (
        <div className="space-y-6">
          {/* Top Products Table & Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Best Selling Spirits */}
            <div className="bg-[#12141c] border border-zinc-800 rounded-2xl p-5 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#d4af37]" />
                  <h3 className="text-sm font-serif font-bold text-white">Best-Selling Reserve Spirits</h3>
                </div>
                <button
                  onClick={() => handleExportCSV('sales_by_product')}
                  className="py-1 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>Export</span>
                </button>
              </div>

              {productSalesMap.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-[#0b0c10] text-zinc-400 uppercase text-[10px] font-semibold border-b border-zinc-800">
                      <tr>
                        <th className="p-3">Rank & Spirit</th>
                        <th className="p-3">Brand</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Units Sold</th>
                        <th className="p-3">Revenue (KES)</th>
                        <th className="p-3 text-right">In Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {productSalesMap.map((item, idx) => (
                        <tr key={item.productId} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-xs font-bold text-zinc-500 w-4">
                                #{idx + 1}
                              </span>
                              <img
                                src={item.image}
                                alt={item.productName}
                                className="w-8 h-8 object-contain rounded bg-[#0b0c10] p-0.5 border border-zinc-800"
                              />
                              <span className="font-medium text-white max-w-[180px] truncate">
                                {item.productName}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-zinc-400">{item.brand}</td>
                          <td className="p-3 text-zinc-400">{item.categoryName}</td>
                          <td className="p-3 font-mono font-bold text-white">{item.unitsSold} bottles</td>
                          <td className="p-3 font-mono font-bold text-[#d4af37]">
                            {formatKES(item.revenue)}
                          </td>
                          <td className="p-3 text-right font-mono">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.currentStock <= 5
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                  : item.currentStock <= 15
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              }`}
                            >
                              {item.currentStock} left
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center text-zinc-500 text-xs">
                  No bottle sales recorded in the selected timeframe.
                </div>
              )}
            </div>

            {/* Low Stock & Re-Order Alerts */}
            <div className="bg-[#12141c] border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-serif font-bold text-white">Stock Buffer Alerts</h3>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                  {lowStockProducts.length} Needs Restock
                </span>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-[#0b0c10] border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={p.images?.[0]}
                          alt={p.name}
                          className="w-9 h-9 object-contain rounded bg-[#141620] p-1 border border-zinc-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-zinc-400">
                            {p.brand} · {p.volume} · {formatKES(p.price)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono font-bold text-xs block ${
                            p.stock === 0 ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        >
                          {p.stock} bottles
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {p.stock === 0 ? 'OUT OF STOCK' : 'Low Buffer'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-emerald-400 text-xs">
                    ✓ All cellar inventory levels are well-stocked above buffer threshold.
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={() => setIsBulkUploadOpen(true)}
                  className="flex-1 py-2.5 px-3 bg-[#d4af37] hover:brightness-110 text-black text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#d4af37]/20 cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Inventory List (CSV)</span>
                </button>
                <button
                  onClick={() => handleDownloadPDF('inventory')}
                  className="flex-1 py-2.5 px-3 bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#d4af37] border border-[#d4af37]/40 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Valuation (PDF)</span>
                </button>
                <button
                  onClick={() => handleExportCSV('inventory')}
                  className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: LOGISTICS & DISPATCH FLEET */}
      {subSection === 'logistics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Neighborhood / Delivery Destination Distribution */}
            <div className="bg-[#12141c] border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#d4af37]" />
                  <h3 className="text-sm font-serif font-bold text-white">Delivery Heatmap by Town</h3>
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  {locationBreakdown.length} active zones
                </span>
              </div>

              <div className="space-y-3">
                {locationBreakdown.map((loc, idx) => {
                  const percentage =
                    filteredOrders.length > 0 ? Math.round((loc.count / filteredOrders.length) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{loc.town}</span>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-zinc-400">{loc.count} drops</span>
                          <span className="font-bold text-[#d4af37]">{formatKES(loc.totalRevenue)}</span>
                          <span className="text-zinc-400 w-8 text-right">{percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          style={{ width: `${Math.max(percentage, 3)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rider Dispatch Metrics */}
            <div className="bg-[#12141c] border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-serif font-bold text-white">Rider Fleet Performance</h3>
                </div>
                <button
                  onClick={() => handleDownloadPDF('logistics')}
                  className="py-1 px-2.5 bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#d4af37] border border-[#d4af37]/40 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Logistics PDF</span>
                </button>
              </div>

              <div className="space-y-3">
                {riderStats.map((st, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0b0c10] border border-zinc-800/80 rounded-xl p-4 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white text-sm">{st.rider.fullName}</p>
                        <p className="text-[11px] text-zinc-400">
                          {st.rider.bikeRegistration || 'Motorbike Fleet'} · {formatKenyanPhone(st.rider.phone || '')}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 font-mono font-bold">
                        {st.completionRate}% On-Time
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/60 text-center font-mono">
                      <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block uppercase">Assigned</span>
                        <span className="text-sm font-bold text-white">{st.totalAssigned}</span>
                      </div>
                      <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block uppercase">Delivered</span>
                        <span className="text-sm font-bold text-emerald-400">{st.deliveredCount}</span>
                      </div>
                      <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block uppercase">Handled</span>
                        <span className="text-sm font-bold text-[#d4af37]">{formatKES(st.revenueHandled)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: CUSTOMERS & KWETU COINS ECONOMY */}
      {subSection === 'customers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#12141c] border border-zinc-800 rounded-xl p-4">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Registered Accounts</span>
              <span className="text-xl font-bold font-mono text-white">{loyaltyMetrics.totalCustomers} Customers</span>
            </div>

            <div className="bg-[#12141c] border border-zinc-800 rounded-xl p-4">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Coins in Circulation</span>
              <span className="text-xl font-bold font-mono text-[#d4af37]">
                {loyaltyMetrics.totalCoinsInCirculation.toLocaleString()} Coins
              </span>
            </div>

            <div className="bg-[#12141c] border border-zinc-800 rounded-xl p-4">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Lifetime Coins Issued</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {loyaltyMetrics.lifetimeCoinsRewarded.toLocaleString()} Coins
              </span>
            </div>

            <div className="bg-[#12141c] border border-zinc-800 rounded-xl p-4">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Promo Vouchers Used</span>
              <span className="text-xl font-bold font-mono text-purple-400">
                {promoCodes.reduce((s, pr) => s + (pr.timesUsed || 0), 0)} Vouchers
              </span>
            </div>
          </div>

          {/* Loyalty Tier Distribution Grid */}
          <div className="bg-[#12141c] border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-serif font-bold text-white">Cellar Membership Tier Breakdown</h3>
              <p className="text-xs text-zinc-400">
                Customer classification based on lifetime Kwetu Coins accumulation
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-1">
                <span className="text-xs font-bold text-amber-400">Bronze Reserve</span>
                <p className="text-2xl font-bold font-mono text-white">{loyaltyMetrics.tierCounts.Bronze}</p>
                <p className="text-[10px] text-zinc-500">1.0x Coin Multiplier (0 - 499 coins)</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/50 space-y-1">
                <span className="text-xs font-bold text-zinc-300">Silver Reserve</span>
                <p className="text-2xl font-bold font-mono text-white">{loyaltyMetrics.tierCounts.Silver}</p>
                <p className="text-[10px] text-zinc-500">1.25x Coin Multiplier (500 - 1,499 coins)</p>
              </div>

              <div className="p-4 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 space-y-1">
                <span className="text-xs font-bold text-[#d4af37]">Gold Reserve</span>
                <p className="text-2xl font-bold font-mono text-white">{loyaltyMetrics.tierCounts.Gold}</p>
                <p className="text-[10px] text-zinc-500">1.5x Multiplier (1,500 - 3,499 coins)</p>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-1">
                <span className="text-xs font-bold text-purple-300">Platinum Reserve</span>
                <p className="text-2xl font-bold font-mono text-white">{loyaltyMetrics.tierCounts.Platinum}</p>
                <p className="text-[10px] text-zinc-500">2.0x Multiplier (3,500+ coins)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Inventory Upload Modal */}
      <BulkInventoryUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
      />
    </div>
  );
};
