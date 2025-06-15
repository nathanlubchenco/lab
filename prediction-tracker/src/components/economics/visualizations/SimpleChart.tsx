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
  const analysis = useMemo(() => {
    const years = Array.from({ length:11 }, (_, i) => 2024 + i);
    const outcomes = projectTimeSeriesOutcome(parameters, aiCapabilities, years);
    const projections = years.map((year, i) => ({
      year,
      employment: outcomes[i].employment,
      wage: outcomes[i].averageWage,
      unemployment: outcomes[i].unemploymentRate,
    }));

    // Focus on 3-5 year timeline
    const currentYear = projections[0];
    const midTerm = projections[5]; // 2029 (5 years)
    const nearTerm = projections[3]; // 2027 (3 years)
    
    // Calculate key insights
    const employmentGrowth3yr = ((nearTerm.employment - currentYear.employment) / currentYear.employment) * 100;
    const employmentGrowth5yr = ((midTerm.employment - currentYear.employment) / currentYear.employment) * 100;
    const wageGrowth3yr = ((nearTerm.wage - currentYear.wage) / currentYear.wage) * 100;
    const wageGrowth5yr = ((midTerm.wage - currentYear.wage) / currentYear.wage) * 100;

    // Determine AI impact scenario
    const avgSubstitution = Object.values(parameters.aiSubstitutionByRole).reduce((a, b) => a + b, 0) / 
                           Object.values(parameters.aiSubstitutionByRole).length;
    const newAIRoles = Object.values(parameters.aiComplementaryRoles).reduce((a, b) => a + b, 0);

    let scenario = 'Balanced';
    if (avgSubstitution > 40 && newAIRoles < 15000) scenario = 'AI-Heavy Disruption';
    else if (avgSubstitution < 25 && parameters.aiProductivityGain > 40) scenario = 'AI-Augmented Growth';
    else if (newAIRoles > 20000) scenario = 'AI-Complementary Boom';

    return {
      projections,
      currentYear,
      nearTerm,
      midTerm,
      employmentGrowth3yr,
      employmentGrowth5yr,
      wageGrowth3yr,
      wageGrowth5yr,
      scenario,
      avgSubstitution,
      newAIRoles
    };
  }, [parameters, aiCapabilities]);

  return (
    <div className="space-y-6">
      {/* Hero Impact Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            AI Impact on Software Engineering (2024-2029)
          </h3>
          <div className="inline-block px-4 py-2 bg-white rounded-full shadow-sm">
            <span className="text-sm font-medium text-gray-600">Scenario: </span>
            <span className="text-sm font-bold text-indigo-600">{analysis.scenario}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              Employment Impact
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">3-Year Change:</span>
                <span className={`text-lg font-bold ${analysis.employmentGrowth3yr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.employmentGrowth3yr >= 0 ? '+' : ''}{analysis.employmentGrowth3yr.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">5-Year Change:</span>
                <span className={`text-lg font-bold ${analysis.employmentGrowth5yr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.employmentGrowth5yr >= 0 ? '+' : ''}{analysis.employmentGrowth5yr.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {formatNumberForDisplay(analysis.currentYear.employment, 'compact')} → {formatNumberForDisplay(analysis.midTerm.employment, 'compact')} jobs
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Salary Impact
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">3-Year Change:</span>
                <span className={`text-lg font-bold ${analysis.wageGrowth3yr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.wageGrowth3yr >= 0 ? '+' : ''}{analysis.wageGrowth3yr.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">5-Year Change:</span>
                <span className={`text-lg font-bold ${analysis.wageGrowth5yr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.wageGrowth5yr >= 0 ? '+' : ''}{analysis.wageGrowth5yr.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {formatNumberForDisplay(analysis.currentYear.wage, 'currency')} → {formatNumberForDisplay(analysis.midTerm.wage, 'currency')} avg.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Drivers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Key Impact Drivers</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-2">AI Substitution</div>
            <div className="text-2xl font-bold text-red-600 mb-1">
              {analysis.avgSubstitution.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Average across roles</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-2">Productivity Gain</div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {parameters.aiProductivityGain}%
            </div>
            <div className="text-xs text-gray-500">From AI tools</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600 mb-2">New AI Roles</div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {formatNumberForDisplay(analysis.newAIRoles, 'compact')}
            </div>
            <div className="text-xs text-gray-500">Jobs created</div>
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Employment Timeline</h4>
        <div className="space-y-3">
          {analysis.projections.slice(0, 6).map((p, i) => {
            const isKeyYear = i === 0 || i === 3 || i === 5;
            return (
              <div key={p.year} className={`flex justify-between items-center py-2 ${isKeyYear ? 'bg-blue-50 px-3 rounded' : ''}`}>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium ${isKeyYear ? 'text-blue-700' : 'text-gray-600'}`}>
                    {p.year}
                  </span>
                  {isKeyYear && (
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                      {i === 0 ? 'Current' : i === 3 ? '3-Year' : '5-Year'}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="bg-blue-500 h-2 rounded"
                      style={{ 
                        width: `${(p.employment / Math.max(...analysis.projections.map(pr => pr.employment))) * 80}px` 
                      }}
                    />
                    <span className="text-sm font-medium w-16 text-right">
                      {formatNumberForDisplay(p.employment, 'compact')}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 w-20 text-right">
                    {formatNumberForDisplay(p.wage, 'currency')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}