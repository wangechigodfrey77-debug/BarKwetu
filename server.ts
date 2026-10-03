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
  mpesaTillNumber: '1661655',
};

export interface PalPlussLogEntry {
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

const palplussErrorLogs: PalPlussLogEntry[] = [];
const MAX_LOG_ENTRIES = 100;

function logPalPlussEvent(entry: Omit<PalPlussLogEntry, 'id' | 'timestamp'>): PalPlussLogEntry {
  const newEntry: PalPlussLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  palplussErrorLogs.unshift(newEntry);
  if (palplussErrorLogs.length > MAX_LOG_ENTRIES) {
    palplussErrorLogs.pop();
  }

  return newEntry;
}

function analyzePalPlussError(httpStatus: number | string, responseBody: any): {
  errorCode: string;
  errorMessage: string;
  remediation: string;
} {
  const rawMsg =
    responseBody?.message ||
    responseBody?.errorMessage ||
    responseBody?.error ||
    responseBody?.description ||
    (typeof responseBody === 'string' ? responseBody : 'Unknown Gateway Error');

  const rawCode =
    responseBody?.code ||
    responseBody?.errorCode ||
    responseBody?.ResponseCode ||
    responseBody?.status_code ||
    `HTTP_${httpStatus}`;

  if (httpStatus === 401 || httpStatus === '401') {
    return {
      errorCode: String(rawCode || 'AUTH_401'),
      errorMessage: rawMsg || 'Invalid or Expired API Bearer Token / API Key.',
      remediation: 'Check your PalPluss API Key in Admin Dashboard > PalPluss M-Pesa Tab. Ensure there are no leading/trailing spaces.',
    };
  }

  if (httpStatus === 400 || httpStatus === '400') {
    return {
      errorCode: String(rawCode || 'BAD_REQUEST_400'),
      errorMessage: rawMsg || 'Malformed request payload or invalid phone number.',
      remediation: 'Ensure the customer phone number is in international Kenyan format (e.g. 2547XXXXXXXX or 2541XXXXXXXX) and amount is >= KSh 10.',
    };
  }

  if (httpStatus === 403 || httpStatus === '403') {
    return {
      errorCode: String(rawCode || 'FORBIDDEN_403'),
      errorMessage: rawMsg || 'PalPluss Merchant account access denied or permissions restricted.',
      remediation: 'Verify your Merchant ID in the PalPluss merchant portal. Ensure STK Push product is activated on your account.',
    };
  }

  if (httpStatus === 404 || httpStatus === '404') {
    return {
      errorCode: String(rawCode || 'NOT_FOUND_404'),
      errorMessage: rawMsg || 'PalPluss endpoint URL not found.',
      remediation: 'Check PalPluss Gateway Base URL (e.g. https://api.palpluss.com/v1). Ensure no trailing slash.',
    };
  }

  if (httpStatus === 422 || httpStatus === '422') {
    return {
      errorCode: String(rawCode || 'UNPROCESSABLE_422'),
      errorMessage: rawMsg || 'Validation error from upstream telecom gateway.',
      remediation: 'Review order details and ensure amount and reference format conform to Safaricom Daraja specifications.',
    };
  }

  if (httpStatus === 502 || httpStatus === 503 || httpStatus === 504) {
    return {
      errorCode: String(rawCode || `GATEWAY_${httpStatus}`),
      errorMessage: rawMsg || 'Upstream Safaricom M-Pesa / PalPluss gateway is temporarily unreachable.',
      remediation: 'Safaricom M-Pesa gateway may be experiencing network delays. Inform customer to use Buy Goods Till 1661655 directly.',
    };
  }

  if (httpStatus === 500) {
    return {
      errorCode: String(rawCode || 'SERVER_500'),
      errorMessage: rawMsg || 'Internal error reported by PalPluss API server.',
      remediation: 'Review PalPluss merchant dashboard status or use fallback Till 1661655.',
    };
  }

  return {
    errorCode: String(rawCode || 'UNKNOWN_ERROR'),
    errorMessage: rawMsg || 'Unknown error during STK Push dispatch.',
    remediation: 'Use fallback Till Number 1661655 for instant checkout while checking gateway logs.',
  };
}

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
    fallbackTill: palplussConfig.mpesaTillNumber,
    webhookEndpoint: '/api/payments/palpluss/webhook',
    totalLogs: palplussErrorLogs.length,
  });
});

