import React, { useState, useEffect } from 'react';
import { Smartphone, ShieldCheck, Key, RefreshCw, Send, CheckCircle2, AlertCircle, Copy, ExternalLink, Zap } from 'lucide-react';
import { formatKES } from '../../utils/formatters';

interface PalPlussConfig {
  isConfigured: boolean;
  merchantId: string;
  apiUrl: string;
  environment: 'live' | 'sandbox';
  webhookEndpoint: string;
}

export const PalPlussIntegrationTab: React.FC = () => {
  const [config, setConfig] = useState<PalPlussConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [merchantIdInput, setMerchantIdInput] = useState('');
  const [apiUrlInput, setApiUrlInput] = useState('https://api.palpluss.com/v1');
  const [envInput, setEnvInput] = useState<'live' | 'sandbox'>('sandbox');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

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
      }
    } catch (err) {
      console.error('Failed to load PalPluss config', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
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
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSaveSuccessMsg('PalPluss credentials saved and activated successfully!');
        setApiKeyInput('');
        fetchConfig();
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
          customerName: 'Admin Connection Test',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.customerMessage || 'Test STK Push dispatched successfully!',
          data,
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Failed to dispatch test STK push.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error attempting STK Push.',
      });
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
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  PalPluss M-Pesa Gateway Integration
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    config?.isConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {config?.isConfigured ? 'Live Gateway Connected' : 'Sandbox Ready / Config Required'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Automated Safaricom Daraja M-Pesa STK Push prompts and instant payment verification for BarKwetu Kenya.
              </p>
            </div>
          </div>

          <a
            href="https://palpluss.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
          >
            <span>PalPluss Merchant Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: API Configuration Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#121318] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#d4af37]" />
                <h3 className="font-bold text-white text-base">API Credentials & Endpoints</h3>
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
                    Sandbox / Simulator
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

          {/* Send Live Test STK Push */}
          <div className="bg-[#121318] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-[#d4af37]" />
              <h3 className="font-bold text-white text-base">Test STK Push Dispatch</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Send a test M-Pesa prompt directly to your phone to verify end-to-end phone pop-up connectivity.
            </p>

            <form onSubmit={handleSendTestStk} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Phone Number (254...)</label>
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
                className={`p-3.5 rounded-xl border text-xs ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.data?.reference && (
                      <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                        Ref: {testResult.data.reference} | ID: {testResult.data.checkoutRequestId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
