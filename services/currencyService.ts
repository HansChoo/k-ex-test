
export const fetchExchangeRates = async (): Promise<{ USD: number; JPY: number; CNY: number }> => {
    const fallback = { USD: 0.00075, JPY: 0.11, CNY: 0.0054 };

    try {
        const res = await fetch('/api/exchange-rate');
        if (res.ok) {
            const data = await res.json();
            if (data.rates && data.rates.USD > 0) {
                return {
                    USD: data.rates.USD,
                    JPY: data.rates.JPY || fallback.JPY,
                    CNY: data.rates.CNY || fallback.CNY,
                };
            }
        }
    } catch (e) {
        console.error('Failed to fetch exchange rates from server:', e);
    }

    try {
        const res = await fetch('https://api.frankfurter.dev/v1/latest?base=KRW&symbols=USD,JPY,CNY');
        if (res.ok) {
            const data = await res.json();
            if (data.rates?.USD) {
                return {
                    USD: data.rates.USD,
                    JPY: data.rates.JPY || fallback.JPY,
                    CNY: data.rates.CNY || fallback.CNY,
                };
            }
        }
    } catch (e) {
        console.error('Frankfurter direct fallback failed:', e);
    }

    return fallback;
};
