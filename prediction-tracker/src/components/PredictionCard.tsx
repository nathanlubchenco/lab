"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Prediction } from '../types/prediction';
import { StatusIcon } from './StatusIcon';
import { format, parseISO } from 'date-fns';

const statusLabels: Record<Prediction['status'], string> = {
  pending: 'Pending',
  on_track: 'On track',
  at_risk: 'At risk',
  succeeded: 'Succeeded',
  failed: 'Failed',
  revised: 'Revised',
};

export interface PredictionCardProps {
  prediction: Prediction;
  daysRemaining: number;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  daysRemaining,
}) => {
  const created = parseISO(prediction.dateCreated);
  const target = parseISO(prediction.targetDate);
  const now = new Date();
  const totalMs = target.getTime() - created.getTime();
  const passedMs = now.getTime() - created.getTime();
  const progress = totalMs > 0 ? Math.min(100, Math.max(0, (passedMs / totalMs) * 100)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-800 p-4 rounded-md shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">{prediction.text}</h2>
        <div className="flex items-center space-x-1">
          <StatusIcon status={prediction.status} />
          <span className="text-sm font-medium text-gray-200">
            {statusLabels[prediction.status]}
          </span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap text-sm text-gray-400 gap-4">
        <span>Created: {format(created, 'MMM d, yyyy')}</span>
        <span>Target: {format(target, 'MMM d, yyyy')}</span>
        <span>Confidence: {prediction.confidence}%</span>
      </div>
      <div className="mt-3">
        <div className="relative w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-blue-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 mt-1 block">
          {daysRemaining} days remaining
        </span>
      </div>
      <details className="mt-4 group">
        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
          Details
        </summary>
        <div className="mt-2 space-y-3 text-sm text-gray-200">
          <p>{prediction.reasoning}</p>
          {prediction.evidence && prediction.evidence.length > 0 && (
            <div>
              <h3 className="font-semibold text-white">Evidence</h3>
              <ul className="list-disc list-inside">
                {prediction.evidence.map((ev, idx) => (
                  <li key={idx}>
                    <span className="text-gray-400">{format(parseISO(ev.date), 'MMM d, yyyy')}: </span>
                    {ev.link ? (
                      <a
                        href={ev.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {ev.note}
                      </a>
                    ) : (
                      ev.note
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <a
            href={prediction.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Source
          </a>
        </div>
      </details>
    </motion.div>
  );
};