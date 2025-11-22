export enum TimeFrame {
  ONE_MONTH = '1M',
  THREE_MONTHS = '3M',
  SIX_MONTHS = '6M',
  YTD = 'YTD',
  ONE_YEAR = '1Y',
  THREE_YEARS = '3Y',
  FIVE_YEARS = '5Y',
  MAX = 'MAX'
}

export interface DataPoint {
  date: string;
  value: number;
}

export interface DiscretePerformance {
  period: string;
  value: number;
  formattedValue: string;
}

export interface Source {
  title?: string;
  uri: string;
}

export interface AssetData {
  id: string;
  name: string;
  currentValue: string;
  percentageChange: number;
  data: DataPoint[];
  performance: DiscretePerformance[];
  currency: string;
  sources?: Source[];
}

export enum AssetType {
  SILVER = 'Silver',
  GOLD = 'Gold',
  BITCOIN = 'Bitcoin',
  CUSTOM = 'Custom'
}