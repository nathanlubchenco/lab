'use client';

import { useMemo } from 'react';
import { EconomicParams } from '@/types/economics/economic';
import { AICapabilityModel } from '@/types/economics/ai';
import { projectTimeSeriesOutcome } from '@/utils/economics/economics';
import { formatNumberForDisplay } from '@/utils/economics/visualization';

interface SimpleChartProps {
  parameters: EconomicParams;
  aiCapabilities: AICapabilityModel;
}

export default function SimpleChart({ parameters, aiCapabilities }: SimpleChartProps) {
  const projections = useMemo(() => {
    const years = Array.from({ length: 11 }, (_, i) => 2024 + i);
    const outcomes = projectTimeSeriesOutcome(parameters, aiCapabilities, years);
    return years.map((year, i) => ({
      year,
      employment: outcomes[i].employment,
      wage: outcomes[i].averageWage,
      unemployment: outcomes[i].unemploymentRate,
    }));
  }, [parameters, aiCapabilities]);

  const currentYear = projections[0];
  const futureYear = projections[10];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Employment & Salary Projections (2024-2034)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-medium text-gray-700 mb-3">Employment Trend</h4>
            <div className="space-y-2">
              {projections.map((p, i) => (
                <div key={p.year} className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">{p.year}</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="bg-blue-500 h-2 rounded"
                      style={{ 
                        width: `${(p.employment / Math.max(...projections.map(pr => pr.employment))) * 100}px` 
                      }}
                    />
                    <span className="text-sm font-medium">
                      {formatNumberForDisplay(p.employment, 'compact')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-gray-700 mb-3">Salary Trend</h4>
            <div className="space-y-2">
              {projections.map((p, i) => (
                <div key={p.year} className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">{p.year}</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="bg-green-500 h-2 rounded"
                      style={{ 
                        width: `${((p.wage - Math.min(...projections.map(pr => pr.wage))) / 
                                 (Math.max(...projections.map(pr => pr.wage)) - Math.min(...projections.map(pr => pr.wage)))) * 100}px` 
                      }}
                    />
                    <span className="text-sm font-medium">
                      {formatNumberForDisplay(p.wage, 'currency')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-blue-600 font-medium">Current Employment</div>
          <div className="text-xl font-bold text-blue-900">
            {formatNumberForDisplay(currentYear.employment, 'compact')}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-green-600 font-medium">2034 Employment</div>
          <div className="text-xl font-bold text-green-900">
            {formatNumberForDisplay(futureYear.employment, 'compact')}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-purple-600 font-medium">Current Salary</div>
          <div className="text-xl font-bold text-purple-900">
            {formatNumberForDisplay(currentYear.wage, 'currency')}
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-orange-600 font-medium">2034 Salary</div>
          <div className="text-xl font-bold text-orange-900">
            {formatNumberForDisplay(futureYear.wage, 'currency')}
          </div>
        </div>
      </div>
    </div>
  );
}