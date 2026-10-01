import React, { useState } from 'react';
import {
  Shield,
  FileText,
  Cookie,
  RotateCcw,
  Database,
  Lock,
  X,
} from 'lucide-react';

export type LegalPolicyType =
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'refund'
  | 'minimisation'
  | 'security';

interface Props {
  initialPolicy?: LegalPolicyType;
  isOpen: boolean;
  onClose: () => void;
}

export const LegalPolicyModal: React.FC<Props> = ({ initialPolicy = 'privacy', isOpen, onClose }) => {
  const [activePolicy, setActivePolicy] = useState<LegalPolicyType>(initialPolicy);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#12131a] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-[#161824] to-[#12131a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white">BarKwetu Legal & Compliance Centre</h3>
              <p className="text-xs text-zinc-400">
                Transparent policies governing privacy, data security, refunds, and terms of service.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body with Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-72 bg-[#0c0d12] border-b md:border-b-0 md:border-r border-zinc-800 p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0">
            <button
              onClick={() => setActivePolicy('privacy')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activePolicy === 'privacy'
                  ? 'bg-[#d4af37] text-black font-bold shadow-md shadow-[#d4af37]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Privacy Policy</span>
            </button>

            <button
              onClick={() => setActivePolicy('terms')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activePolicy === 'terms'
                  ? 'bg-[#d4af37] text-black font-bold shadow-md shadow-[#d4af37]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>Terms & Conditions</span>
            </button>

            <button
              onClick={() => setActivePolicy('cookies')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activePolicy === 'cookies'
                  ? 'bg-[#d4af37] text-black font-bold shadow-md shadow-[#d4af37]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Cookie className="w-4 h-4 shrink-0" />
              <span>Cookie Policy</span>
            </button>

            <button
              onClick={() => setActivePolicy('refund')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activePolicy === 'refund'
                  ? 'bg-[#d4af37] text-black font-bold shadow-md shadow-[#d4af37]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>Refund & Cancellation</span>
            </button>

            <button
              onClick={() => setActivePolicy('minimisation')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activePolicy === 'minimisation'
                  ? 'bg-[#d4af37] text-black font-bold shadow-md shadow-[#d4af37]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Database className="w-4 h-4 shrink-0" />
              <span>Data Minimisation</span>
            </button>

            <button
              onClick={() => setActivePolicy('security')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                activePolicy === 'security'
                  ? 'bg-[#d4af37] text-black font-bold shadow-md shadow-[#d4af37]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>Data Storage & Security</span>
            </button>
          </div>

          {/* Policy Text Display */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-zinc-300 text-xs sm:text-sm leading-relaxed bg-[#12131a]">
            {activePolicy === 'privacy' && (
              <div className="space-y-4 animate-fade-in">
                <h4 className="text-lg font-serif font-bold text-white border-b border-zinc-800 pb-2">
                  Privacy Policy
                </h4>
                <p className="text-zinc-400">Last updated: October 2026</p>
                <p>
                  BarKwetu (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal data in compliance with the Data Protection Act of Kenya and global privacy standards.
                </p>
                <h5 className="font-semibold text-white mt-3">1. Information We Collect</h5>
                <p>
                  We collect only necessary information required to process reserve spirit orders and comply with alcoholic beverage regulations:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li>Contact details: Name, phone number (for M-Pesa STK push & rider coordination), and delivery address in Kenya.</li>
                  <li>Age verification confirmation (18+ statutory requirement for alcohol sales in Kenya).</li>
                  <li>Account credentials (securely hashed passwords or authenticated Google login tokens).</li>
                  <li>Transaction and loyalty coin history (Kwetu Coins balance and redemption records).</li>
                </ul>
                <h5 className="font-semibold text-white mt-3">2. How We Use Your Information</h5>
                <p>
                  Your information is used exclusively to dispatch orders, process M-Pesa payments through PalPluss, award loyalty coins, and provide real-time delivery rider GPS tracking. We do <strong>not</strong> sell, rent, or trade your personal data to third-party marketers.
                </p>
              </div>
            )}

            {activePolicy === 'terms' && (
              <div className="space-y-4 animate-fade-in">
                <h4 className="text-lg font-serif font-bold text-white border-b border-zinc-800 pb-2">
                  Terms & Conditions
                </h4>
                <p className="text-zinc-400">Last updated: October 2026</p>
                <p>
                  Welcome to BarKwetu Premium Spirits. By accessing our platform or placing an order, you agree to be bound by these Terms & Conditions.
                </p>
                <h5 className="font-semibold text-white mt-3">1. Age Restriction & Compliance</h5>
                <p>
                  BarKwetu strictly sells alcoholic beverages to individuals aged 18 and above. By placing an order, you certify that you are at least 18 years old. Our dispatch riders reserve the right to request official government identification (National ID or Passport) upon delivery.
                </p>
                <h5 className="font-semibold text-white mt-3">2. User Accounts & Prohibited Behaviour</h5>
                <p>
                  You are responsible for maintaining the confidentiality of your account credentials. Prohibited actions include creating fraudulent orders, abusive conduct toward dispatch riders, attempting to bypass age verification, or scraping catalog data.
                </p>
                <h5 className="font-semibold text-white mt-3">3. Intellectual Property</h5>
                <p>
                  All brand imagery, tasting notes, logos, software architecture, and product designs on BarKwetu are protected by copyright and intellectual property laws. Unauthorized reproduction is strictly prohibited.
                </p>
                <h5 className="font-semibold text-white mt-3">4. Subscriptions & Kwetu Coins</h5>
                <p>
                  Kwetu Coins and membership tiers (Bronze, Silver, Gold, Platinum VIP) are promotional loyalty benefits. BarKwetu reserves the right to adjust coin earning multipliers or redemption rules upon notice.
                </p>
                <h5 className="font-semibold text-white mt-3">5. Limitations of Liability</h5>
                <p>
                  BarKwetu shall not be liable for indirect, incidental, or consequential damages arising from delivery delays caused by extreme weather, infrastructure disruptions, or force majeure events.
                </p>
              </div>
            )}

            {activePolicy === 'cookies' && (
              <div className="space-y-4 animate-fade-in">
                <h4 className="text-lg font-serif font-bold text-white border-b border-zinc-800 pb-2">
                  Cookie Policy
                </h4>
                <p className="text-zinc-400">Last updated: October 2026</p>
                <p>
                  BarKwetu uses small data files known as cookies and local browser storage to ensure secure navigation, remember your shopping basket items, maintain your authentication state, and remember your age verification status.
                </p>
                <h5 className="font-semibold text-white mt-3">Types of Storage Used:</h5>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li><strong>Essential Session Cookies:</strong> Required for secure login, M-Pesa payment session state, and shopping cart persistence.</li>
                  <li><strong>Preference Storage:</strong> Stores your age gate confirmation and dark mode / UI preferences locally on your device.</li>
                </ul>
                <p>
                  You can clear or disable cookies via your browser settings, though doing so may disable basket persistence and secure checkout features.
                </p>
              </div>
            )}

            {activePolicy === 'refund' && (
              <div className="space-y-4 animate-fade-in">
                <h4 className="text-lg font-serif font-bold text-white border-b border-zinc-800 pb-2">
                  Refund & Cancellation Policy
                </h4>
                <p className="text-zinc-400">Last updated: October 2026</p>
                <h5 className="font-semibold text-white">1. Order Cancellation</h5>
                <p>
                  You may cancel your order free of charge prior to dispatch rider departure from our cellar hub. Once a rider has been dispatched with your spirits, cancellation is no longer permitted due to the perishable and regulated nature of alcoholic goods.
                </p>
                <h5 className="font-semibold text-white mt-3">2. Returns & Replacements</h5>
                <p>
                  Due to food safety and alcohol excise regulations, opened or broken bottles cannot be returned unless received damaged, defective, or incorrect. If your bottle arrives damaged or tampered with, notify our dispatch rider immediately and contact support within 2 hours for a full replacement or M-Pesa refund.
                </p>
              </div>
            )}

            {activePolicy === 'minimisation' && (
              <div className="space-y-4 animate-fade-in">
                <h4 className="text-lg font-serif font-bold text-white border-b border-zinc-800 pb-2">
                  Data Minimisation Principle
                </h4>
                <p className="text-zinc-400">Last updated: October 2026</p>
                <p>
                  BarKwetu adheres strictly to the principle of <strong>Data Minimisation</strong>. We collect, process, and retain only the minimum personal data strictly necessary to fulfill your orders and provide customer support:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li>We do not collect sensitive personal data such as biometric identifiers, political affiliation, or religious views.</li>
                  <li>Payment details (M-Pesa PINs and mobile credentials) are handled entirely through encrypted secure gateways (PalPluss M-Pesa STK Push) and are never stored on our servers.</li>
                  <li>Customer accounts inactive for over 3 years are automatically anonymized or purged upon request.</li>
                </ul>
              </div>
            )}

            {activePolicy === 'security' && (
              <div className="space-y-4 animate-fade-in">
                <h4 className="text-lg font-serif font-bold text-white border-b border-zinc-800 pb-2">
                  Personal Data Storage & Security
                </h4>
                <p className="text-zinc-400">Know where user information actually ends up</p>
                <p>
                  We believe in absolute transparency regarding where your data lives and how it is secured:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li><strong>Cloud Infrastructure:</strong> All user profiles, order histories, product reviews, and inventory records are stored securely in a dedicated Google Cloud / Firebase Firestore database instance encrypted at rest using AES-256 standards.</li>
                  <li><strong>Encryption in Transit:</strong> All communication between your browser and our servers is secured via TLS 1.3 / HTTPS encryption.</li>
                  <li><strong>Access Controls:</strong> Strict role-based access control (RBAC) ensures only authorized staff and assigned delivery riders can view relevant shipping metadata necessary for dispatch.</li>
                  <li><strong>Data Residency:</strong> Data is hosted securely within Google Cloud managed server regions with enterprise redundancy.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#0e0f14] flex items-center justify-between text-xs text-zinc-400">
          <span>BarKwetu Premium Spirits · Regulatory & Compliance Division</span>
          <button
            onClick={onClose}
            className="py-2 px-5 bg-[#d4af37] text-black font-bold rounded-xl hover:brightness-110 transition-all cursor-pointer"
          >
            Close & Return
          </button>
        </div>
      </div>
    </div>
  );
};
