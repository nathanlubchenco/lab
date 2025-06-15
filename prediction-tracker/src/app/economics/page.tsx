'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EconomicParams } from '@/types/economics/economic';
import { AICapabilityModel } from '@/types/economics/ai';
import ParameterSliders from '@/components/economics/controls/ParameterSliders';
import SimpleChart from '@/components/economics/visualizations/SimpleChart';

const defaultParams: EconomicParams = {
  aiProductivityGain: 25,
  aiSubstitutionByRole: {
    juniorDev: 40,
    midDev: 25,
    seniorDev: 15,
    architect: 5,
    devOps: 30,
    frontend: 35,
    backend: 20,
    fullStack: 30,
    mobile: 35,
    dataScience: -10,
  },
  aiComplementaryRoles: {
    promptEngineering: 5000,
    aiSystemsIntegration: 8000,
    aiEthicsCompliance: 3000,
    humanAiInterface: 4000,
    aiTraining: 6000,
  },
  wageElasticity: -0.4,
  geographicArbitrage: 0.2,
  immigrationPolicy: 'moderate',
  educationPipeline: {
    graduationRate: 0.05,
    bootcampGrowth: 0.15,
    universityCapacity: 1.0,
    skillsTrainingAdoption: 0.3,
  },
  gdpGrowth: 2.5,
  interestRates: 4.0,
  ventureCapitalAvailability: 1.0,
  regulatoryEnvironment: 0.5,
};

const defaultAICapabilities: AICapabilityModel = {
  swebenchScore: { lower: 20, upper: 35, mean: 28, std: 5 },
  humanEvalScore: { lower: 70, upper: 85, mean: 78, std: 4 },
  liveCodeBench: { lower: 25, upper: 40, mean: 32, std: 4 },
  codeChurnRate: 0.15,
  bugIntroductionRate: 0.08,
  maintenanceCost: 1.2,
  progressionCurve: 'sigmoid',
  capabilityDomains: {
    codeGeneration: {
      currentLevel: 0.7,
      projectedGrowth: 0.15,
      plateauLevel: 0.9,
      uncertaintyRange: { lower: 0.6, upper: 0.95, mean: 0.8, std: 0.1 },
      timeToMaturity: 5,
    },
    debugging: {
      currentLevel: 0.4,
      projectedGrowth: 0.12,
      plateauLevel: 0.7,
      uncertaintyRange: { lower: 0.3, upper: 0.8, mean: 0.55, std: 0.15 },
      timeToMaturity: 8,
    },
    architecture: {
      currentLevel: 0.2,
      projectedGrowth: 0.08,
      plateauLevel: 0.5,
      uncertaintyRange: { lower: 0.1, upper: 0.6, mean: 0.35, std: 0.2 },
      timeToMaturity: 12,
    },
    testing: {
      currentLevel: 0.5,
      projectedGrowth: 0.1,
      plateauLevel: 0.8,
      uncertaintyRange: { lower: 0.4, upper: 0.85, mean: 0.65, std: 0.12 },
      timeToMaturity: 6,
    },
    documentation: {
      currentLevel: 0.8,
      projectedGrowth: 0.05,
      plateauLevel: 0.95,
      uncertaintyRange: { lower: 0.75, upper: 0.98, mean: 0.9, std: 0.08 },
      timeToMaturity: 3,
    },
    codeReview: {
      currentLevel: 0.3,
      projectedGrowth: 0.1,
      plateauLevel: 0.6,
      uncertaintyRange: { lower: 0.2, upper: 0.7, mean: 0.45, std: 0.15 },
      timeToMaturity: 10,
    },
  },
};

export default function EconomicsPage() {
  const [parameters, setParameters] = useState<EconomicParams>(defaultParams);
  const [aiCapabilities] = useState<AICapabilityModel>(defaultAICapabilities);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Software Engineer Demand Forecasting
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore how AI capabilities, economic conditions, and policy changes affect 
            software engineering employment and wages over time.
          </p>
          <div className="mt-4">
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Lab Home
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ParameterSliders 
              parameters={parameters}
              onChange={setParameters}
            />
          </div>
          
          <div className="lg:col-span-2">
            <SimpleChart 
              parameters={parameters}
              aiCapabilities={aiCapabilities}
            />
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Model Assumptions & Methodology
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              • This model uses econometric techniques to project software engineering labor demand
            </p>
            <p>
              • AI substitution rates are applied gradually over time with sigmoid adoption curves
            </p>
            <p>
              • Productivity gains from AI are assumed to partially offset job displacement
            </p>
            <p>
              • Geographic arbitrage reflects remote work impact on wage differentials
            </p>
            <p>
              • Education pipeline effects have 2-5 year lags for supply adjustments
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}