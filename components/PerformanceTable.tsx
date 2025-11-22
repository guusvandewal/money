import React from 'react';
import { DiscretePerformance, Source } from '../types';
import { ExternalLink } from 'lucide-react';

interface PerformanceTableProps {
  data: DiscretePerformance[];
  sources?: Source[];
}

export const PerformanceTable: React.FC<PerformanceTableProps> = ({ data, sources }) => {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-slate-900 mb-4">Discrete Performance</h3>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Period
              </th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                Total Return
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                  {item.period}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${item.value >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                  {item.formattedValue}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
                <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-gray-400 text-sm">No performance data available</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="text-xs text-gray-400">
          {sources && sources.length > 0 ? "Sources: " : "Source: DWS / Internal Data. Past performance is not a reliable indicator of future returns."}
        </div>
        
        {sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sources.slice(0, 5).map((source, idx) => (
              <a 
                key={idx}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-600 hover:bg-gray-200 hover:text-teal-700 transition-colors truncate max-w-[200px]"
                title={source.title}
              >
                <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{source.title || new URL(source.uri).hostname}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};