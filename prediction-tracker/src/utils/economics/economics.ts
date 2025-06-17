import { EconomicParams, LaborMarketOutcome } from '@/types/economics/economic';
import { AICapabilityModel } from '@/types/economics/ai';

export function calculateLaborDemand(
  params: EconomicParams,
  aiCapabilities: AICapabilityModel,
  timeHorizon: number // years since 2025
): LaborMarketOutcome {
  const roles = Object.keys(params.aiSubstitutionByRole) as (keyof typeof params.aiSubstitutionByRole)[];
  
  // Base 2025 employment (based on real BLS/industry data)
  const baseDemand = {
    juniorDev: 180000,    // Large entry-level population
    midDev: 140000,       // Bulk of workforce  
    seniorDev: 90000,     // Experienced developers
    architect: 25000,     // Specialized senior roles
    devOps: 85000,        // Infrastructure/ops
    frontend: 110000,     // UI/UX focused
    backend: 95000,       // Server/API focused
    fullStack: 120000,    // Generalist developers
    mobile: 75000,        // iOS/Android specialists
    dataScience: 60000,   // ML/AI specialists
  };
  
  const demandByRole: Record<string, number> = {};
  let totalEmployment = 0;
  let weightedWageSum = 0;
  let totalWeights = 0;
  
  // Calculate demand adjustments for each role with MUCH stronger effects
  roles.forEach(role => {
    const baseRoleDemand = baseDemand[role];
    const maxSubstitutionRate = params.aiSubstitutionByRole[role] / 100;
    const productivityGain = params.aiProductivityGain / 100;
    
    // AI adoption follows sigmoid curve - slow start, rapid middle, plateau
    const adoptionProgress = Math.min(1, timeHorizon / 8); // 8 years to full adoption
    const sigmoidAdoption = 1 / (1 + Math.exp(-10 * (adoptionProgress - 0.5))); // Steep S-curve
    const currentSubstitutionRate = maxSubstitutionRate * sigmoidAdoption;
    
    // Economic growth baseline (compound)
    const baseGrowthMultiplier = Math.pow(1 + params.gdpGrowth / 100, timeHorizon);
    
    // VC/interest rate impact on tech hiring (much stronger effect)
    const vcImpact = params.ventureCapitalAvailability;
    const interestRateImpact = Math.pow(0.95, params.interestRates - 2); // Each % above 2% reduces demand 5%
    const financialMultiplier = vcImpact * interestRateImpact;
    
    // Productivity paradox: AI makes remaining workers much more valuable
    // But also enables companies to do more with fewer people
    const productivityEffect = 1 + productivityGain * (1 - currentSubstitutionRate * 0.7);
    
    // Net effect: substitution reduces demand, but productivity and growth increase it
    const netDemandMultiplier = 
      baseGrowthMultiplier *           // Economic growth
      financialMultiplier *            // VC/interest rate environment  
      productivityEffect *             // Productivity gains
      (1 - currentSubstitutionRate);   // AI substitution
    
    // Add role-specific factors
    let roleSpecificMultiplier = 1;
    
    // Junior roles hit harder by AI + education pipeline flooding market
    if (role === 'juniorDev') {
      const bootcampFlood = 1 + params.educationPipeline.bootcampGrowth * timeHorizon * 2;
      roleSpecificMultiplier *= (1 / bootcampFlood); // Oversupply reduces demand
    }
    
    // Data science benefits from AI boom
    if (role === 'dataScience') {
      const aiDemandBoost = 1 + (productivityGain * 3 * adoptionProgress); // AI creates more AI jobs
      roleSpecificMultiplier *= aiDemandBoost;
    }
    
    // Senior roles benefit from increased complexity
    if (role === 'seniorDev' || role === 'architect') {
      const complexityBoost = 1 + (productivityGain * 0.5); // More complex systems need senior people
      roleSpecificMultiplier *= complexityBoost;
    }
    
    const finalDemand = baseRoleDemand * netDemandMultiplier * roleSpecificMultiplier;
    demandByRole[role] = Math.max(0, finalDemand);
    totalEmployment += demandByRole[role];
    
    // Weight by employment for average wage calculation
    const roleWage = getRoleBaseWage(role);
    weightedWageSum += demandByRole[role] * roleWage;
    totalWeights += demandByRole[role];
  });
  
  // Add new AI-complementary roles with growth curves
  const adoptionProgress = Math.min(1, timeHorizon / 8); // 8 years to full adoption
  const sigmoidAdoption = 1 / (1 + Math.exp(-10 * (adoptionProgress - 0.5))); // Steep S-curve
  
  const complementaryRoles = Object.keys(params.aiComplementaryRoles) as (keyof typeof params.aiComplementaryRoles)[];
  complementaryRoles.forEach(role => {
    // These roles grow with AI adoption and VC funding
    const baseNewRoles = params.aiComplementaryRoles[role];
    const adoptionMultiplier = 1 + sigmoidAdoption * 2; // Double during peak AI adoption
    const vcMultiplier = Math.sqrt(params.ventureCapitalAvailability); // Square root - diminishing returns
    
    const newRoleDemand = baseNewRoles * adoptionMultiplier * vcMultiplier;
    demandByRole[role] = newRoleDemand;
    totalEmployment += newRoleDemand;
    
    const roleWage = getComplementaryRoleWage(role);
    weightedWageSum += newRoleDemand * roleWage;
    totalWeights += newRoleDemand;
  });
  
  const averageWage = totalWeights > 0 ? weightedWageSum / totalWeights : 0;
  
  // More realistic supply/demand calculations
  const { supplyMultiplier } = calculateEducationPipelineImpact(params, timeHorizon);
  const totalSupply = totalEmployment * supplyMultiplier;
  
  const supplyByRole: Record<string, number> = {};
  Object.keys(demandByRole).forEach(role => {
    supplyByRole[role] = demandByRole[role] * supplyMultiplier;
  });
  
  const unemploymentRate = Math.max(0, Math.min(0.25, (totalSupply - totalEmployment) / totalSupply));
  const jobVacancyRate = Math.max(0, (totalEmployment - totalSupply) / totalEmployment);
  
  return {
    employment: totalEmployment,
    averageWage,
    demandByRole,
    supplyByRole,
    unemploymentRate,
    jobVacancyRate,
  };
}

