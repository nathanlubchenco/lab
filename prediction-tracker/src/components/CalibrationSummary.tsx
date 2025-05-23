import React from 'react';

interface CalibrationSummaryProps {
  score: number;
  total: number;
}

export const CalibrationSummary: React.FC<CalibrationSummaryProps> = ({
  score,
  total,
}) => {
  return (
    <div className="bg-gray-800 p-4 rounded-md mb-4 shadow-sm">
      <h2 className="text-2xl font-semibold text-white">Calibration</h2>
      <p className="mt-1 text-gray-300">
        Accuracy: <span className="font-bold text-green-400">{score}%</span> (
        {total} predictions)
      </p>
    </div>
  );
};