import React, { useState, useRef, useEffect } from 'react';
import { AssetType, AssetData, TimeFrame } from './types';
import { MOCK_ASSETS as FALLBACK_ASSETS, TIMEFRAMES } from './constants';
import { FinancialChart } from './components/FinancialChart';
import { PerformanceTable } from './components/PerformanceTable';
import { AssetHeader } from './components/AssetHeader';
import { analyzeChartImage, fetchMarketData } from './services/geminiService';
import { 
  LayoutDashboard, 
  Coins, 
  Gem, 
  Bitcoin, 
  Upload, 
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const App: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<AssetType>(AssetType.SILVER);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>(TimeFrame.ONE_MONTH);
  
  // State for data management
  const [assetCache, setAssetCache] = useState<Record<string, AssetData>>({});
  const [customAsset, setCustomAsset] = useState<AssetData | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Real Data for Standard Assets
  useEffect(() => {
    if (selectedAsset === AssetType.CUSTOM) return;

    const fetchAsset = async () => {
      // If we already have valid data in cache, use it (unless it's very old, but simple cache is fine for now)
      if (assetCache[selectedAsset]) {
        return; 
      }

      setIsLoadingData(true);
      setError(null);

      try {
        const data = await fetchMarketData(selectedAsset);
        setAssetCache(prev => ({ ...prev, [selectedAsset]: data }));
      } catch (err) {
        console.error("Failed to fetch market data", err);
        // Don't set hard error, just log and maybe fallback will be used in render
        // But we should inform user if API key is missing
        if (!process.env.API_KEY) {
            setError("API Key is missing. Using offline fallback data.");
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchAsset();
  }, [selectedAsset, assetCache]);

  const handleRefresh = async () => {
    if (selectedAsset === AssetType.CUSTOM) return;
    
    setIsLoadingData(true);
    // Clear cache for this asset to force re-fetch
    setAssetCache(prev => {
        const newCache = { ...prev };
        delete newCache[selectedAsset];
        return newCache;
    });
    // The useEffect will trigger automatically because cache entry is gone? 
    // No, we need to explicitly call fetch because useEffect dep is [selectedAsset, assetCache]
    // Actually, removing from cache inside setAssetCache won't trigger the effect immediately with the *new* cache value in a way that guarantees fetch.
    // Better to just fetch directly:
    try {
        const data = await fetchMarketData(selectedAsset);
        setAssetCache(prev => ({ ...prev, [selectedAsset]: data }));
    } catch (err) {
        console.error("Refresh failed", err);
    } finally {
        setIsLoadingData(false);
    }
  };

  const handleAssetChange = (asset: AssetType) => {
    setSelectedAsset(asset);
    setError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setSelectedAsset(AssetType.CUSTOM);

    try {
      const result = await analyzeChartImage(file);
      setCustomAsset(result);
    } catch (err) {
      setError("Failed to analyze the chart. Please ensure the image is clear and try again. API Key might be invalid.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Determine what data to show
  let activeData: AssetData | null = null;
  let useFallback = false;

  if (selectedAsset === AssetType.CUSTOM) {
    activeData = customAsset;
  } else {
    activeData = assetCache[selectedAsset] || null;
    if (!activeData && !isLoadingData) {
        // If no data and not loading, use fallback
        activeData = FALLBACK_ASSETS[selectedAsset];
        useFallback = true;
    }
  }

  // Colors based on asset type
  const getAssetColor = (type: AssetType) => {
    switch (type) {
      case AssetType.GOLD: return "#fbbf24"; // Amber-400
      case AssetType.SILVER: return "#94a3b8"; // Slate-400
      case AssetType.BITCOIN: return "#f97316"; // Orange-500
      default: return "#0d9488"; // Teal-600
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="w-6 h-6 text-teal-400" />
            <span className="text-xl font-bold tracking-tight">FinVision AI</span>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          <button
            onClick={() => handleAssetChange(AssetType.SILVER)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              selectedAsset === AssetType.SILVER ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Gem className="w-5 h-5 text-slate-300" />
            <span className="font-medium">Silver</span>
          </button>
          
          <button
            onClick={() => handleAssetChange(AssetType.GOLD)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              selectedAsset === AssetType.GOLD ? 'bg-amber-900/50 text-amber-100 shadow-lg border border-amber-800' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="font-medium">Gold</span>
          </button>
          
          <button
            onClick={() => handleAssetChange(AssetType.BITCOIN)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              selectedAsset === AssetType.BITCOIN ? 'bg-orange-900/50 text-orange-100 shadow-lg border border-orange-800' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Bitcoin className="w-5 h-5 text-orange-500" />
            <span className="font-medium">Bitcoin</span>
          </button>

          <div className="pt-4 mt-4 border-t border-slate-800">
            <p className="px-4 text-xs text-slate-500 uppercase font-bold mb-2">AI Tools</p>
            <button
              onClick={selectedAsset === AssetType.CUSTOM && customAsset ? () => {} : triggerFileUpload}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                selectedAsset === AssetType.CUSTOM ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Analyze Chart</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload} 
            />
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10 min-h-[800px]">
          
          {/* Loading State for AI Analysis (Custom) */}
          {selectedAsset === AssetType.CUSTOM && isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-[600px] space-y-4 animate-pulse">
              <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
              <h3 className="text-xl font-semibold text-slate-700">Digitizing Chart Data...</h3>
              <p className="text-slate-500">Gemini is analyzing the trend lines and extracting data points.</p>
            </div>
          )}

          {/* Loading State for Market Data (Standard) */}
          {selectedAsset !== AssetType.CUSTOM && isLoadingData && !activeData && (
             <div className="flex flex-col items-center justify-center h-[600px] space-y-4">
               <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
               <p className="text-slate-500">Fetching live market data from Gemini...</p>
             </div>
          )}

          {/* Empty State for Custom */}
          {selectedAsset === AssetType.CUSTOM && !customAsset && !isAnalyzing && !error && (
            <div className="flex flex-col items-center justify-center h-[600px] space-y-6 text-center">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center">
                <Upload className="w-10 h-10 text-teal-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Upload a Financial Chart</h3>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">
                  Upload an image of any line chart. We'll use AI to digitize it, allowing you to interact with the data and see discrete performance metrics.
                </p>
              </div>
              <button 
                onClick={triggerFileUpload}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md transition-all"
              >
                Select Image
              </button>
            </div>
          )}

          {/* Error State */}
          {error && (
             <div className="flex flex-col items-center justify-center h-[200px] text-center space-y-4 bg-red-50 rounded-xl m-4 p-6 border border-red-100">
               <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Notice</h3>
               </div>
               <p className="text-slate-600 max-w-md text-sm">{error}</p>
               {selectedAsset === AssetType.CUSTOM && (
                 <button onClick={() => handleAssetChange(AssetType.SILVER)} className="text-teal-600 hover:underline text-sm">
                    Return to Dashboard
                 </button>
               )}
             </div>
          )}

          {/* Dashboard View */}
          {activeData && (!isAnalyzing || selectedAsset !== AssetType.CUSTOM) && (
            <div className="animate-fade-in relative">
              {/* Top Actions */}
              <div className="absolute top-0 right-0">
                 {selectedAsset !== AssetType.CUSTOM && (
                     <button 
                        onClick={handleRefresh}
                        disabled={isLoadingData}
                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-slate-50 rounded-full transition-all"
                        title="Refresh Data"
                     >
                         <RefreshCw className={`w-5 h-5 ${isLoadingData ? 'animate-spin' : ''}`} />
                     </button>
                 )}
              </div>

              {useFallback && (
                  <div className="mb-4 p-3 bg-amber-50 text-amber-700 text-sm rounded-lg border border-amber-200 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Using offline fallback data. API Key may be missing or request failed.
                  </div>
              )}

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <AssetHeader asset={activeData} />
                
                {/* Timeframe Selector (Visual Only for now as data is static/fetched once) */}
                <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-lg">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setSelectedTimeFrame(tf)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        selectedTimeFrame === tf
                          ? 'bg-white text-slate-800 shadow-sm border border-gray-200'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <FinancialChart 
                data={activeData.data} 
                color={selectedAsset === AssetType.CUSTOM ? "#0d9488" : getAssetColor(selectedAsset)} 
              />
              
              <PerformanceTable 
                data={activeData.performance} 
                sources={activeData.sources}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;