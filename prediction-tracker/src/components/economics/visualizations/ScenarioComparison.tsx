'use client';

import { useMemo } from 'react';
import { AICapabilityModel } from '@/types/economics/ai';
import { projectTimeSeriesOutcome } from '@/utils/economics/economics';
import { formatNumberForDisplay } from '@/utils/economics/visualization';
import { SCENARIOS } from '@/components/economics/controls/ScenarioPresets';

interface ScenarioComparisonProps {
  aiCapabilities: AICapabilityModel;
}

export default function ScenarioComparison({ aiCapabilities }: ScenarioComparisonProps) {
  const comparison = useMemo(() => {
    const years = [2025, 2028, 2030];
    const results: Record<string, {
      name: string;
      color: string;
      employment2025: number;
      employment2028: number;
      employment2030: number;
      wage2025: number;
      wage2028: number;
      wage2030: number;
      employment3yrChange: number;
      employment5yrChange: number;
      wage3yrChange: number;
      wage5yrChange: number;
    }> = {};
    
    Object.entries(SCENARIOS).forEach(([key, scenario]) => {
      const outcomes = projectTimeSeriesOutcome(scenario.params, aiCapabilities, years);
      results[key] = {
        name: scenario.name,
        color: scenario.color,
        employment2025: outcomes[0].employment,
        employment2028: outcomes[1].employment,
        employment2030: outcomes[2].employment,
        wage2025: outcomes[0].averageWage,
        wage2028: outcomes[1].averageWage,
        wage2030: outcomes[2].averageWage,
        employment3yrChange: ((outcomes[1].employment - outcomes[0].employment) / outcomes[0].employment) * 100,
        employment5yrChange: ((outcomes[2].employment - outcomes[0].employment) / outcomes[0].employment) * 100,
        wage3yrChange: ((outcomes[1].averageWage - outcomes[0].averageWage) / outcomes[0].averageWage) * 100,
        wage5yrChange: ((outcomes[2].averageWage - outcomes[0].averageWage) / outcomes[0].averageWage) * 100,
      };
    });
    
    return results;
  }, [aiCapabilities]);

  const getChangeColor = (value: number) => {
    if (value > 10) return 'text-green-700 bg-green-100';
    if (value > 0) return 'text-green-600 bg-green-50';
    if (value > -10) return 'text-orange-600 bg-orange-50';
    return 'text-red-700 bg-red-100';
  };

  const scenarios = Object.entries(comparison);
  const employmentChanges3yr = scenarios.map(([, data]) => data.employment3yrChange);
  const employmentChanges5yr = scenarios.map(([, data]) => data.employment5yrChange);
  const wageChanges5yr = scenarios.map(([, data]) => data.wage5yrChange);
  
  const employmentRange3yr = Math.max(...employmentChanges3yr) - Math.min(...employmentChanges3yr);
  const employmentRange5yr = Math.max(...employmentChanges5yr) - Math.min(...employmentChanges5yr);
  const wageRange5yr = Math.max(...wageChanges5yr) - Math.min(...wageChanges5yr);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Scenario Comparison
        </h3>
        <p className="text-sm text-gray-600">
          See how different assumptions lead to dramatically different outcomes
        </p>
      </div>

      {/* Impact Range Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-sm font-medium text-blue-600 mb-1">3-Year Employment Range</div>
          <div className="text-2xl font-bold text-blue-800">
            {employmentRange3yr.toFixed(1)}%
          </div>
          <div className="text-xs text-blue-600">
            {Math.min(...employmentChanges3yr).toFixed(1)}% to {Math.max(...employmentChanges3yr).toFixed(1)}%
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-sm font-medium text-green-600 mb-1">5-Year Employment Range</div>
          <div className="text-2xl font-bold text-green-800">
            {employmentRange5yr.toFixed(1)}%
          </div>
          <div className="text-xs text-green-600">
            {Math.min(...employmentChanges5yr).toFixed(1)}% to {Math.max(...employmentChanges5yr).toFixed(1)}%
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-sm font-medium text-purple-600 mb-1">5-Year Wage Range</div>
          <div className="text-2xl font-bold text-purple-800">
            {wageRange5yr.toFixed(1)}%
          </div>
          <div className="text-xs text-purple-600">
            {Math.min(...wageChanges5yr).toFixed(1)}% to {Math.max(...wageChanges5yr).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-700">Scenario</th>
              <th className="text-center py-3 px-2 font-medium text-gray-700">3-Year Employment</th>
              <th className="text-center py-3 px-2 font-medium text-gray-700">5-Year Employment</th>
              <th className="text-center py-3 px-2 font-medium text-gray-700">5-Year Wages</th>
              <th className="text-center py-3 px-2 font-medium text-gray-700">2030 Jobs</th>
              <th className="text-center py-3 px-2 font-medium text-gray-700">2030 Salary</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map(([key, data]) => (
              <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${data.color}`}></div>
                    <span className="font-medium">{data.name}</span>
                  </div>
                </td>
                <td className="text-center py-3 px-2">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getChangeColor(data.employment3yrChange)}`}>
                    {data.employment3yrChange >= 0 ? '+' : ''}{data.employment3yrChange.toFixed(1)}%
                  </span>
                </td>
                <td className="text-center py-3 px-2">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getChangeColor(data.employment5yrChange)}`}>
                    {data.employment5yrChange >= 0 ? '+' : ''}{data.employment5yrChange.toFixed(1)}%
                  </span>
                </td>
                <td className="text-center py-3 px-2">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getChangeColor(data.wage5yrChange)}`}>
                    {data.wage5yrChange >= 0 ? '+' : ''}{data.wage5yrChange.toFixed(1)}%
                  </span>
                </td>
                <td className="text-center py-3 px-2 text-gray-700">
                  {formatNumberForDisplay(data.employment2030, 'compact')}
                </td>
                <td className="text-center py-3 px-2 text-gray-700">
                  {formatNumberForDisplay(data.wage2030, 'currency')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Key Insights */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Worst Case Scenario</h4>
          <div className="text-sm text-red-700">
            <p className="mb-1">
              <strong>AI Displacement:</strong> Could result in {Math.min(...employmentChanges5yr).toFixed(1)}% 
              employment decline by 2030
            </p>
            <p>
              High substitution rates + limited new roles + economic headwinds = significant job losses
            </p>
          </div>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="text-sm font-semibold text-green-800 mb-2">Best Case Scenario</h4>
          <div className="text-sm text-green-700">
            <p className="mb-1">
              <strong>AI Optimist:</strong> Could result in {Math.max(...employmentChanges5yr).toFixed(1)}% 
              employment growth by 2030
            </p>
            <p>
              High productivity + strong new role creation + favorable conditions = job growth
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>Why scenarios matter:</strong> The {employmentRange5yr.toFixed(0)}% employment range 
          represents millions of jobs difference. Small changes in AI adoption speed, policy responses, 
          and economic conditions create vastly different outcomes.
        </p>
      </div>
    </div>
  );
}