/**
 * GET /api/payments/palpluss/logs
 * Returns detailed history of STK Push attempts, error codes, and diagnostics
 */
app.get('/api/payments/palpluss/logs', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    count: palplussErrorLogs.length,
    logs: palplussErrorLogs,
  });
});

/**
 * POST /api/payments/palpluss/clear-logs
 * Clears the diagnostics error log
 */
app.post('/api/payments/palpluss/clear-logs', (_req: Request, res: Response) => {
  palplussErrorLogs.length = 0;
  return res.status(200).json({
    success: true,
    message: 'PalPluss diagnostic logs cleared',
  });
});

/**
 * POST /api/payments/palpluss/ping
 * Actively checks network latency and responsiveness of the configured PalPluss API URL
 */
app.post('/api/payments/palpluss/ping', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const targetUrl = `${palplussConfig.apiUrl}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const pingRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': palplussConfig.apiKey ? `Bearer ${palplussConfig.apiKey}` : '',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const durationMs = Date.now() - startTime;
    const isOk = pingRes.status < 500;

    logPalPlussEvent({
      eventType: 'DIAGNOSTIC_PING',
      phone: 'SYSTEM_PROBE',
      amount: 0,
      orderNumber: 'PING_CHECK',
      reference: `PING-${Date.now()}`,
      httpStatus: pingRes.status,
      statusText: pingRes.statusText,
      durationMs,
      environment: palplussConfig.environment,
      remediation: isOk ? 'Gateway endpoint reachable.' : 'Gateway returned error response.',
    });

    return res.status(200).json({
      success: true,
      statusCode: pingRes.status,
      statusText: pingRes.statusText,
      durationMs,
      apiUrl: targetUrl,
      reachable: isOk,
    });
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';
    const errorMsg = isTimeout ? 'Gateway request timed out after 8000ms' : (err.message || 'Connection failed');

    logPalPlussEvent({
      eventType: 'DIAGNOSTIC_PING',
      phone: 'SYSTEM_PROBE',
      amount: 0,
      orderNumber: 'PING_CHECK',
      reference: `PING-${Date.now()}`,
      httpStatus: isTimeout ? 'TIMEOUT_504' : 'CONN_FAIL',
      errorCode: isTimeout ? 'ETIMEDOUT' : 'ECONNREFUSED',
      errorMessage: errorMsg,
      durationMs,
      environment: palplussConfig.environment,
      remediation: 'Check network connectivity or PalPluss API hostname configuration.',
    });

    return res.status(200).json({
      success: false,
      statusCode: isTimeout ? 504 : 0,
      error: errorMsg,
      durationMs,
      apiUrl: palplussConfig.apiUrl,
      reachable: false,
    });
  }
});

/**
 * POST /api/payments/palpluss/save-config
 * Update PalPluss credentials from Admin Dashboard
 */
app.post('/api/payments/palpluss/save-config', (req: Request, res: Response) => {
  const { apiKey, merchantId, apiUrl, environment, mpesaTillNumber } = req.body;
  if (apiKey !== undefined) palplussConfig.apiKey = apiKey.trim();
  if (merchantId !== undefined) palplussConfig.merchantId = merchantId.trim();
  if (apiUrl !== undefined) palplussConfig.apiUrl = apiUrl.trim();
  if (environment !== undefined) palplussConfig.environment = environment;
  if (mpesaTillNumber !== undefined) palplussConfig.mpesaTillNumber = mpesaTillNumber.trim();

  console.log(`[PalPluss Config] Updated. Mode: ${palplussConfig.environment}, Merchant: ${palplussConfig.merchantId || 'N/A'}`);
  return res.status(200).json({
    success: true,
    message: 'PalPluss M-Pesa gateway credentials updated successfully',
    config: {
      isConfigured: Boolean(palplussConfig.apiKey),
      merchantId: palplussConfig.merchantId,
      apiUrl: palplussConfig.apiUrl,
      environment: palplussConfig.environment,
      fallbackTill: palplussConfig.mpesaTillNumber,
    },
  });
});

/**
 * POST /api/payments/palpluss/stkpush
 * Initiates an M-Pesa STK Push via PalPluss API with detailed error logging & response code tracking.
 */
app.post('/api/payments/palpluss/stkpush', async (req: Request, res: Response) => {
  const startTime = Date.now();
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
        console.log(`[PalPluss Live STK] Request to ${palplussConfig.apiUrl}/stkpush for ${cleanPhone}...`);
        
        // Multi-compatibility payload for PalPluss / Daraja proxy
        const payload = {
          merchant_id: palplussConfig.merchantId,
          merchantId: palplussConfig.merchantId,
          phone: cleanPhone,
          phoneNumber: cleanPhone,
          msisdn: cleanPhone,
          amount: Number(amount),
          reference,
          accountReference: orderNumber,
          order_id: orderNumber,
          description: `BarKwetu Order #${orderNumber}`,
          transactionDesc: `BarKwetu #${orderNumber}`,
        };

        const liveResponse = await fetch(`${palplussConfig.apiUrl}/stkpush`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${palplussConfig.apiKey}`,
            'x-api-key': palplussConfig.apiKey,
          },
          body: JSON.stringify(payload),
        });

        const durationMs = Date.now() - startTime;
        const respText = await liveResponse.text();
        let liveData: any = {};
        try {
          liveData = JSON.parse(respText);
        } catch {
          liveData = { raw: respText };
        }

        if (liveResponse.ok && (liveData.success !== false && liveData.status !== 'FAILED')) {
          console.log('[PalPluss Live Response 200 OK]', liveData);
          
          logPalPlussEvent({
            eventType: 'STK_PUSH_SUCCESS',
            phone: cleanPhone,
            amount: Number(amount),
            orderNumber,
            reference,
            httpStatus: liveResponse.status,
            statusText: liveResponse.statusText,
            durationMs,
            environment: palplussConfig.environment,
            requestPayload: payload,
            rawResponse: liveData,
          });

          return res.status(200).json({
            success: true,
            reference,
            orderNumber,
            phone: cleanPhone,
            amount,
            checkoutRequestId: liveData.checkout_request_id || liveData.id || `ws_CO_${Date.now()}`,
            customerMessage: `STK Push prompt sent to ${cleanPhone}. Please enter your M-Pesa PIN on your phone.`,
            status: 'PENDING',
            liveMode: true,
            apiResponse: liveData,
            durationMs,
          });
        } else {
          // Failure response code from PalPluss / Daraja API
          const analysis = analyzePalPlussError(liveResponse.status, liveData);
          console.warn(`[PalPluss Error ${liveResponse.status}]`, analysis.errorMessage, liveData);

          const loggedError = logPalPlussEvent({
            eventType: 'STK_PUSH_FAILED',
            phone: cleanPhone,
            amount: Number(amount),
            orderNumber,
            reference,
            httpStatus: liveResponse.status,
            statusText: liveResponse.statusText,
            errorCode: analysis.errorCode,
            errorMessage: analysis.errorMessage,
            remediation: analysis.remediation,
            durationMs,
            environment: palplussConfig.environment,
            requestPayload: payload,
            rawResponse: liveData,
          });

          return res.status(200).json({
            success: false,
            reference,
            orderNumber,
            phone: cleanPhone,
            amount,
            customerMessage: `M-Pesa STK Prompt was rejected by gateway [HTTP ${liveResponse.status}: ${analysis.errorCode}]. You can complete payment instantly via Buy Goods Till 1661655.`,
            status: 'FAILED',
            liveMode: true,
            fallbackTill: palplussConfig.mpesaTillNumber,
            errorDetails: {
              httpStatus: liveResponse.status,
              errorCode: analysis.errorCode,
              errorMessage: analysis.errorMessage,
              remediation: analysis.remediation,
              logId: loggedError.id,
              rawResponse: liveData,
            },
          });
        }
      } catch (liveErr: any) {
        const durationMs = Date.now() - startTime;
        const analysis = analyzePalPlussError(0, { message: liveErr.message });
        console.warn('[PalPluss Live Connection Error]', liveErr);

        const loggedError = logPalPlussEvent({
          eventType: 'STK_PUSH_FAILED',
          phone: cleanPhone,
          amount: Number(amount),
          orderNumber,
          reference,
          httpStatus: 'CONN_FAIL',
          errorCode: liveErr.code || 'CONNECTION_ERROR',
          errorMessage: liveErr.message || 'Failed to connect to PalPluss API server',
          remediation: 'Check network connectivity or PalPluss server status. Pay via Till 1661655.',
          durationMs,
          environment: palplussConfig.environment,
          rawResponse: { error: liveErr.message, stack: liveErr.stack },
        });

        return res.status(200).json({
          success: false,
          reference,
          orderNumber,
          phone: cleanPhone,
          amount,
          customerMessage: `STK Push prompt could not connect to gateway. Please pay directly via Buy Goods Till 1661655.`,
          status: 'FAILED',
          liveMode: false,
          fallbackTill: palplussConfig.mpesaTillNumber,
          errorDetails: {
            httpStatus: 'CONN_FAIL',
            errorCode: liveErr.code || 'CONNECTION_ERROR',
            errorMessage: liveErr.message,
            remediation: analysis.remediation,
            logId: loggedError.id,
          },
        });
      }
    }

    // Default response when API Key is not yet set in Admin Dashboard
    const analysis = analyzePalPlussError(401, {
      message: 'PalPluss Live API Key not yet configured in Admin Portal.',
    });

    logPalPlussEvent({
      eventType: 'STK_PUSH_FAILED',
      phone: cleanPhone,
      amount: Number(amount),
      orderNumber,
      reference,
      httpStatus: 401,
      errorCode: 'API_KEY_MISSING',
      errorMessage: 'PalPluss Live API Key not yet configured in Admin Portal.',
      remediation: 'Enter your live PalPluss credentials in Admin Portal > PalPluss M-Pesa tab. In the meantime, use Till Number 1661655.',
      durationMs: Date.now() - startTime,
      environment: 'sandbox',
    });

    return res.status(200).json({
      success: true,
      reference,
      orderNumber,
      phone: cleanPhone,
      amount,
      checkoutRequestId: `ws_CO_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      customerMessage: `STK Push request initialized for ${cleanPhone}. If prompt does not appear, pay directly via Till 1661655.`,
      status: 'PENDING',
      liveMode: false,
      fallbackTill: palplussConfig.mpesaTillNumber,
      warning: 'Live PalPluss API credentials not yet configured in Admin Portal. Use Till Number 1661655 for instant checkout.',
      errorDetails: {
        httpStatus: 401,
        errorCode: 'API_KEY_MISSING',
        errorMessage: 'PalPluss Live API Key not yet configured in Admin Portal.',
        remediation: 'Enter your live PalPluss credentials in Admin Portal > PalPluss M-Pesa tab.',
      },
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
 * Helper endpoint for testing & immediate feedback
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

    logPalPlussEvent({
      eventType: 'STK_PUSH_SUCCESS',
      phone: transaction.phone,
      amount: transaction.amount,
      orderNumber: transaction.orderNumber,
      reference,
      httpStatus: 200,
      statusText: 'OK',
      durationMs: 0,
      environment: palplussConfig.environment,
      rawResponse: { receipt, status: 'SUCCESS' },
    });

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
  
  logPalPlussEvent({
    eventType: 'WEBHOOK_RECEIVED',
    phone: req.body.phone || 'WEBHOOK',
    amount: Number(amount) || 0,
    orderNumber: req.body.order_id || req.body.orderNumber || 'WEBHOOK',
    reference: reference || `WH-${Date.now()}`,
    httpStatus: 200,
    statusText: 'OK',
    rawResponse: req.body,
    environment: palplussConfig.environment,
  });

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
