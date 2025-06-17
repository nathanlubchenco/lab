'use client';

import { useMemo } from 'react';
import { EconomicParams } from '@/types/economics/economic';
import { AICapabilityModel } from '@/types/economics/ai';
import { projectTimeSeriesOutcome } from '@/utils/economics/economics';
import { formatNumberForDisplay } from '@/utils/economics/visualization';

interface MonteCarloAnalysisProps {
  parameters: EconomicParams;
  aiCapabilities: AICapabilityModel;
}

// Generate parameter variations for Monte Carlo simulation
function generateParameterVariations(baseParams: EconomicParams, numSamples: number = 500) {
  const variations = [];
  
  for (let i = 0; i < numSamples; i++) {
    const variation = { ...baseParams };
    
    // Add realistic uncertainty to key parameters
    variation.aiProductivityGain = Math.max(0, baseParams.aiProductivityGain + (Math.random() - 0.5) * 40);
    
    // Vary substitution rates with correlation (if one role is more affected, others likely are too)
    const globalSubstitutionMultiplier = 0.7 + Math.random() * 0.6; // 0.7x to 1.3x
    Object.keys(variation.aiSubstitutionByRole).forEach(role => {
      const roleKey = role as keyof typeof variation.aiSubstitutionByRole;
      const baseValue = baseParams.aiSubstitutionByRole[roleKey];
      variation.aiSubstitutionByRole[roleKey] = Math.max(
        -20, 
        Math.min(80, baseValue * globalSubstitutionMultiplier + (Math.random() - 0.5) * 15)
      );
    });
    
    // Vary complementary roles
    const aiHypeMultiplier = 0.5 + Math.random() * 1.0; // 0.5x to 1.5x
    Object.keys(variation.aiComplementaryRoles).forEach(role => {
      const roleKey = role as keyof typeof variation.aiComplementaryRoles;
      const baseValue = baseParams.aiComplementaryRoles[roleKey];
      variation.aiComplementaryRoles[roleKey] = Math.max(
        0,
        baseValue * aiHypeMultiplier + (Math.random() - 0.5) * baseValue * 0.3
      );
    });
    
    // Economic uncertainty
    variation.gdpGrowth = baseParams.gdpGrowth + (Math.random() - 0.5) * 2.0;
    variation.interestRates = Math.max(0, baseParams.interestRates + (Math.random() - 0.5) * 2.0);
    variation.ventureCapitalAvailability = Math.max(0.2, baseParams.ventureCapitalAvailability + (Math.random() - 0.5) * 0.6);
    
    variations.push(variation);
  }
  
  return variations;
}

