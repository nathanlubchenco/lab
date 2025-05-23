import { Prediction } from '../types/prediction';

/**
 * Calculate calibration score (accuracy percentage) based on predictions outcomes.
 * Only counts succeeded and failed predictions.
 * @param predictions Array of Prediction objects.
 * @returns Calibration accuracy (0-100).
 */
export function calculateCalibrationScore(predictions: Prediction[]): number {
  const evaluated = predictions.filter(
    p => p.status === 'succeeded' || p.status === 'failed'
  );
  if (evaluated.length === 0) return 0;
  const successes = evaluated.filter(p => p.status === 'succeeded').length;
  return Math.round((successes / evaluated.length) * 100);
}