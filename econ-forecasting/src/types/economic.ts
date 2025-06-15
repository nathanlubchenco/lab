export type PolicyScenario = 'restrictive' | 'moderate' | 'expansive';

export interface EducationModel {
  graduationRate: number;
  bootcampGrowth: number;
  universityCapacity: number;
  skillsTrainingAdoption: number;
}

export interface EconomicParams {
  // AI Impact (the contentious core)
  aiProductivityGain: number; // 0-200%
  aiSubstitutionByRole: {
    // Role-specific displacement
    juniorDev: number; // 0-80%
    midDev: number; // 0-60%
    seniorDev: number; // 0-40%
    architect: number; // 0-20%
    devOps: number; // 0-50%
    frontend: number; // 0-70%
    backend: number; // 0-40%
    fullStack: number; // 0-50%
    mobile: number; // 0-60%
    dataScience: number; // -20-30% (may grow)
  };
  aiComplementaryRoles: {
    // New roles created
    promptEngineering: number;
    aiSystemsIntegration: number;
    aiEthicsCompliance: number;
    humanAiInterface: number;
    aiTraining: number;
  };

  // Market Dynamics
  wageElasticity: number; // -0.2 to -0.8
  geographicArbitrage: number; // Remote work impact
  immigrationPolicy: PolicyScenario;
  educationPipeline: EducationModel;

  // Economic Environment
  gdpGrowth: number;
  interestRates: number;
  ventureCapitalAvailability: number;
  regulatoryEnvironment: number;
}

export interface ModelComparison {
  baseline: 'BLS_projections';
  competing: (
    | 'simple_linear_extrapolation'
    | 'ai_optimist_model'
    | 'ai_pessimist_model'
    | 'cyclical_adjustment_model'
  )[];
  metrics: ('RMSE' | 'MAE' | 'directional_accuracy' | 'prediction_intervals')[];
}

export interface DataSources {
  jobPostings: {
    indeed: string;
    linkedin: string;
    stackoverflow: string;
  };
  salaryData: {
    levelsfi: string;
    glassdoor: string;
    payscale: string;
  };
  aiCapabilities: {
    swebench: string;
    paperswithcode: string;
    lmsys: string;
  };
  economicIndicators: {
    fred: string;
    bls: string;
    census: string;
  };
}

export interface LaborMarketOutcome {
  employment: number;
  averageWage: number;
  demandByRole: Record<string, number>;
  supplyByRole: Record<string, number>;
  unemploymentRate: number;
  jobVacancyRate: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  parameters: EconomicParams;
  outcomes: LaborMarketOutcome[];
  confidence: number;
}

export interface MonteCarloResult {
  scenarioId: string;
  parameters: Record<string, number>;
  outcomes: Record<string, number>;
  probability: number;
}