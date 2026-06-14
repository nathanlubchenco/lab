export interface ParameterSpaceExplorer {
  dimensions: string[];
  visualization: string;
  interactions: ('brush' | 'zoom' | 'rotate' | 'filter')[];
  animations: ('parameter_path' | 'scenario_transitions')[];
}

export interface ChartData {
  x: number[];
  y: number[];
  z?: number[];
  labels?: string[];
  colors?: string[];
  metadata?: Record<string, unknown>;
}

export interface VisualizationConfig {
  type: 'line' | 'surface' | 'scatter' | 'heatmap' | 'network' | 'tornado';
  title: string;
  xAxis: {
    label: string;
    range?: [number, number];
    scale?: 'linear' | 'log';
  };
  yAxis: {
    label: string;
    range?: [number, number];
    scale?: 'linear' | 'log';
  };
  zAxis?: {
    label: string;
    range?: [number, number];
    scale?: 'linear' | 'log';
  };
  colorScale?: {
    label: string;
    range?: [number, number];
    colors?: string[];
  };
  interactive?: boolean;
  showConfidenceBands?: boolean;
  showTooltips?: boolean;
}


export interface SensitivityAnalysis {
  parameter: string;
  baseValue: number;
  sensitivity: number; // partial derivative
  elasticity: number; // percentage change in outcome per percentage change in parameter
  confidenceInterval: [number, number];
}

export interface CalibrationMetrics {
  brier_score: number;
  log_score: number;
  coverage_probability: number;
  sharpness: number;
  reliability_diagram: {
    forecast_probabilities: number[];
    observed_frequencies: number[];
    counts: number[];
  };
}