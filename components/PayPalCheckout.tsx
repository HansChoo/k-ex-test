import React, { useEffect, useRef, useState } from 'react';
import { loadPayPalScript, createPayPalOrder, capturePayPalOrder } from '../services/paypalService';

interface PayPalCheckoutProps {
  amount: number;
  description: string;
  items?: { name: string; price: number; quantity: number }[];
  onSuccess: (details: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
  disabled?: boolean;
  language?: string;
}

export const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({
  amount, description, items, onSuccess, onError, onCancel, disabled, language = 'ko'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const renderedRef = useRef(false);
  const isKo = language === 'ko';

  useEffect(() => {
    if (disabled || renderedRef.current) return;

    let cancelled = false;

    const initPayPal = async () => {
      try {
        setLoading(true);
        setError(null);
        await loadPayPalScript();

        if (cancelled || !containerRef.current) return;

        const paypal = (window as any).paypal;
        if (!paypal) {
          setError(isKo ? 'PayPal을 불러올 수 없습니다.' : 'Could not load PayPal.');
          return;
        }

        containerRef.current.innerHTML = '';

        paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            height: 45,
          },
          createOrder: async () => {
            const order = await createPayPalOrder(amount, description, items);
            return order.id;
          },
          onApprove: async (data: any) => {
            try {
              const details = await capturePayPalOrder(data.orderID);
              onSuccess(details);
            } catch (err) {
              if (onError) onError(err);
            }
          },
          onCancel: () => {
            if (onCancel) onCancel();
          },
          onError: (err: any) => {
            console.error('PayPal error:', err);
            if (onError) onError(err);
          },
        }).render(containerRef.current);

        renderedRef.current = true;
        setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          console.error('PayPal init error:', err);
          setError(err.message || (isKo ? 'PayPal 초기화 오류' : 'PayPal initialization error'));
          setLoading(false);
        }
      }
    };

    initPayPal();

    return () => { cancelled = true; };
  }, [amount, description, disabled]);

  if (disabled) return null;

  return (
    <div className="w-full">
      {loading && !error && (
        <div className="flex items-center justify-center py-4 bg-gray-50 rounded-xl">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span className="text-sm text-gray-500">{isKo ? 'PayPal 결제 준비 중...' : 'Loading PayPal...'}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-600 text-sm font-bold">{error}</p>
          <button onClick={() => { renderedRef.current = false; setError(null); setLoading(true); }} className="mt-2 text-xs text-blue-600 underline">{isKo ? '다시 시도' : 'Retry'}</button>
        </div>
      )}
      <div ref={containerRef} className={loading || error ? 'hidden' : ''}></div>
    </div>
  );
};
