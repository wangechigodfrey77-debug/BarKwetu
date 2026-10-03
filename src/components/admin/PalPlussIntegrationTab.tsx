import React, { useState, useEffect } from 'react';
import { Smartphone, ShieldCheck, Key, RefreshCw, Send, CheckCircle2, AlertCircle, Copy, ExternalLink, Zap, Terminal, Activity, Trash2, ChevronDown, ChevronUp, Clock, Wifi, Info } from 'lucide-react';
import { formatKES } from '../../utils/formatters';

interface PalPlussConfig {
  isConfigured: boolean;
  merchantId: string;
  apiUrl: string;
  environment: 'live' | 'sandbox';
  fallbackTill: string;
  webhookEndpoint: string;
  totalLogs?: number;
}

export interface PalPlussLogItem {
  id: string;
  timestamp: string;
  eventType: 'STK_PUSH_ATTEMPT' | 'STK_PUSH_SUCCESS' | 'STK_PUSH_FAILED' | 'WEBHOOK_RECEIVED' | 'DIAGNOSTIC_PING';
  phone: string;
  amount: number;
  orderNumber: string;
  reference: string;
  httpStatus: number | string;
  statusText?: string;
  errorCode?: string;
  errorMessage?: string;
  remediation?: string;
  requestPayload?: any;
  rawResponse?: any;
  durationMs?: number;
  environment: 'live' | 'sandbox';
}

