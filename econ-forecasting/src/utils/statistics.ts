import * as ss from 'simple-statistics';
import { ConfidenceInterval } from '@/types/ai';
import { EconomicParams, MonteCarloResult } from '@/types/economic';

export function calculateConfidenceInterval(
  data: number[],
  confidence: number = 0.95
): ConfidenceInterval {
  const mean = ss.mean(data);
  const std = ss.standardDeviation(data);
  const n = data.length;
  
  // For large samples, use normal distribution
  const z = ss.probit(0.5 + confidence / 2);
  const margin = z * std / Math.sqrt(n);
  
  return {
    lower: mean - margin,
    upper: mean + margin,
    mean,
    std
  };
}

export function generateMonteCarloSamples(
  parameters: EconomicParams,
  uncertainty: Record<string, [number, number]>, // [min, max] for each parameter
  numSamples: number = 10000
): MonteCarloResult[] {
  const results: MonteCarloResult[] = [];
  
  for (let i = 0; i < numSamples; i++) {
    const sampledParams = { ...parameters };
    
    // Sample each parameter from its uncertainty range
    Object.entries(uncertainty).forEach(([param, [min, max]]) => {
      if (param in sampledParams) {
        (sampledParams as any)[param] = Math.random() * (max - min) + min;
      }
    });
    
    results.push({
      scenarioId: `scenario_${i}`,
      parameters: sampledParams as any,
      outcomes: {}, // Will be filled by economic model
      probability: 1 / numSamples
    });
  }
  
  return results;
}

export function calculateSensitivity(
  baseParams: EconomicParams,
  parameter: keyof EconomicParams,
  baseOutcome: number,
  modelFunction: (params: EconomicParams) => number,
  deltaPercent: number = 0.01
): { sensitivity: number; elasticity: number } {
  const baseValue = baseParams[parameter] as number;
  const delta = baseValue * deltaPercent;
  
  const upperParams = { ...baseParams, [parameter]: baseValue + delta };
  const lowerParams = { ...baseParams, [parameter]: baseValue - delta };
  
  const upperOutcome = modelFunction(upperParams);
  const lowerOutcome = modelFunction(lowerParams);
  
  // Numerical derivative
  const sensitivity = (upperOutcome - lowerOutcome) / (2 * delta);
  
  // Elasticity: percentage change in outcome / percentage change in parameter
  const elasticity = (sensitivity * baseValue) / baseOutcome;
  
  return { sensitivity, elasticity };
}

export function calculateR2(observed: number[], predicted: number[]): number {
  if (observed.length !== predicted.length) {
    throw new Error('Observed and predicted arrays must have the same length');
  }
  
  const meanObserved = ss.mean(observed);
  const totalSumSquares = observed.reduce((sum, y) => sum + Math.pow(y - meanObserved, 2), 0);
  const residualSumSquares = observed.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0);
  
  return 1 - (residualSumSquares / totalSumSquares);
}

export function calculateMAPE(observed: number[], predicted: number[]): number {
  if (observed.length !== predicted.length) {
    throw new Error('Observed and predicted arrays must have the same length');
  }
  
  const ape = observed.map((y, i) => Math.abs((y - predicted[i]) / y));
  return ss.mean(ape) * 100;
}

export function normalizeArray(arr: number[]): number[] {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min;
  
  if (range === 0) return arr.map(() => 0.5);
  
  return arr.map(x => (x - min) / range);
}

export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error('Arrays must have the same length');
  }
  
  return ss.sampleCorrelation(x, y);
}