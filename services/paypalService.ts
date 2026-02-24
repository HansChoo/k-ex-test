let paypalScriptLoaded = false;
let paypalScriptLoading = false;
let loadCallbacks: (() => void)[] = [];

export async function loadPayPalScript(): Promise<void> {
  if (paypalScriptLoaded && (window as any).paypal) return;
  if (paypalScriptLoading) {
    return new Promise((resolve) => { loadCallbacks.push(resolve); });
  }

  paypalScriptLoading = true;

  try {
    const res = await fetch('/api/paypal/client-id');
    const { clientId } = await res.json();
    if (!clientId) throw new Error('PayPal Client ID not configured');

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
      script.onload = () => {
        paypalScriptLoaded = true;
        paypalScriptLoading = false;
        resolve();
        loadCallbacks.forEach(cb => cb());
        loadCallbacks = [];
      };
      script.onerror = () => {
        paypalScriptLoading = false;
        reject(new Error('Failed to load PayPal SDK'));
      };
      document.head.appendChild(script);
    });
  } catch (err) {
    paypalScriptLoading = false;
    throw err;
  }
}

let cachedExchangeRate: { rate: number; updatedAt: string } | null = null;
let ratePromise: Promise<number> | null = null;

export async function getExchangeRate(): Promise<number> {
  if (cachedExchangeRate) return cachedExchangeRate.rate;
  if (ratePromise) return ratePromise;

  ratePromise = (async () => {
    try {
      const res = await fetch('/api/exchange-rate');
      if (res.ok) {
        const data = await res.json();
        cachedExchangeRate = { rate: data.rate, updatedAt: data.updatedAt };
        setTimeout(() => { cachedExchangeRate = null; }, 30 * 60 * 1000);
        return data.rate;
      }
    } catch (e) {}
    return 1 / 1400;
  })();

  const result = await ratePromise;
  ratePromise = null;
  return result;
}

export function krwToUsd(krw: number, rate: number): number {
  return Number((krw * rate).toFixed(2));
}

export async function createPayPalOrder(amount: number, description: string, items?: { name: string; price: number; quantity: number }[]) {
  const res = await fetch('/api/paypal/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency: 'USD', description, items }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to create PayPal order');
  }
  return res.json();
}

export async function capturePayPalOrder(orderId: string) {
  const res = await fetch('/api/paypal/capture-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to capture PayPal order');
  }
  return res.json();
}
