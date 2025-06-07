import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6 sm:p-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Research & Analysis Lab
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
            A collection of interactive tools and analysis exploring AI capabilities, 
            predictions, and societal impact. Research and insights from{' '}
            <a
              href="https://nathanlubchenco.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              The Future Was Yesterday
            </a>.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Prediction Tracker */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">📊</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                AI Prediction Tracker
              </h2>
            </div>
            <p className="text-gray-700 text-sm mb-6 leading-relaxed">
              Track and calibrate AI predictions from blog posts. See how forecasts 
              evolve over time with evidence-based updates and calibration scoring.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-xs text-gray-600">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Prediction tracking
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                Evidence-based updates
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                Calibration scoring
              </div>
            </div>
            <a 
              href="/predictions"
              className="mt-6 block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition-colors"
            >
              View Predictions →
            </a>
          </div>

          {/* MMLU Quiz */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🧠</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Human vs AI Quiz
              </h2>
            </div>
            <p className="text-gray-700 text-sm mb-6 leading-relaxed">
              Test yourself against AI using questions from MMLU, GPQA, and MATH benchmark datasets. 
              Compare your performance across academic subjects and advanced reasoning.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-xs text-gray-600">
                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                Multiple benchmark datasets
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <span className="w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
                Graduate-level challenges
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <span className="w-2 h-2 bg-rose-400 rounded-full mr-2"></span>
                AI performance comparison
              </div>
            </div>
            <a 
              href="/quiz"
              className="mt-6 block w-full bg-emerald-600 hover:bg-emerald-700 text-white text-center py-3 rounded-lg font-medium transition-colors"
            >
              Take Quiz →
            </a>
          </div>

          {/* AI Job Displacement Analysis */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🏢</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                AI Job Displacement Analysis
              </h2>
            </div>
            <p className="text-gray-700 text-sm mb-6 leading-relaxed">
              In-depth analysis of how AI might impact different job categories 
              and industries over the coming years.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-xs text-gray-600">
                <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                Industry impact analysis
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <span className="w-2 h-2 bg-teal-400 rounded-full mr-2"></span>
                Timeline projections
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                Data-driven insights
              </div>
            </div>
            <a 
              href="/ai_displacement_analysis.html"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block w-full bg-orange-600 hover:bg-orange-700 text-white text-center py-3 rounded-lg font-medium transition-colors"
            >
              View Analysis →
            </a>
          </div>
        </div>

        <footer className="mt-16 text-center">
          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-600 mb-4">
              Part of the AI research and analysis from{' '}
              <a
                href="https://nathanlubchenco.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                The Future Was Yesterday
              </a>
            </p>
            <div className="flex justify-center space-x-6 text-xs text-gray-500">
              <span>© 2025 Research Lab</span>
              <span>•</span>
              <span>Open Source</span>
              <span>•</span>
              <span>Educational Use</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