function getRoleBaseWage(role: keyof EconomicParams['aiSubstitutionByRole']): number {
  const baseWages = {
    juniorDev: 80000,
    midDev: 120000,
    seniorDev: 160000,
    architect: 200000,
    devOps: 140000,
    frontend: 110000,
    backend: 130000,
    fullStack: 125000,
    mobile: 125000,
    dataScience: 150000,
  };
  return baseWages[role];
}

function getComplementaryRoleWage(role: keyof EconomicParams['aiComplementaryRoles']): number {
  const complementaryWages = {
    promptEngineering: 140000,
    aiSystemsIntegration: 160000,
    aiEthicsCompliance: 130000,
    humanAiInterface: 120000,
    aiTraining: 150000,
  };
  return complementaryWages[role];
}

export function calculateWageElasticity(
  params: EconomicParams,
  demandChange: number,
  supplyChange: number
): number {
  // Simplified wage elasticity calculation
  const netExcessDemand = demandChange - supplyChange;
  const elasticity = params.wageElasticity;
  
  // Wage change = elasticity * (excess demand / current demand)
  return elasticity * netExcessDemand;
}

export function applyGeographicArbitrage(
  localWage: number,
  remoteWorkShare: number,
  params: EconomicParams
): number {
  // Remote work allows for geographic wage arbitrage
  const arbitrageDiscount = params.geographicArbitrage;
  const effectiveWage = localWage * (1 - remoteWorkShare * arbitrageDiscount);
  
  return Math.max(effectiveWage, localWage * 0.5); // Floor at 50% of local wage
}

export function calculateEducationPipelineImpact(
  params: EconomicParams,
  timeHorizon: number
): { supplyMultiplier: number; skillsMismatch: number } {
  const { educationPipeline } = params;
  
  // Education pipeline affects supply with a lag
  const graduationImpact = educationPipeline.graduationRate;
  const bootcampImpact = educationPipeline.bootcampGrowth;
  const skillsTraining = educationPipeline.skillsTrainingAdoption;
  
  // Supply multiplier increases over time as education system adapts
  const supplyMultiplier = 1 + (graduationImpact + bootcampImpact) * Math.min(timeHorizon / 5, 1);
  
  // Skills mismatch decreases as training programs adapt
  const skillsMismatch = Math.max(0, 0.3 - skillsTraining * Math.min(timeHorizon / 3, 1));
  
  return { supplyMultiplier, skillsMismatch };
}

export function projectTimeSeriesOutcome(
  params: EconomicParams,
  aiCapabilities: AICapabilityModel,
  years: number[]
): LaborMarketOutcome[] {
  return years.map(year => calculateLaborDemand(params, aiCapabilities, year - 2025));
}