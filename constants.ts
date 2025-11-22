import { AssetData, AssetType, TimeFrame } from './types';

// Helper to generate synthetic market data
const generateTrend = (startValue: number, volatility: number, trend: number, points: number): any[] => {
  let currentValue = startValue;
  const data = [];
  const now = new Date();
  
  for (let i = points; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i); // Daily points
    
    const change = (Math.random() - 0.5) * volatility + trend;
    currentValue = currentValue * (1 + change);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: parseFloat(currentValue.toFixed(2))
    });
  }
  return data;
};

export const MOCK_ASSETS: Record<string, AssetData> = {
  [AssetType.SILVER]: {
    id: 'silver',
    name: 'Silver (XAG/USD)',
    currentValue: '28.45',
    percentageChange: 1.24,
    currency: '$',
    data: generateTrend(22, 0.02, 0.001, 90), // Rising trend
    performance: [
      { period: 'Oct 2020 - Oct 2021', value: -4.5, formattedValue: '-4.50%' },
      { period: 'Oct 2021 - Oct 2022', value: -12.3, formattedValue: '-12.30%' },
      { period: 'Oct 2022 - Oct 2023', value: 18.2, formattedValue: '+18.20%' },
      { period: 'Oct 2023 - Oct 2024', value: 32.5, formattedValue: '+32.50%' },
      { period: 'Oct 2024 - Present', value: 5.1, formattedValue: '+5.10%' },
    ]
  },
  [AssetType.GOLD]: {
    id: 'gold',
    name: 'Gold (XAU/USD)',
    currentValue: '2,345.10',
    percentageChange: 0.45,
    currency: '$',
    data: generateTrend(2000, 0.01, 0.0005, 90), // Stable rise
    performance: [
      { period: 'Oct 2020 - Oct 2021', value: 2.1, formattedValue: '+2.10%' },
      { period: 'Oct 2021 - Oct 2022', value: -3.4, formattedValue: '-3.40%' },
      { period: 'Oct 2022 - Oct 2023', value: 12.5, formattedValue: '+12.50%' },
      { period: 'Oct 2023 - Oct 2024', value: 15.8, formattedValue: '+15.80%' },
      { period: 'Oct 2024 - Present', value: 8.4, formattedValue: '+8.40%' },
    ]
  },
  [AssetType.BITCOIN]: {
    id: 'bitcoin',
    name: 'Bitcoin (BTC/USD)',
    currentValue: '67,890.00',
    percentageChange: -2.15,
    currency: '$',
    data: generateTrend(55000, 0.04, 0.002, 90), // Volatile rise
    performance: [
      { period: 'Oct 2020 - Oct 2021', value: 340.5, formattedValue: '+340.50%' },
      { period: 'Oct 2021 - Oct 2022', value: -55.2, formattedValue: '-55.20%' },
      { period: 'Oct 2022 - Oct 2023', value: 85.6, formattedValue: '+85.60%' },
      { period: 'Oct 2023 - Oct 2024', value: 120.4, formattedValue: '+120.40%' },
      { period: 'Oct 2024 - Present', value: 12.1, formattedValue: '+12.10%' },
    ]
  }
};

export const TIMEFRAMES = Object.values(TimeFrame);