export const PalPlussIntegrationTab: React.FC = () => {
  const [config, setConfig] = useState<PalPlussConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [merchantIdInput, setMerchantIdInput] = useState('');
  const [apiUrlInput, setApiUrlInput] = useState('https://api.palpluss.com/v1');
  const [envInput, setEnvInput] = useState<'live' | 'sandbox'>('sandbox');
  const [tillNumberInput, setTillNumberInput] = useState('1661655');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Logs & Diagnostics
  const [logs, setLogs] = useState<PalPlussLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<{ statusCode?: number; durationMs?: number; reachable?: boolean; error?: string } | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // Test STK Push form
  const [testPhone, setTestPhone] = useState('254712345678');
  const [testAmount, setTestAmount] = useState('10');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/payments/palpluss/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setMerchantIdInput(data.merchantId && data.merchantId !== 'Not Set' ? data.merchantId : '');
        setApiUrlInput(data.apiUrl || 'https://api.palpluss.com/v1');
        setEnvInput(data.environment || 'sandbox');
        setTillNumberInput(data.fallbackTill || '1661655');
      }
    } catch (err) {
      console.error('Failed to load PalPluss config', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const res = await fetch('/api/payments/palpluss/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to fetch PalPluss logs', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handlePingGateway = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await fetch('/api/payments/palpluss/ping', { method: 'POST' });
      const data = await res.json();
      setPingResult(data);
      fetchLogs();
    } catch (err: any) {
      setPingResult({ reachable: false, error: err.message });
    } finally {
      setIsPinging(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch('/api/payments/palpluss/clear-logs', { method: 'POST' });
      setLogs([]);
    } catch (err) {
      console.warn('Failed to clear logs', err);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchLogs();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      const res = await fetch('/api/payments/palpluss/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKeyInput,
          merchantId: merchantIdInput,
          apiUrl: apiUrlInput,
          environment: envInput,
          mpesaTillNumber: tillNumberInput,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSaveSuccessMsg('PalPluss credentials and Till Number saved successfully!');
        setApiKeyInput('');
        fetchConfig();
        fetchLogs();
      }
    } catch (err) {
      console.error('Error saving PalPluss config', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestStk = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/payments/palpluss/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          amount: parseFloat(testAmount) || 10,
          orderNumber: `TEST-${Date.now().toString().slice(-4)}`,
          customerName: 'Admin Diagnostic Test',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.status !== 'FAILED') {
        setTestResult({
          success: true,
          message: data.customerMessage || 'Test STK Push dispatched successfully!',
          data,
        });
      } else {
        setTestResult({
          success: false,
          message: data.errorDetails?.errorMessage || data.customerMessage || data.message || 'Failed to dispatch test STK push.',
          data,
        });
      }
      fetchLogs();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error attempting STK Push.',
      });
      fetchLogs();
    } finally {
      setIsSendingTest(false);
    }
  };

  const fullWebhookUrl = `${window.location.origin}/api/payments/palpluss/webhook`;

  const copyWebhookToClipboard = () => {
    navigator.clipboard.writeText(fullWebhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const getStatusBadge = (status: number | string, eventType: string) => {
    if (eventType === 'STK_PUSH_SUCCESS' || status === 200) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
          HTTP {status} · OK
        </span>
      );
    }
    if (status === 401) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono">
          HTTP 401 · UNAUTHORIZED
        </span>
      );
    }
    if (status === 400) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
          HTTP 400 · BAD REQUEST
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono">
        HTTP {status || 'ERR'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#121318] border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00A859]/10 border border-[#00A859]/30 flex items-center justify-center text-[#00A859]">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-bold text-white">PalPluss &amp; M-Pesa Gateway</h2>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  config?.isConfigured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {config?.isConfigured ? 'API Connected' : 'Credentials Needed'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Real-time M-Pesa STK Push prompts, response code error logger, and fallback Buy Goods Till <strong>1661655</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePingGateway}
              disabled={isPinging}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 text-[#00A859] ${isPinging ? 'animate-pulse' : ''}`} />
              <span>{isPinging ? 'Pinging Gateway...' : 'Ping Gateway'}</span>
            </button>
            <button
              onClick={fetchLogs}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Ping Health Alert */}
        {pingResult && (
          <div className={`mt-4 p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in ${
            pingResult.reachable
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 shrink-0" />
              <span>
                {pingResult.reachable
                  ? `Gateway Healthy: Response code HTTP ${pingResult.statusCode} received in ${pingResult.durationMs}ms.`
                  : `Gateway Unreachable: ${pingResult.error || 'Network error connecting to API URL'}`}
              </span>
            </div>
            <span className="font-mono text-[11px] opacity-75">{config?.apiUrl}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: API Settings Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#121318] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#d4af37]" />
                <h3 className="font-bold text-white text-base">API Credentials &amp; Endpoints</h3>
              </div>
              <button
                onClick={fetchConfig}
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">
                  Environment Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEnvInput('sandbox')}
                    className={`py-2.5 px-4 rounded-xl font-bold border transition cursor-pointer text-center ${
                      envInput === 'sandbox'
                        ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]'
                        : 'bg-[#090a0d] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Sandbox / Test Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnvInput('live')}
                    className={`py-2.5 px-4 rounded-xl font-bold border transition cursor-pointer text-center ${
                      envInput === 'live'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                        : 'bg-[#090a0d] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Live Production M-Pesa
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">
                  PalPluss Merchant / Client ID
                </label>
                <input
                  type="text"
                  value={merchantIdInput}
                  onChange={(e) => setMerchantIdInput(e.target.value)}
                  placeholder="e.g. MERCH_BK_89201"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">
                  PalPluss API Secret Key / Bearer Token
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={config?.isConfigured ? '••••••••••••••••••••••••••••••••' : 'Enter PalPluss Secret API Key'}
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]"
                />
                <span className="text-[11px] text-zinc-500 block mt-1">
                  Keep this confidential. Provided in your PalPluss dashboard under API Keys.
                </span>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">
                  PalPluss API Gateway Base URL
                </label>
                <input
                  type="text"
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  placeholder="https://api.palpluss.com/v1"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-[11px] placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">
                  Fallback Safaricom Buy Goods Till Number
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tillNumberInput}
                    onChange={(e) => setTillNumberInput(e.target.value)}
                    placeholder="1661655"
                    className="flex-1 bg-[#090a0d] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
                    Active Till
                  </div>
                </div>
                <span className="text-[11px] text-zinc-500 block mt-1">
                  Shown automatically to customers whenever an STK push prompt fails or times out.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-[#d4af37] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-950/40 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving Credentials...' : 'Save & Activate PalPluss Gateway'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Webhook Listener & Live Test Tool */}
        <div className="lg:col-span-5 space-y-6">
          {/* Webhook Endpoint Box */}
          <div className="bg-[#121318] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Instant Webhook Callback</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Paste this URL into your PalPluss merchant dashboard so incoming M-Pesa confirmations automatically mark orders as PAID in real-time.
            </p>

            <div className="p-3 bg-[#090a0d] border border-zinc-800 rounded-xl flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-zinc-300 truncate">
                {fullWebhookUrl}
              </span>
              <button
                onClick={copyWebhookToClipboard}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer shrink-0"
                title="Copy Webhook URL"
              >
                {copiedWebhook ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Send Live Test STK Push with Diagnostic Result */}
          <div className="bg-[#121318] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-[#d4af37]" />
              <h3 className="font-bold text-white text-base">Test STK Push Dispatch</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Trigger a test prompt to your phone and capture exact API response codes.
            </p>

            <form onSubmit={handleSendTestStk} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Phone Number (e.g. 254712345678 or 0712345678)</label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="254712345678"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Test Amount (KES)</label>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  min="1"
                  max="1000"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingTest}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Smartphone className="w-4 h-4" />
                <span>{isSendingTest ? 'Dispatching STK Push...' : 'Trigger Test STK Push'}</span>
              </button>
            </form>

            {testResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold text-white">{testResult.message}</p>
                    {testResult.data?.errorDetails && (
                      <div className="p-2.5 bg-black/50 rounded-xl border border-rose-500/20 text-[11px] text-zinc-300 space-y-1 font-mono">
                        <div>
                          <span className="text-zinc-500">Status Code:</span>{' '}
                          <span className="font-bold text-rose-300">HTTP {testResult.data.errorDetails.httpStatus}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Error Code:</span>{' '}
                          <span className="text-amber-300">{testResult.data.errorDetails.errorCode}</span>
                        </div>
                        {testResult.data.errorDetails.remediation && (
                          <div className="pt-1 text-zinc-400 font-sans">
                            <strong className="text-emerald-400">Fix:</strong> {testResult.data.errorDetails.remediation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-Width Detailed Error Logging & Response Code Inspector */}
      <div className="bg-[#121318] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-base">
                PalPluss API Response Code &amp; Diagnostics Log
              </h3>
              <p className="text-xs text-zinc-400">
                Detailed audit trail capturing specific HTTP response codes, latency, and gateway error payloads.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={isLoadingLogs}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
            <button
              onClick={handleClearLogs}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="p-10 text-center text-zinc-500 text-xs space-y-2">
            <Info className="w-8 h-8 mx-auto text-zinc-600 mb-1" />
            <p>No API error events logged yet.</p>
            <p className="text-[11px] text-zinc-600">
              Run a test STK Push above or ping the gateway to record live response codes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const isFail = log.eventType === 'STK_PUSH_FAILED' || (typeof log.httpStatus === 'number' && log.httpStatus >= 400);

              return (
                <div
                  key={log.id}
                  className={`border rounded-2xl p-4 transition-all ${
                    isFail
                      ? 'bg-[#161214] border-rose-900/40 hover:border-rose-700/60'
                      : 'bg-[#0d0e12] border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      {getStatusBadge(log.httpStatus, log.eventType)}
                      <span className="font-mono text-zinc-300 font-bold">
                        {log.eventType.replace(/_/g, ' ')}
                      </span>
                      {log.errorCode && (
                        <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {log.errorCode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                      {log.durationMs !== undefined && (
                        <span className="font-mono flex items-center gap-1 text-zinc-500">
                          <Clock className="w-3 h-3" />
                          {log.durationMs}ms
                        </span>
                      )}
                      <span className="font-mono text-zinc-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                        title="Toggle JSON details"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Summary row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5 text-xs text-zinc-400">
                    <div>
                      <span className="text-zinc-600 block text-[10px] uppercase">Phone</span>
                      <span className="font-mono text-zinc-200">{log.phone}</span>
                    </div>
                    <div>
                      <span className="text-zinc-600 block text-[10px] uppercase">Order &amp; Ref</span>
                      <span className="font-mono text-zinc-300 truncate block">#{log.orderNumber} ({log.reference})</span>
                    </div>
                    <div>
                      <span className="text-zinc-600 block text-[10px] uppercase">Amount</span>
                      <span className="font-bold text-[#d4af37]">{formatKES(log.amount)}</span>
                    </div>
                  </div>

                  {/* Remediation banner if error */}
                  {log.remediation && (
                    <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-zinc-800/80 text-xs text-zinc-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-400 font-semibold">Diagnosis:</strong> {log.errorMessage || 'Prompt failed.'}{' '}
                        <span className="text-zinc-400 block sm:inline mt-0.5 sm:mt-0">
                          <strong className="text-emerald-400">Recommended Action:</strong> {log.remediation}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Expanded JSON Inspector */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2 animate-in fade-in">
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Raw Request &amp; Gateway Response Inspector
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {log.requestPayload && (
                          <div>
                            <span className="text-[10px] text-zinc-500 font-mono block mb-1">Payload Sent:</span>
                            <pre className="p-3 bg-[#08090c] border border-zinc-800 rounded-xl text-[10px] text-zinc-300 font-mono overflow-x-auto max-h-48">
                              {JSON.stringify(log.requestPayload, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.rawResponse && (
                          <div>
                            <span className="text-[10px] text-zinc-500 font-mono block mb-1">Response Received:</span>
                            <pre className="p-3 bg-[#08090c] border border-zinc-800 rounded-xl text-[10px] text-zinc-300 font-mono overflow-x-auto max-h-48">
                              {JSON.stringify(log.rawResponse, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
