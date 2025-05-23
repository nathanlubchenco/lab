import { Prediction } from '../types/prediction';

export interface Filters {
  statuses?: Prediction['status'][];
  categories?: Prediction['category'][];
  minConfidence?: number;
  maxConfidence?: number;
}

/**
 * Filter predictions array by provided filters.
 */
export function filterPredictions(
  predictions: Prediction[],
  filters: Filters
): Prediction[] {
  return predictions.filter(p => {
    if (filters.statuses && filters.statuses.length && !filters.statuses.includes(p.status)) {
      return false;
    }
    if (filters.categories && filters.categories.length && !filters.categories.includes(p.category)) {
      return false;
    }
    if (filters.minConfidence !== undefined && p.confidence < filters.minConfidence) {
      return false;
    }
    if (filters.maxConfidence !== undefined && p.confidence > filters.maxConfidence) {
      return false;
    }
    return true;
  });
}

/**
 * Sort predictions by target date (ascending).
 */
export function sortPredictionsByDate(
  predictions: Prediction[]
): Prediction[] {
  return [...predictions].sort(
    (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );
}