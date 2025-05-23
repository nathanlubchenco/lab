"use client";
import React from 'react';
import { Filters } from '../utils/filtering';
import { Prediction } from '../types/prediction';

const statusOptions: { value: Prediction['status']; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'on_track', label: 'On Track' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'failed', label: 'Failed' },
  { value: 'revised', label: 'Revised' },
];

const categoryOptions: { value: Prediction['category']; label: string }[] = [
  { value: 'ai_capabilities', label: 'AI Capabilities' },
  { value: 'adoption', label: 'Adoption' },
  { value: 'economic', label: 'Economic' },
  { value: 'technical', label: 'Technical' },
  { value: 'social', label: 'Social' },
];

interface FilterBarProps {
  filters: Filters;
  onChange: React.Dispatch<React.SetStateAction<Filters>>;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange }) => {
  const toggleStatus = (status: Prediction['status']) => {
    const statuses = filters.statuses || [];
    const has = statuses.includes(status);
    onChange({
      ...filters,
      statuses: has ? statuses.filter(s => s !== status) : [...statuses, status],
    });
  };

  const toggleCategory = (category: Prediction['category']) => {
    const categories = filters.categories || [];
    const has = categories.includes(category);
    onChange({
      ...filters,
      categories: has ? categories.filter(c => c !== category) : [...categories, category],
    });
  };

  const updateMin = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, minConfidence: Number(e.target.value) });
  };

  const updateMax = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, maxConfidence: Number(e.target.value) });
  };

  const clearFilters = () => {
    onChange({ statuses: [], categories: [], minConfidence: 0, maxConfidence: 100 });
  };

  return (
    <div className="bg-gray-800 p-4 rounded-md flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex flex-wrap gap-2">
        {statusOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => toggleStatus(opt.value)}
            className={`px-2 py-1 rounded-full text-sm ${
              filters.statuses?.includes(opt.value)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {categoryOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => toggleCategory(opt.value)}
            className={`px-2 py-1 rounded-full text-sm ${
              filters.categories?.includes(opt.value)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-300">Confidence:</label>
        <input
          type="range"
          min={0}
          max={100}
          value={filters.minConfidence}
          onChange={updateMin}
          className="w-24"
        />
        <span className="text-sm">{filters.minConfidence}% - {filters.maxConfidence}%</span>
        <input
          type="range"
          min={0}
          max={100}
          value={filters.maxConfidence}
          onChange={updateMax}
          className="w-24"
        />
      </div>
      <button
        onClick={clearFilters}
        className="ml-auto bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
      >
        Clear Filters
      </button>
    </div>
  );
};