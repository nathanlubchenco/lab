import React from 'react';
import { Prediction } from '../types/prediction';

export interface PredictionCardProps {
  prediction: Prediction;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ prediction }) => {
  // TODO: implement prediction card UI with status icon, progress bar, and details
  return (
    <div>
      <h2>{prediction.text}</h2>
    </div>
  );
};