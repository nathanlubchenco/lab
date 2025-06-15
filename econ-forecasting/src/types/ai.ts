export interface ConfidenceInterval {
  lower: number;
  upper: number;
  mean: number;
  std: number;
}

export interface CapabilityTrajectory {
  currentLevel: number;
  projectedGrowth: number;
  plateauLevel: number;
  uncertaintyRange: ConfidenceInterval;
  timeToMaturity: number; // years
}

export type ProgressionCurve = 'linear' | 'exponential' | 'sigmoid' | 'custom';

export interface AICapabilityModel {
  // Current benchmarks with confidence intervals
  swebenchScore: ConfidenceInterval;
  humanEvalScore: ConfidenceInterval;
  liveCodeBench: ConfidenceInterval;

  // Quality metrics
  codeChurnRate: number; // From GitClear data
  bugIntroductionRate: number;
  maintenanceCost: number;

  // Capability progression models
  progressionCurve: ProgressionCurve;
  capabilityDomains: {
    codeGeneration: CapabilityTrajectory;
    debugging: CapabilityTrajectory;
    architecture: CapabilityTrajectory;
    testing: CapabilityTrajectory;
    documentation: CapabilityTrajectory;
    codeReview: CapabilityTrajectory;
  };
}

export interface TaskAutomationPotential {
  taskId: string;
  taskName: string;
  currentAICapability: number; // 0-1 scale
  humanPerformance: number; // 0-1 scale
  automationTimeline: number; // years until full automation
  partialAutomationBenefit: number; // 0-1 scale of productivity gain
  qualityRisk: number; // 0-1 scale of quality degradation risk
}

export interface AIImpactAssessment {
  roleId: string;
  roleName: string;
  tasks: TaskAutomationPotential[];
  overallSubstitutionRisk: number; // 0-1 scale
  overallComplementarityGain: number; // 0-1 scale
  transitionTimeframe: number; // years
  retoolingRequired: boolean;
  newSkillsNeeded: string[];
}