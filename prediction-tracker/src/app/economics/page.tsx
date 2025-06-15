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

        {/* Methodology Section */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
          <h3 className="text-2xl font-bold text-blue-900 mb-6 text-center">
            Methodology & Data Sources
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-blue-800 mb-4">Economic Model</h4>
              <div className="text-sm text-blue-700 space-y-3">
                <div className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <p><strong>Labor Demand Function:</strong> Cobb-Douglas production with AI as technology parameter, adjusted for role-specific substitution rates</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <p><strong>Wage Equilibrium:</strong> Supply-demand dynamics with elasticity of -0.4 (based on tech labor literature)</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <p><strong>AI Adoption:</strong> Sigmoid curves over 5-10 year timeline, varying by role complexity</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <p><strong>Geographic Effects:</strong> Remote work enables 15-30% wage arbitrage (post-COVID data)</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-blue-800 mb-4">Key Assumptions</h4>
              <div className="text-sm text-blue-700 space-y-3">
                <div className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></span>
                  <p><strong>Productivity Gains:</strong> 25% baseline from GitHub Copilot studies, potential for 50-100% in specialized tasks</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></span>
                  <p><strong>Role Vulnerability:</strong> Junior roles most substitutable (40-80%), senior roles less so (5-20%)</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></span>
                  <p><strong>New AI Roles:</strong> 15,000+ emerging positions based on current job posting trends</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></span>
                  <p><strong>Economic Context:</strong> 2.5% GDP growth, 4% interest rates, normal VC conditions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Data Sources & References</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <h5 className="font-medium text-gray-800 mb-2">Employment & Wage Data</h5>
              <ul className="space-y-1">
                <li>• Bureau of Labor Statistics (BLS) Occupational Employment Statistics</li>
                <li>• Stack Overflow Developer Survey (2023-2024)</li>
                <li>• Levels.fyi compensation data</li>
                <li>• U.S. Census Bureau American Community Survey</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 mb-2">AI Impact Research</h5>
              <ul className="space-y-1">
                <li>• GitHub Copilot productivity studies (Ziegler et al., 2022)</li>
                <li>• McKinsey Global Institute AI adoption surveys</li>
                <li>• MIT-IBM Watson AI Lab automation research</li>
                <li>• NBER working papers on AI and labor</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 mb-2">Economic Parameters</h5>
              <ul className="space-y-1">
                <li>• Federal Reserve Economic Data (FRED)</li>
                <li>• National Venture Capital Association (NVCA) data</li>
                <li>• Conference Board economic indicators</li>
                <li>• Academic literature on tech labor elasticity</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 mb-2">Education & Training</h5>
              <ul className="space-y-1">
                <li>• National Center for Education Statistics (NCES)</li>
                <li>• Coding bootcamp outcome reports</li>
                <li>• LinkedIn Learning and Coursera trend data</li>
                <li>• IEEE and ACM workforce studies</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Model Limitations */}
        <div className="mt-6 bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <h4 className="text-lg font-semibold text-yellow-800 mb-3">Model Limitations & Uncertainties</h4>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>
              <strong>High Uncertainty:</strong> AI capabilities are evolving rapidly, making 3-5 year predictions inherently uncertain.
            </p>
            <p>
              <strong>Simplifying Assumptions:</strong> Real labor markets involve complex feedback effects, regulation, and behavioral changes not fully captured.
            </p>
            <p>
              <strong>Role Definitions:</strong> Job roles are evolving, and traditional classifications may not capture emerging hybrid positions.
            </p>
            <p>
              <strong>Regional Variation:</strong> Model uses national averages; local markets may differ significantly.
            </p>
            <p>
              <strong>Policy Responses:</strong> Government and industry responses to AI displacement could significantly alter outcomes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}