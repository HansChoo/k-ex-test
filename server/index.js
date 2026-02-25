import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_BASE = 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

app.post('/api/paypal/create-order', async (req, res) => {
  try {
    const { amount, currency = 'USD', description = 'K-Experience Booking', items } = req.body;
    const accessToken = await getAccessToken();

    const orderItems = items?.map(item => ({
      name: item.name?.substring(0, 127) || 'K-Experience Item',
      quantity: String(item.quantity || 1),
      unit_amount: { currency_code: currency, value: String(Number(item.price).toFixed(2)) },
    })) || [];

    const itemTotal = orderItems.length > 0
      ? orderItems.reduce((sum, i) => sum + (Number(i.unit_amount.value) * Number(i.quantity)), 0).toFixed(2)
      : Number(amount).toFixed(2);

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        description: description.substring(0, 127),
        amount: {
          currency_code: currency,
          value: itemTotal,
          ...(orderItems.length > 0 ? {
            breakdown: {
              item_total: { currency_code: currency, value: itemTotal }
            }
          } : {}),
        },
        ...(orderItems.length > 0 ? { items: orderItems } : {}),
      }],
    };

    const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    const order = await response.json();
    if (!response.ok) {
      console.error('PayPal create order error:', JSON.stringify(order));
      return res.status(response.status).json({ error: order });
    }
    res.json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.post('/api/paypal/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('PayPal capture error:', JSON.stringify(data));
      return res.status(response.status).json({ error: data });
    }
    res.json(data);
  } catch (err) {
    console.error('Capture order error:', err);
    res.status(500).json({ error: 'Failed to capture order' });
  }
});

app.get('/api/paypal/client-id', (req, res) => {
  res.json({ clientId: PAYPAL_CLIENT_ID });
});

let cachedRates = { rates: { USD: 0.00075, JPY: 0.11, CNY: 0.0054 }, timestamp: 0 };
const CACHE_DURATION = 60 * 60 * 1000;

app.get('/api/exchange-rate', async (req, res) => {
  try {
    if (Date.now() - cachedRates.timestamp < CACHE_DURATION && cachedRates.rates.USD) {
      return res.json({ rate: cachedRates.rates.USD, rates: cachedRates.rates, cached: true, updatedAt: new Date(cachedRates.timestamp).toISOString() });
    }

    let rates = null;
    try {
      const r = await fetch('https://api.frankfurter.dev/v1/latest?base=KRW&symbols=USD,JPY,CNY');
      if (r.ok) {
        const data = await r.json();
        if (data.rates?.USD) {
          rates = { USD: data.rates.USD, JPY: data.rates.JPY, CNY: data.rates.CNY };
        }
      }
    } catch (e) {
      console.error('Frankfurter API error:', e.message);
    }

    if (!rates) {
      try {
        const r = await fetch('https://latest.currency-api.pages.dev/v1/currencies/krw.json');
        if (r.ok) {
          const data = await r.json();
          if (data.krw?.usd) {
            rates = { USD: data.krw.usd, JPY: data.krw.jpy, CNY: data.krw.cny };
          }
        }
      } catch (e) {
        console.error('Backup API error:', e.message);
      }
    }

    if (rates && rates.USD > 0) {
      cachedRates = { rates, timestamp: Date.now() };
      res.json({ rate: rates.USD, rates, cached: false, updatedAt: new Date().toISOString() });
    } else {
      res.json({ rate: cachedRates.rates.USD, rates: cachedRates.rates, cached: true, fallback: true, updatedAt: new Date(cachedRates.timestamp || Date.now()).toISOString() });
    }
  } catch (err) {
    console.error('Exchange rate error:', err);
    res.json({ rate: cachedRates.rates.USD, rates: cachedRates.rates, cached: true, fallback: true });
  }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`PayPal API server running on port ${PORT}`);
});
