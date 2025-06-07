"use client";

import React, { useState } from 'react';
import { Prediction } from '../../types/prediction';
import predictionsData from '../../data/predictions.json';
import { filterPredictions, sortPredictionsByDate, Filters } from '../../utils/filtering';
import { calculateCalibrationScore } from '../../utils/calculateCalibration';
import { calculateDaysRemaining } from '../../utils/dateHelpers';
import { FilterBar } from '../../components/FilterBar';
import { CalibrationSummary } from '../../components/CalibrationSummary';
import { PredictionCard } from '../../components/PredictionCard';

export default function Home() {
  const [filters, setFilters] = useState<Filters>({ statuses: [], categories: [], minConfidence: 0, maxConfidence: 100 });
  const predictions = predictionsData as Prediction[];

  const filtered = filterPredictions(predictions, filters);
  const sorted = sortPredictionsByDate(filtered);
  const calibrationScore = calculateCalibrationScore(predictions);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4 sm:p-8">
        <header className="mb-6">
          <div className="mb-4">
            <a
              href="/index"
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center gap-1 w-fit"
            >
              ← Back to Lab Index
            </a>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4">
            AI Prediction Tracker
          </h1>
          <p className="text-gray-300 mb-4">
            These predictions are pulled from previous posts on{' '}
            <a
              href="https://nathanlubchenco.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              The Future Was Yesterday
            </a>.{' '}
            <a
              href="/ai_displacement_analysis.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:underline"
            >
              View AI Job Displacement Analysis
            </a>{' '}
            <a
              href="/quiz"
              className="text-yellow-400 hover:underline"
            >
              🧠 Take the MMLU Quiz
            </a>
          </p>
          <CalibrationSummary score={calibrationScore} total={predictions.length} />
          <FilterBar filters={filters} onChange={setFilters} />
        </header>
        <main className="space-y-6">
          {sorted.map(prediction => (
            <PredictionCard
              key={prediction.id}
              prediction={prediction}
              daysRemaining={calculateDaysRemaining(prediction.targetDate)}
            />
          ))}
        </main>
        <footer className="mt-8 text-center text-sm text-gray-500">
          R. Mutt 2025
        </footer>
      </div>
    </div>
  );
}
