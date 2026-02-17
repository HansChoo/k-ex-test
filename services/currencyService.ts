
// Fetch real-time exchange rates (Base: KRW)
// Using a free API endpoint simulation or placeholder for stability
export const fetchExchangeRates = async () => {
    try {
        // In a real production environment, you would fetch from an API like:
        // const response = await fetch('https://api.exchangerate-api.com/v4/latest/KRW');
        // const data = await response.json();
        // return data.rates;

        // Simulating async network request for demo purposes to avoid API key limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            USD: 0.00076, // Updated rough estimate
            JPY: 0.112,   // Updated rough estimate
            CNY: 0.0052   // Updated rough estimate
        };
    } catch (error) {
        console.error("Failed to fetch rates", error);
        return { USD: 0.00075, JPY: 0.11, CNY: 0.0054 };
    }
};
