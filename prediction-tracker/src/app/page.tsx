"use client";

import Image from "next/image";

import React, { useState } from 'react';
import { Prediction } from '../types/prediction';
import predictionsData from '../data/predictions.json';
import { filterPredictions, sortPredictionsByDate } from '../utils/filtering';
import { calculateCalibrationScore } from '../utils/calculateCalibration';
import { calculateDaysRemaining } from '../utils/dateHelpers';
import { FilterBar } from '../components/FilterBar';
import { CalibrationSummary } from '../components/CalibrationSummary';
import { PredictionCard } from '../components/PredictionCard';

export default function Home() {
  const [filters, setFilters] = useState({ statuses: [], categories: [], minConfidence: 0, maxConfidence: 100 });
  const predictions: Prediction[] = predictionsData;

  const filtered = filterPredictions(predictions, filters);
  const sorted = sortPredictionsByDate(filtered);
  const calibrationScore = calculateCalibrationScore(predictions);

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen p-4 sm:p-8">
      <header className="mb-6">
        <CalibrationSummary score={calibrationScore} total={predictions.length} />
        <FilterBar filters={filters} onChange={setFilters} />
      </header>
      <main className="space-y-4">
        {sorted.map(prediction => (
          <PredictionCard
            key={prediction.id}
            prediction={prediction}
            daysRemaining={calculateDaysRemaining(prediction.targetDate)}
          />
        ))}
      </main>
    </div>
  );
}
