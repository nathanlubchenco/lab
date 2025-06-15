import { ChartData, VisualizationConfig } from '@/types/economics/visualization';
import { LaborMarketOutcome, MonteCarloResult } from '@/types/economics/economic';
import * as d3 from 'd3';

export function prepareTimeSeriesData(
  outcomes: LaborMarketOutcome[],
  years: number[]
): ChartData {
  return {
    x: years,
    y: outcomes.map(o => o.employment),
    labels: years.map(y => y.toString()),
    metadata: {
      wages: outcomes.map(o => o.averageWage),
      unemploymentRates: outcomes.map(o => o.unemploymentRate),
    }
  };
}

export function prepareScatterPlotData(
  results: MonteCarloResult[],
  xParam: string,
  yParam: string
): ChartData {
  return {
    x: results.map(r => r.parameters[xParam]),
    y: results.map(r => r.outcomes[yParam]),
    labels: results.map(r => r.scenarioId),
    colors: results.map(r => r.probability.toString()),
    metadata: {
      probabilities: results.map(r => r.probability),
      scenarios: results.map(r => r.scenarioId),
    }
  };
}

export function createColorScale(
  values: number[],
  colors: string[] = ['#blue', '#green', '#yellow', '#red']
): d3.ScaleLinear<string, string> {
  const domain = d3.extent(values) as [number, number];
  return d3.scaleLinear<string>()
    .domain(d3.ticks(domain[0], domain[1], colors.length))
    .range(colors);
}

export function calculateContourLevels(
  z: number[][],
  numLevels: number = 10
): number[] {
  const flatZ = z.flat();
  const extent = d3.extent(flatZ) as [number, number];
  return d3.ticks(extent[0], extent[1], numLevels);
}

export function interpolateSurface(
  x: number[],
  y: number[],
  z: number[],
  gridSize: number = 50
): { x: number[], y: number[], z: number[][] } {
  const xExtent = d3.extent(x) as [number, number];
  const yExtent = d3.extent(y) as [number, number];
  
  const xGrid = d3.ticks(xExtent[0], xExtent[1], gridSize);
  const yGrid = d3.ticks(yExtent[0], yExtent[1], gridSize);
  
  const zGrid: number[][] = [];
  
  for (let i = 0; i < yGrid.length; i++) {
    zGrid[i] = [];
    for (let j = 0; j < xGrid.length; j++) {
      // Simple inverse distance weighting interpolation
      const distances = x.map((xi, idx) => 
        Math.sqrt(Math.pow(xi - xGrid[j], 2) + Math.pow(y[idx] - yGrid[i], 2))
      );
      
      const weights = distances.map(d => d === 0 ? 1e10 : 1 / Math.pow(d, 2));
      const weightSum = weights.reduce((sum, w) => sum + w, 0);
      
      zGrid[i][j] = z.reduce((sum, zi, idx) => 
        sum + zi * weights[idx] / weightSum, 0
      );
    }
  }
  
  return { x: xGrid, y: yGrid, z: zGrid };
}

export function createDefaultVisualizationConfig(
  type: VisualizationConfig['type'],
  title: string,
  xLabel: string,
  yLabel: string,
  zLabel?: string
): VisualizationConfig {
  const config: VisualizationConfig = {
    type,
    title,
    xAxis: { label: xLabel },
    yAxis: { label: yLabel },
    interactive: true,
    showConfidenceBands: type === 'line',
    showTooltips: true,
  };
  
  if (zLabel && (type === 'surface' || type === 'heatmap')) {
    config.zAxis = { label: zLabel };
  }
  
  if (type === 'surface' || type === 'heatmap') {
    config.colorScale = {
      label: zLabel || 'Value',
      colors: ['#0066cc', '#ffffff', '#cc0000'],
    };
  }
  
  return config;
}

export function formatNumberForDisplay(
  value: number,
  type: 'currency' | 'percentage' | 'number' | 'compact' = 'number'
): string {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    
    case 'percentage':
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value / 100);
    
    case 'compact':
      return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
      }).format(value);
    
    default:
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
  }
}

export function calculateHistogramBins(
  data: number[],
  numBins?: number
): { bins: number[], frequencies: number[] } {
  const extent = d3.extent(data) as [number, number];
  const bins = d3.histogram()
    .domain(extent)
    .thresholds(numBins || d3.thresholdSturges(data))(data);
  
  return {
    bins: bins.map(bin => (bin.x0! + bin.x1!) / 2),
    frequencies: bins.map(bin => bin.length),
  };
}