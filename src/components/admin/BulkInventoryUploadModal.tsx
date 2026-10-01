import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { BulkInventoryItem, BulkInventoryResult, Product } from '../../types';
import { formatKES } from '../../utils/formatters';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Layers,
  ArrowRight,
  RefreshCw,
  Wine,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkInventoryUploadModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { products, bulkUpdateInventory, showToast } = useStore();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [updateMode, setUpdateMode] = useState<'set' | 'add'>('set');
  const [includePriceUpdates, setIncludePriceUpdates] = useState(false);
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedItems, setParsedItems] = useState<
    Array<{
      raw: any;
      matchedProduct?: Product;
      matchType: 'id' | 'slug' | 'name' | 'fuzzy' | 'none';
      targetStock: number;
      targetPrice?: number;
      targetSalePrice?: number;
    }>
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkInventoryResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to normalize strings for robust comparison
  const normalize = (s?: string) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();

  // CSV / Text Parser
  const parseCSVContent = (content: string) => {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setParsedItems([]);
      return;
    }

    // Determine delimiter (comma, tab, semicolon)
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    const parseRow = (rowStr: string): string[] => {
      // Regex for parsing CSV with quotes
      const pattern = new RegExp(
        `(?:${delimiter}|^)(?:"([^"]*)"|([^"${delimiter}]*))`,
        'g'
      );
      const row: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(rowStr))) {
        let val = match[1] !== undefined ? match[1] : match[2];
        if (val === undefined) val = '';
        row.push(val.trim());
      }
      return row;
    };

    const headerTokens = parseRow(lines[0]).map((h) => h.toLowerCase());

    // Detect header indexes
    let idIdx = headerTokens.findIndex((h) =>
      ['id', 'product_id', 'product id', 'sku', 'code', 'spirit_id'].some((k) => h.includes(k))
    );
    let nameIdx = headerTokens.findIndex((h) =>
      ['name', 'product_name', 'spirit_name', 'spirit title', 'title', 'item', 'spirit'].some((k) =>
        h.includes(k)
      )
    );
    let stockIdx = headerTokens.findIndex((h) =>
      ['stock', 'quantity', 'qty', 'count', 'units', 'inventory', 'vault', 'bottles'].some((k) =>
        h.includes(k)
      )
    );
    let priceIdx = headerTokens.findIndex((h) =>
      ['price', 'unit_price', 'unit price', 'kes', 'cost', 'rate'].some((k) => h.includes(k))
    );
    let salePriceIdx = headerTokens.findIndex((h) =>
      ['sale_price', 'sale price', 'discount_price', 'offer'].some((k) => h.includes(k))
    );

    let startRow = 1;
    // If no header found, fallback to positional parsing: col 0 = name/id, col 1 = stock
    if (stockIdx === -1 && nameIdx === -1 && idIdx === -1) {
      startRow = 0;
      idIdx = -1;
      nameIdx = 0;
      stockIdx = 1;
      priceIdx = 2;
    } else {
      if (nameIdx === -1 && idIdx === -1) nameIdx = 0;
      if (stockIdx === -1) stockIdx = 1;
    }

    const items: typeof parsedItems = [];

    for (let i = startRow; i < lines.length; i++) {
      const row = parseRow(lines[i]);
      if (row.length === 0 || (row.length === 1 && !row[0])) continue;

      const rawId = idIdx >= 0 && row[idIdx] ? row[idIdx].trim() : '';
      const rawName = nameIdx >= 0 && row[nameIdx] ? row[nameIdx].trim() : '';
      const rawStockStr = stockIdx >= 0 && row[stockIdx] ? row[stockIdx].replace(/[^0-9.-]/g, '') : '0';
      const parsedStock = parseInt(rawStockStr, 10) || 0;

      let parsedPrice: number | undefined;
      if (priceIdx >= 0 && row[priceIdx]) {
        const cleanPrice = parseFloat(row[priceIdx].replace(/[^0-9.]/g, ''));
        if (!isNaN(cleanPrice) && cleanPrice > 0) parsedPrice = cleanPrice;
      }

      let parsedSalePrice: number | undefined;
      if (salePriceIdx >= 0 && row[salePriceIdx]) {
        const cleanSale = parseFloat(row[salePriceIdx].replace(/[^0-9.]/g, ''));
        if (!isNaN(cleanSale) && cleanSale > 0) parsedSalePrice = cleanSale;
      }

      // Match against catalog products
      let matched: Product | undefined;
      let matchType: typeof parsedItems[0]['matchType'] = 'none';

      // 1. Match by exact ID
      if (rawId) {
        matched = products.find((p) => p.id.toLowerCase() === rawId.toLowerCase());
        if (matched) matchType = 'id';
      }

      // 2. Match by exact Name or Slug
      if (!matched && rawName) {
        matched = products.find(
          (p) =>
            p.name.toLowerCase() === rawName.toLowerCase() ||
            p.slug.toLowerCase() === rawName.toLowerCase()
        );
        if (matched) matchType = 'name';
      }

      // 3. Match by normalized Name
      if (!matched && rawName) {
        const cleanTarget = normalize(rawName);
        matched = products.find((p) => {
          const cleanP = normalize(p.name);
          return cleanP === cleanTarget || cleanP.includes(cleanTarget) || cleanTarget.includes(cleanP);
        });
        if (matched) matchType = 'fuzzy';
      }

      items.push({
        raw: { id: rawId, name: rawName, stock: parsedStock, price: parsedPrice, salePrice: parsedSalePrice },
        matchedProduct: matched,
        matchType,
        targetStock: Math.max(0, parsedStock),
        targetPrice: parsedPrice,
        targetSalePrice: parsedSalePrice,
      });
    }

    setParsedItems(items);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      parseCSVContent(text);
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    setFileName('Pasted-Spreadsheet.csv');
    parseCSVContent(val);
  };

  // Template Download Handlers
  const handleDownloadPrefilledTemplate = () => {
    const headers = ['Product ID', 'Spirit Name', 'Brand', 'Category', 'Current Stock', 'New Stock Count', 'Price (KES)'];
    const rows = products.map((p) => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.brand}"`,
      `"${p.categoryName}"`,
      p.stock,
      p.stock, // Default placeholder
      p.price,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `BarKwetu_Inventory_Template_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded pre-filled inventory CSV template!', 'success');
  };

  const handleDownloadBlankTemplate = () => {
    const headers = ['Spirit Name', 'Stock Count', 'Price (KES)'];
    const sampleRows = [
      ['"The Singleton of Dufftown 12 Year Old Single Malt"', 30, 5250],
      ['"Tanqueray No. TEN Distilled Gin"', 25, 4400],
      ['"Don Julio Reposado Tequila"', 18, 8500],
      ['"Johnnie Walker Black Label 12YO"', 45, 3850],
    ];
    const csvContent = [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'BarKwetu_Blank_Inventory_Template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded blank inventory CSV template!', 'success');
  };

  // Submit Bulk Update
  const handleApplyUpdates = async () => {
    if (parsedItems.length === 0) {
      showToast('No items found in uploaded file.', 'error');
      return;
    }

    const payload: BulkInventoryItem[] = parsedItems.map((item) => ({
      id: item.matchedProduct?.id || item.raw.id,
      name: item.matchedProduct?.name || item.raw.name,
      slug: item.matchedProduct?.slug,
      stock: item.targetStock,
      price: includePriceUpdates ? item.targetPrice : undefined,
      salePrice: includePriceUpdates ? item.targetSalePrice : undefined,
      mode: updateMode,
    }));

    setIsProcessing(true);
    try {
      const res = await bulkUpdateInventory(payload, updateMode);
      setUploadResult(res);
    } catch (err: any) {
      console.error('Bulk upload error:', err);
      showToast('Failed to apply inventory updates. Please check file format.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setRawText('');
    setFileName('');
    setParsedItems([]);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const matchedCount = parsedItems.filter((i) => i.matchedProduct).length;
  const unmatchedCount = parsedItems.filter((i) => !i.matchedProduct).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#12131a] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-[#161824] to-[#12131a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <span>Bulk Spirits Inventory Upload</span>
                <span className="text-[10px] uppercase tracking-wider font-sans font-bold bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded border border-[#d4af37]/40">
                  Batch Sync
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Upload a CSV spreadsheet to update vault stock counts across all spirits simultaneously.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {uploadResult ? (
            // Success Result Screen
            <div className="py-8 text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-serif font-bold text-white">
                  Inventory Successfully Synchronized!
                </h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Updated stock levels for{' '}
                  <strong className="text-emerald-400">{uploadResult.updatedCount} spirits</strong> in both the
                  local catalog and the live Firestore cloud database.
                </p>
              </div>

              {/* Summary Badges */}
              <div className="flex items-center justify-center gap-4 text-xs font-mono">
                <div className="bg-[#0b0c10] border border-zinc-800 px-4 py-2 rounded-xl">
                  <span className="text-zinc-500 block text-[10px] uppercase">Total Processed</span>
                  <span className="text-white font-bold">{uploadResult.totalProcessed} Rows</span>
                </div>
                <div className="bg-[#0b0c10] border border-emerald-800/60 px-4 py-2 rounded-xl">
                  <span className="text-emerald-500 block text-[10px] uppercase">Updated</span>
                  <span className="text-emerald-400 font-bold">{uploadResult.updatedCount} Spirits</span>
                </div>
                {uploadResult.unmatchedCount > 0 && (
                  <div className="bg-[#0b0c10] border border-amber-800/60 px-4 py-2 rounded-xl">
                    <span className="text-amber-500 block text-[10px] uppercase">Unmatched</span>
                    <span className="text-amber-400 font-bold">{uploadResult.unmatchedCount} Items</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={resetAll}
                  className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Upload Another Inventory File</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-2.5 px-6 rounded-xl bg-[#d4af37] hover:brightness-110 text-black text-xs font-bold transition-all shadow-md shadow-[#d4af37]/20 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Input Method Tabs & Template Downloads */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c0d12] border border-zinc-800/80 rounded-xl p-3">
                {/* Method Tabs */}
                <div className="flex bg-[#161822] p-1 rounded-lg text-xs">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`py-1.5 px-3 rounded-md font-semibold transition-colors cursor-pointer ${
                      activeTab === 'upload'
                        ? 'bg-[#d4af37] text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Upload CSV File
                  </button>
                  <button
                    onClick={() => setActiveTab('paste')}
                    className={`py-1.5 px-3 rounded-md font-semibold transition-colors cursor-pointer ${
                      activeTab === 'paste'
                        ? 'bg-[#d4af37] text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Paste Text / Rows
                  </button>
                </div>

                {/* Templates Helper */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPrefilledTemplate}
                    className="py-1.5 px-3 bg-[#181a24] hover:bg-[#222534] border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download current catalog with all spirits and IDs as a CSV template"
                  >
                    <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Current Catalog Template (CSV)</span>
                  </button>
                  <button
                    onClick={handleDownloadBlankTemplate}
                    className="py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    title="Download simple blank 3-column CSV template"
                  >
                    Blank Sample
                  </button>
                </div>
              </div>

              {/* Input Area */}
              {activeTab === 'upload' ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-700 hover:border-[#d4af37] bg-[#0c0d12]/60 hover:bg-[#0c0d12] rounded-2xl p-8 text-center cursor-pointer transition-all group space-y-3"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv,.tsv,.txt"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 group-hover:bg-[#d4af37]/20 border border-zinc-700 group-hover:border-[#d4af37]/50 flex items-center justify-center mx-auto text-zinc-400 group-hover:text-[#d4af37] transition-all">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {fileName ? fileName : 'Click to select or drag & drop CSV inventory list'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Supports CSV, TSV, or comma/tab separated spreadsheet exports
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-300">
                    Paste Spreadsheet Rows (copied directly from Excel or Google Sheets):
                  </label>
                  <textarea
                    rows={5}
                    value={rawText}
                    onChange={handlePasteChange}
                    placeholder={`Spirit Name, New Stock, Price\nThe Singleton of Dufftown 12 Year Old, 35, 5250\nTanqueray No. TEN Distilled Gin, 28, 4400\nDon Julio Reposado, 20, 8500`}
                    className="w-full bg-[#0c0d12] border border-zinc-800 rounded-xl p-3 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              )}

              {/* Settings: Update Strategy (Set vs Add) */}
              {parsedItems.length > 0 && (
                <div className="bg-[#0e0f16] border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Update Strategy & Options
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Choose whether the uploaded values overwrite total stock or add to existing levels.
                      </p>
                    </div>

                    {/* Mode Radio Buttons */}
                    <div className="flex items-center gap-2 bg-[#090a0d] border border-zinc-800 p-1 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setUpdateMode('set')}
                        className={`py-1 px-3 rounded font-medium transition-colors cursor-pointer ${
                          updateMode === 'set'
                            ? 'bg-[#d4af37] text-black font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Set Absolute Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpdateMode('add')}
                        className={`py-1 px-3 rounded font-medium transition-colors cursor-pointer ${
                          updateMode === 'add'
                            ? 'bg-[#d4af37] text-black font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        + Add To Current Stock
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                    <input
                      type="checkbox"
                      id="includePrice"
                      checked={includePriceUpdates}
                      onChange={(e) => setIncludePriceUpdates(e.target.checked)}
                      className="w-4 h-4 rounded text-[#d4af37] focus:ring-[#d4af37] border-zinc-700 bg-zinc-900 cursor-pointer"
                    />
                    <label htmlFor="includePrice" className="text-xs text-zinc-300 cursor-pointer">
                      Also update spirit prices if a price column is present in the file
                    </label>
                  </div>
                </div>
              )}

              {/* Preview Table of Matched Items */}
              {parsedItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-white">Parsed File Preview:</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                        {matchedCount} Matched Spirits
                      </span>
                      {unmatchedCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold">
                          {unmatchedCount} Unmatched
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {parsedItems.length} total rows
                    </span>
                  </div>

                  <div className="border border-zinc-800 rounded-xl overflow-hidden bg-[#0c0d12] max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs text-zinc-300">
                      <thead className="bg-[#141620] text-zinc-400 uppercase text-[10px] font-semibold border-b border-zinc-800 sticky top-0">
                        <tr>
                          <th className="p-2.5">Spirit in Vault</th>
                          <th className="p-2.5">Match Status</th>
                          <th className="p-2.5">Current Stock</th>
                          <th className="p-2.5 font-bold text-white">
                            {updateMode === 'add' ? 'Addition (+)' : 'New Target Stock'}
                          </th>
                          <th className="p-2.5 text-right font-bold text-white">Resulting Vault Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-mono">
                        {parsedItems.map((item, idx) => {
                          const p = item.matchedProduct;
                          const oldStock = p ? p.stock : 0;
                          const resultingStock =
                            updateMode === 'add' ? oldStock + item.targetStock : item.targetStock;

                          return (
                            <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="p-2.5 font-sans">
                                {p ? (
                                  <div>
                                    <p className="font-semibold text-white">{p.name}</p>
                                    <p className="text-[10px] text-zinc-500">{p.brand} · {p.volume}</p>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="font-semibold text-amber-400 italic">
                                      {item.raw.name || item.raw.id || 'Unidentified Entry'}
                                    </p>
                                    <p className="text-[10px] text-zinc-600">Not found in active catalog</p>
                                  </div>
                                )}
                              </td>

                              <td className="p-2.5 font-sans">
                                {p ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                                    <Check className="w-3 h-3" />
                                    <span>{item.matchType === 'id' ? 'Exact ID' : 'Matched'}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/40">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>No Match</span>
                                  </span>
                                )}
                              </td>

                              <td className="p-2.5 text-zinc-400">
                                {p ? `${oldStock} units` : '-'}
                              </td>

                              <td className="p-2.5 font-bold text-[#d4af37]">
                                {updateMode === 'add' ? `+${item.targetStock}` : `${item.targetStock} units`}
                              </td>

                              <td className="p-2.5 text-right font-bold">
                                {p ? (
                                  <span
                                    className={
                                      resultingStock > oldStock
                                        ? 'text-emerald-400'
                                        : resultingStock < oldStock
                                        ? 'text-rose-400'
                                        : 'text-zinc-300'
                                    }
                                  >
                                    {resultingStock} units
                                  </span>
                                ) : (
                                  <span className="text-zinc-600">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!uploadResult && (
          <div className="p-4 sm:p-5 border-t border-zinc-800 bg-[#0e0f14] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              {parsedItems.length > 0 && (
                <button
                  type="button"
                  onClick={resetAll}
                  className="py-2 px-3 text-zinc-400 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                disabled={parsedItems.length === 0 || isProcessing || matchedCount === 0}
                onClick={handleApplyUpdates}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none text-black text-xs font-bold transition-all shadow-md shadow-[#d4af37]/20 flex items-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Cloud Vault...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Apply Updates ({matchedCount} Spirits)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
