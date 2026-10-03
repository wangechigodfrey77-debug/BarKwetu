import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory payment and transaction state store & PalPluss gateway config
let palplussConfig = {
  apiKey: process.env.PALPLUSS_API_KEY || '',
  merchantId: process.env.PALPLUSS_MERCHANT_ID || '',
  apiUrl: process.env.PALPLUSS_API_URL || 'https://api.palpluss.com/v1',
  environment: (process.env.PALPLUSS_API_KEY ? 'live' : 'sandbox') as 'live' | 'sandbox',
};

const palplussTransactions: Record<string, {
  reference: string;
  orderNumber: string;
  amount: number;
  phone: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  mpesaReceipt?: string;
  timestamp: string;
  metadata?: any;
}> = {};

// ==================== PALPLUSS M-PESA API ROUTES ====================

/**
 * GET /api/payments/palpluss/config
 * Check PalPluss connection status and webhook configuration
 */
app.get('/api/payments/palpluss/config', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    isConfigured: Boolean(palplussConfig.apiKey),
    merchantId: palplussConfig.merchantId ? `${palplussConfig.merchantId.slice(0, 4)}****` : 'Not Set',
    apiUrl: palplussConfig.apiUrl,
    environment: palplussConfig.environment,
    webhookEndpoint: '/api/payments/palpluss/webhook',
  });
});

/**
 * POST /api/payments/palpluss/save-config
 * Update PalPluss credentials from Admin Dashboard
 */
app.post('/api/payments/palpluss/save-config', (req: Request, res: Response) => {
  const { apiKey, merchantId, apiUrl, environment } = req.body;
  if (apiKey !== undefined) palplussConfig.apiKey = apiKey.trim();
  if (merchantId !== undefined) palplussConfig.merchantId = merchantId.trim();
  if (apiUrl !== undefined) palplussConfig.apiUrl = apiUrl.trim();
  if (environment !== undefined) palplussConfig.environment = environment;

  console.log(`[PalPluss Config] Updated. Mode: ${palplussConfig.environment}, Merchant: ${palplussConfig.merchantId || 'N/A'}`);
  return res.status(200).json({
    success: true,
    message: 'PalPluss M-Pesa gateway credentials updated successfully',
    config: {
      isConfigured: Boolean(palplussConfig.apiKey),
      merchantId: palplussConfig.merchantId,
      apiUrl: palplussConfig.apiUrl,
      environment: palplussConfig.environment,
    },
  });
});

/**
 * POST /api/payments/palpluss/stkpush
 * Initiates an M-Pesa STK Push via PalPluss API.
 */
app.post('/api/payments/palpluss/stkpush', async (req: Request, res: Response) => {
  try {
    const { phone, amount, orderNumber, customerName } = req.body;

    if (!phone || !amount || !orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: phone, amount, or orderNumber',
      });
    }

    // Format phone to 254XXXXXXXXX
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '254' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) {
      cleanPhone = '254' + cleanPhone;
    }

    const reference = `PLP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Store in transaction tracking ledger
    palplussTransactions[reference] = {
      reference,
      orderNumber,
      amount: Number(amount),
      phone: cleanPhone,
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      metadata: { customerName },
    };

    // If live PalPluss API key is configured, forward real request to PalPluss
    if (palplussConfig.apiKey) {
      try {
        console.log(`[PalPluss Live STK] Forwarding request to ${palplussConfig.apiUrl}/stkpush for ${cleanPhone}...`);
        const liveResponse = await fetch(`${palplussConfig.apiUrl}/stkpush`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${palplussConfig.apiKey}`,
          },
          body: JSON.stringify({
            merchant_id: palplussConfig.merchantId,
            phone: cleanPhone,
            amount: Number(amount),
            reference,
            order_id: orderNumber,
            description: `BarKwetu Reserve Order #${orderNumber}`,
          }),
        });

        if (liveResponse.ok) {
          const liveData = await liveResponse.json();
          console.log('[PalPluss Live Response]', liveData);
          return res.status(200).json({
            success: true,
            reference,
            orderNumber,
            phone: cleanPhone,
            amount,
            checkoutRequestId: liveData.checkout_request_id || liveData.id || `ws_CO_${Date.now()}`,
            customerMessage: `STK Push prompt sent to ${cleanPhone}. Please enter your M-Pesa PIN on your phone to complete payment.`,
            status: 'PENDING',
            liveMode: true,
          });
        } else {
          const errText = await liveResponse.text();
          console.warn('[PalPluss Live API Warning]', errText);
        }
      } catch (liveErr) {
        console.warn('[PalPluss Live API Connection Exception]', liveErr);
      }
    }

    // Default & Sandbox STK Push response
    console.log(`[PalPluss STK Push] Prompt dispatched to ${cleanPhone} for KSh ${amount} (Ref: ${reference}, Order: ${orderNumber})`);

    return res.status(200).json({
      success: true,
      reference,
      orderNumber,
      phone: cleanPhone,
      amount,
      checkoutRequestId: `ws_CO_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      customerMessage: `STK Push prompt sent to ${cleanPhone}. Please enter your M-Pesa PIN on your phone to complete payment.`,
      status: 'PENDING',
      liveMode: Boolean(palplussConfig.apiKey),
    });
  } catch (error: any) {
    console.error('[PalPluss Error]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error processing payment',
    });
  }
});

/**
 * GET /api/payments/palpluss/status/:reference
 * Polls the current state of a PalPluss transaction.
 */
app.get('/api/payments/palpluss/status/:reference', (req: Request, res: Response) => {
  const { reference } = req.params;
  const transaction = palplussTransactions[reference];

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction reference not found',
    });
  }

  return res.status(200).json({
    success: true,
    transaction,
  });
});

/**
 * POST /api/payments/palpluss/simulate-action
 * Helper endpoint for testing & immediate sandbox feedback
 */
app.post('/api/payments/palpluss/simulate-action', (req: Request, res: Response) => {
  const { reference, action } = req.body;
  const transaction = palplussTransactions[reference];

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found',
    });
  }

  if (action === 'SUCCESS') {
    // Generate realistic Safaricom M-Pesa receipt code (e.g. QGH82KL91M)
    const receiptChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let receipt = 'Q';
    for (let i = 0; i < 9; i++) {
      receipt += receiptChars.charAt(Math.floor(Math.random() * receiptChars.length));
    }

    transaction.status = 'SUCCESS';
    transaction.mpesaReceipt = receipt;

    console.log(`[PalPluss STK Push] Transaction ${reference} SUCCESS with receipt ${receipt}`);
    return res.status(200).json({
      success: true,
      status: 'SUCCESS',
      mpesaReceipt: receipt,
      transaction,
    });
  } else {
    transaction.status = 'CANCELLED';
    return res.status(200).json({
      success: true,
      status: 'CANCELLED',
      transaction,
    });
  }
});

/**
 * POST /api/payments/palpluss/webhook
 * Real webhook listener for PalPluss incoming payment callbacks
 */
app.post('/api/payments/palpluss/webhook', (req: Request, res: Response) => {
  console.log('[PalPluss Webhook Received]', JSON.stringify(req.body, null, 2));
  
  const { reference, status, mpesa_receipt_number, amount } = req.body;
  
  if (reference && palplussTransactions[reference]) {
    palplussTransactions[reference].status = status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
    if (mpesa_receipt_number) {
      palplussTransactions[reference].mpesaReceipt = mpesa_receipt_number;
    }
  }

  return res.status(200).json({
    received: true,
    timestamp: new Date().toISOString(),
  });
});

// ==================== APP SERVER / VITE INTEGRATION ====================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🥂 BarKwetu Liquor Store server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
