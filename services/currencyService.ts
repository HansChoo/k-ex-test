
export const fetchExchangeRates = async () => {
    try {
        // 실제 API 연동 시 fetch('https://api.exchangerate-api.com/v4/latest/KRW') 사용 가능
        // 현재는 안정성을 위해 최신 고정 환율로 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return {
            USD: 0.00075,
            JPY: 0.11,
            CNY: 0.0053,
            timestamp: Date.now()
        };
    } catch (error) {
        console.error("Failed to fetch rates", error);
        return { USD: 0.00075, JPY: 0.11, CNY: 0.0054 };
    }
};