export default function MonteCarloAnalysis({ parameters, aiCapabilities }: MonteCarloAnalysisProps) {
  const analysis = useMemo(() => {
    const variations = generateParameterVariations(parameters, 300);
    const years = [2025, 2028, 2030]; // Focus on key years
    
    const results = variations.map(variation => {
      const outcomes = projectTimeSeriesOutcome(variation, aiCapabilities, years);
      return {
        employment2025: outcomes[0].employment,
        employment2028: outcomes[1].employment,
        employment2030: outcomes[2].employment,
        employment3yrChange: ((outcomes[1].employment - outcomes[0].employment) / outcomes[0].employment) * 100,
        employment5yrChange: ((outcomes[2].employment - outcomes[0].employment) / outcomes[0].employment) * 100,
      };
    });
    
    // Calculate percentiles
    const getPercentiles = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      return {
        p10: sorted[Math.floor(sorted.length * 0.1)],
        p25: sorted[Math.floor(sorted.length * 0.25)],
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p75: sorted[Math.floor(sorted.length * 0.75)],
        p90: sorted[Math.floor(sorted.length * 0.9)],
        min: sorted[0],
        max: sorted[sorted.length - 1],
      };
    };
    
    return {
      employment3yr: getPercentiles(results.map(r => r.employment3yrChange)),
      employment5yr: getPercentiles(results.map(r => r.employment5yrChange)),
      employment2028: getPercentiles(results.map(r => r.employment2028)),
      employment2030: getPercentiles(results.map(r => r.employment2030)),
    };
  }, [parameters, aiCapabilities]);

  const UncertaintyBar = ({ 
    label, 
    percentiles, 
    suffix = '%',
    isPositiveGood = true 
  }: { 
    label: string; 
    percentiles: {
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      min: number;
      max: number;
    }; 
    suffix?: string;
    isPositiveGood?: boolean;
  }) => {
    const range = percentiles.max - percentiles.min;
    const getColor = (value: number) => {
      if (suffix === '%') {
        if (isPositiveGood) {
          return value >= 0 ? 'text-green-600' : 'text-red-600';
        } else {
          return value <= 0 ? 'text-green-600' : 'text-red-600';
        }
      }
      return 'text-blue-600';
    };
    
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm font-medium text-gray-700 mb-3">{label}</div>
        
        {/* Visual uncertainty range */}
        <div className="relative h-8 bg-gray-200 rounded-full mb-3 overflow-hidden">
          {/* 80% confidence band (p10 to p90) */}
          <div 
            className="absolute h-full bg-blue-200"
            style={{
              left: `${((percentiles.p10 - percentiles.min) / range) * 100}%`,
              width: `${((percentiles.p90 - percentiles.p10) / range) * 100}%`
            }}
          />
          {/* 50% confidence band (p25 to p75) */}
          <div 
            className="absolute h-full bg-blue-400"
            style={{
              left: `${((percentiles.p25 - percentiles.min) / range) * 100}%`,
              width: `${((percentiles.p75 - percentiles.p25) / range) * 100}%`
            }}
          />
          {/* Median line */}
          <div 
            className="absolute h-full w-1 bg-blue-800"
            style={{
              left: `${((percentiles.p50 - percentiles.min) / range) * 100}%`
            }}
          />
        </div>
        
        {/* Numbers */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Likely range:</span>
            <span className={getColor(percentiles.p25)}>
              {percentiles.p25.toFixed(1)}{suffix} to {percentiles.p75.toFixed(1)}{suffix}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Most likely:</span>
            <span className={`font-medium ${getColor(percentiles.p50)}`}>
              {percentiles.p50.toFixed(1)}{suffix}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Extreme range:</span>
            <span className="text-gray-600">
              {percentiles.p10.toFixed(1)}{suffix} to {percentiles.p90.toFixed(1)}{suffix}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Uncertainty Analysis
        </h3>
        <p className="text-sm text-gray-600">
          Results from 300 simulations with realistic parameter uncertainty. 
          Dark bars show likely outcomes, light bars show possible extremes.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-4 text-center">Employment Change</h4>
          <div className="space-y-4">
            <UncertaintyBar 
              label="3-Year Change" 
              percentiles={analysis.employment3yr}
            />
            <UncertaintyBar 
              label="5-Year Change" 
              percentiles={analysis.employment5yr}
            />
          </div>
        </div>
        
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-4 text-center">Total Employment</h4>
          <div className="space-y-4">
            <UncertaintyBar 
              label="2028 Total Jobs" 
              percentiles={analysis.employment2028}
              suffix=""
            />
            <UncertaintyBar 
              label="2030 Total Jobs" 
              percentiles={analysis.employment2030}
              suffix=""
            />
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Key Insights from Uncertainty Analysis</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>
            • <strong>Employment in 2028:</strong> Likely between {formatNumberForDisplay(analysis.employment2028.p25, 'compact')} 
            and {formatNumberForDisplay(analysis.employment2028.p75, 'compact')} jobs
          </p>
          <p>
            • <strong>Employment uncertainty:</strong> 5-year changes could range from 
            {analysis.employment5yr.p10 >= 0 ? '+' : ''}{analysis.employment5yr.p10.toFixed(1)}% to 
            {analysis.employment5yr.p90 >= 0 ? '+' : ''}{analysis.employment5yr.p90.toFixed(1)}%
          </p>
          <p>
            • <strong>Range matters:</strong> The wide uncertainty bands show why scenario planning is crucial
          </p>
        </div>
      </div>
    </div>
  );
}