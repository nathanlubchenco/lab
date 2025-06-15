import { EconomicParams, LaborMarketOutcome } from '@/types/economics/economic';
import { AICapabilityModel } from '@/types/economics/ai';

export function calculateLaborDemand(
  params: EconomicParams,
  aiCapabilities: AICapabilityModel,
  timeHorizon: number // years
): LaborMarketOutcome {
  const roles = Object.keys(params.aiSubstitutionByRole) as (keyof typeof params.aiSubstitutionByRole)[];
  
  // Base demand calculation (simplified)
  const baseDemand = {
    juniorDev: 100000,
    midDev: 80000,
    seniorDev: 60000,
    architect: 20000,
    devOps: 40000,
    frontend: 70000,
    backend: 60000,
    fullStack: 90000,
    mobile: 50000,
    dataScience: 30000,
  };
  
  const demandByRole: Record<string, number> = {};
  let totalEmployment = 0;
  let weightedWageSum = 0;
  let totalWeights = 0;
  
  // Calculate demand adjustments for each role
  roles.forEach(role => {
    const baseRoleDemand = baseDemand[role];
    const substitutionRate = params.aiSubstitutionByRole[role] / 100;
    const productivityGain = params.aiProductivityGain / 100;
    
    // AI substitution reduces demand
    // But productivity gains and economic growth increase it
    const growthMultiplier = 1 + (params.gdpGrowth / 100) * timeHorizon;
    const productivityMultiplier = 1 + productivityGain * (1 - substitutionRate);
    const substitutionMultiplier = 1 - substitutionRate * Math.min(timeHorizon / 10, 1); // gradual adoption
    
    const adjustedDemand = baseRoleDemand * 
      growthMultiplier * 
      productivityMultiplier * 
      substitutionMultiplier;
    
    demandByRole[role] = Math.max(0, adjustedDemand);
    totalEmployment += demandByRole[role];
    
    // Weight by employment for average wage calculation
    const roleWage = getRoleBaseWage(role);
    weightedWageSum += demandByRole[role] * roleWage;
    totalWeights += demandByRole[role];
  });
  
  // Add new AI-complementary roles
  const complementaryRoles = Object.keys(params.aiComplementaryRoles) as (keyof typeof params.aiComplementaryRoles)[];
  complementaryRoles.forEach(role => {
    const newRoleDemand = params.aiComplementaryRoles[role];
    demandByRole[role] = newRoleDemand;
    totalEmployment += newRoleDemand;
    
    const roleWage = getComplementaryRoleWage(role);
    weightedWageSum += newRoleDemand * roleWage;
    totalWeights += newRoleDemand;
  });
  
  const averageWage = totalWeights > 0 ? weightedWageSum / totalWeights : 0;
  
  // Supply calculation (simplified)
  const baseSupply = totalEmployment * 1.1; // 10% excess supply baseline
  const supplyByRole: Record<string, number> = {};
  Object.keys(demandByRole).forEach(role => {
    supplyByRole[role] = demandByRole[role] * 1.05; // 5% excess supply per role
  });
  
  const unemploymentRate = Math.max(0, (baseSupply - totalEmployment) / baseSupply);
  const jobVacancyRate = Math.max(0, (totalEmployment - baseSupply) / totalEmployment);
  
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
  const universityCapacity = educationPipeline.universityCapacity;
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
  return years.map(year => calculateLaborDemand(params, aiCapabilities, year));
}