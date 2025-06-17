'use client';

import { EconomicParams } from '@/types/economics/economic';

interface ScenarioPresetsProps {
  onScenarioSelect: (params: EconomicParams) => void;
  currentScenario: string;
}

export const SCENARIOS = {
  'ai-optimist': {
    name: 'AI Optimist',
    description: 'High productivity gains, moderate displacement, strong new role creation',
    color: 'bg-green-500',
    params: {
      aiProductivityGain: 60,
      aiSubstitutionByRole: {
        juniorDev: 25,
        midDev: 15,
        seniorDev: 8,
        architect: 3,
        devOps: 20,
        frontend: 30,
        backend: 15,
        fullStack: 20,
        mobile: 25,
        dataScience: -15, // Growth in data science
      },
      aiComplementaryRoles: {
        promptEngineering: 12000,
        aiSystemsIntegration: 18000,
        aiEthicsCompliance: 8000,
        humanAiInterface: 10000,
        aiTraining: 15000,
      },
      wageElasticity: -0.3, // Less sensitive wages
      geographicArbitrage: 0.15, // Moderate remote work impact
      immigrationPolicy: 'expansive' as const,
      educationPipeline: {
        graduationRate: 0.08,
        bootcampGrowth: 0.2,
        universityCapacity: 1.3,
        skillsTrainingAdoption: 0.6,
      },
      gdpGrowth: 3.2,
      interestRates: 3.5,
      ventureCapitalAvailability: 1.4,
      regulatoryEnvironment: 0.3,
    }
  },
  'ai-pessimist': {
    name: 'AI Displacement',
    description: 'Rapid automation, slow adaptation, wage pressure from oversupply',
    color: 'bg-red-500',
    params: {
      aiProductivityGain: 35, // Lower productivity gains
      aiSubstitutionByRole: {
        juniorDev: 65,
        midDev: 45,
        seniorDev: 25,
        architect: 10,
        devOps: 40,
        frontend: 60,
        backend: 35,
        fullStack: 45,
        mobile: 50,
        dataScience: 15, // Even data science affected
      },
      aiComplementaryRoles: {
        promptEngineering: 3000,
        aiSystemsIntegration: 6000,
        aiEthicsCompliance: 2000,
        humanAiInterface: 3000,
        aiTraining: 4000,
      },
      wageElasticity: -0.7, // Very sensitive wages
      geographicArbitrage: 0.35, // High remote work pressure
      immigrationPolicy: 'restrictive' as const,
      educationPipeline: {
        graduationRate: 0.02,
        bootcampGrowth: 0.05, // Bootcamps struggling
        universityCapacity: 0.9,
        skillsTrainingAdoption: 0.2, // Slow adaptation
      },
      gdpGrowth: 1.8,
      interestRates: 5.5,
      ventureCapitalAvailability: 0.6, // VC pullback
      regulatoryEnvironment: 0.7,
    }
  },
  'gradual-transition': {
    name: 'Gradual Transition',
    description: 'Slow AI adoption, strong retraining, policy support for workers',
    color: 'bg-blue-500',
    params: {
      aiProductivityGain: 40,
      aiSubstitutionByRole: {
        juniorDev: 35,
        midDev: 20,
        seniorDev: 10,
        architect: 4,
        devOps: 25,
        frontend: 40,
        backend: 18,
        fullStack: 25,
        mobile: 30,
        dataScience: -5,
      },
      aiComplementaryRoles: {
        promptEngineering: 8000,
        aiSystemsIntegration: 12000,
        aiEthicsCompliance: 6000,
        humanAiInterface: 7000,
        aiTraining: 10000,
      },
      wageElasticity: -0.4,
      geographicArbitrage: 0.2,
      immigrationPolicy: 'moderate' as const,
      educationPipeline: {
        graduationRate: 0.06,
        bootcampGrowth: 0.12,
        universityCapacity: 1.2,
        skillsTrainingAdoption: 0.7, // Strong retraining
      },
      gdpGrowth: 2.8,
      interestRates: 4.0,
      ventureCapitalAvailability: 1.1,
      regulatoryEnvironment: 0.4,
    }
  },
  'boom-bust': {
    name: 'Boom-Bust Cycle',
    description: 'AI hype cycle: initial surge followed by correction and consolidation',
    color: 'bg-orange-500',
    params: {
      aiProductivityGain: 80, // Initially very high
      aiSubstitutionByRole: {
        juniorDev: 50,
        midDev: 30,
        seniorDev: 15,
        architect: 5,
        devOps: 35,
        frontend: 45,
        backend: 25,
        fullStack: 35,
        mobile: 40,
        dataScience: -10,
      },
      aiComplementaryRoles: {
        promptEngineering: 15000, // Hype-driven hiring
        aiSystemsIntegration: 22000,
        aiEthicsCompliance: 5000,
        humanAiInterface: 8000,
        aiTraining: 18000,
      },
      wageElasticity: -0.6, // Volatile wages
      geographicArbitrage: 0.25,
      immigrationPolicy: 'moderate' as const,
      educationPipeline: {
        graduationRate: 0.04,
        bootcampGrowth: 0.25, // AI bootcamp boom
        universityCapacity: 1.0,
        skillsTrainingAdoption: 0.4,
      },
      gdpGrowth: 2.2,
      interestRates: 4.8,
      ventureCapitalAvailability: 1.8, // Boom conditions
      regulatoryEnvironment: 0.6,
    }
  },
  'baseline-2025': {
    name: '2025 Baseline',
    description: 'Current conditions continue with modest AI adoption',
    color: 'bg-gray-500',
    params: {
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
      immigrationPolicy: 'moderate' as const,
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
    }
  }
};

export default function ScenarioPresets({ onScenarioSelect, currentScenario }: ScenarioPresetsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Scenario Presets</h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose a preset to see dramatically different outcomes, then adjust individual parameters to explore variations.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
        {Object.entries(SCENARIOS).map(([key, scenario]) => (
          <button
            key={key}
            onClick={() => onScenarioSelect(scenario.params)}
            className={`
              text-left p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md
              ${currentScenario === key 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${scenario.color}`}></div>
              <span className="font-medium text-gray-900">{scenario.name}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {scenario.description}
            </p>
          </button>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>Tip:</strong> Each scenario creates very different outcomes. Compare the 3-year employment changes across scenarios to see the range of possibilities.
        </p>
      </div>
    </div>
  );
}