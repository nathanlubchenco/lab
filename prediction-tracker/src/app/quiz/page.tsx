"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

interface Question {
  subject: string;
  question: string;
  options: string[];
  correct: number;
  aiCorrect: boolean;
}

interface MMluQuestions {
  [difficulty: string]: Question[];
}


// Import benchmark questions - try direct imports instead of nested structure
import mmluQuestions from '../../data/mmlu_questions.json';
import gpqaQuestionsDirect from '../../data/gpqa_questions.json';
import mathQuestionsDirect from '../../data/math_questions.json';
import benchmarkData from '../../data/benchmark_questions.json';


// Combine all benchmark questions
const allBenchmarks = {
  mmlu: mmluQuestions,
  gpqa: gpqaQuestionsDirect,
  math: mathQuestionsDirect
};


type Benchmark = 'mmlu' | 'gpqa' | 'math';
type Difficulty = 'easy' | 'medium' | 'hard' | 'questions';

// Component to render text with LaTeX math expressions
const MathText: React.FC<{ children: string }> = ({ children }) => {
  // Split text by $ delimiters and render math expressions
  const parts = children.split(/(\$[^$]+\$)/g);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const mathExpression = part.slice(1, -1);
          try {
            return <InlineMath key={index} math={mathExpression} />;
          } catch {
            // Fallback if LaTeX parsing fails
            return <span key={index} className="font-mono bg-gray-100 px-1 rounded">{part}</span>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

export default function QuizPage() {
  const [currentScreen, setCurrentScreen] = useState<'benchmark' | 'difficulty' | 'quiz' | 'results'>('benchmark');
  const [selectedBenchmark, setSelectedBenchmark] = useState<Benchmark>('mmlu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const selectBenchmark = (benchmark: Benchmark) => {
    setSelectedBenchmark(benchmark);
    
    // For MMLU, show difficulty selection. For others, start quiz directly
    if (benchmark === 'mmlu') {
      setCurrentScreen('difficulty');
    } else {
      // Start quiz directly with 'questions' difficulty, passing benchmark explicitly
      startQuiz('questions', benchmark);
    }
  };

  const startQuiz = (selectedDifficulty: Difficulty, overrideBenchmark?: Benchmark) => {
    setDifficulty(selectedDifficulty);
    
    // Use override benchmark if provided (for direct calls), otherwise use state
    const currentBenchmark = overrideBenchmark || selectedBenchmark;
    const benchmarkQuestions = allBenchmarks[currentBenchmark];
    
    // For MMLU, questions are organized by difficulty. For GPQA/MATH, they're now direct arrays
    let difficultyQuestions: Question[];
    if (currentBenchmark === 'mmlu') {
      difficultyQuestions = (benchmarkQuestions as MMluQuestions)[selectedDifficulty] || [];
    } else {
      // GPQA and MATH are now direct arrays
      difficultyQuestions = benchmarkQuestions as Question[];
    }
    
    const shuffled = [...difficultyQuestions].sort(() => Math.random() - 0.5);
    setCurrentQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setCurrentScreen('quiz');
    setAnswered(false);
    setSelectedAnswer(null);
    setTimeLeft(90);
  };

  const selectAnswer = useCallback((index: number) => {
    if (answered) return;
    
    setAnswered(true);
    setSelectedAnswer(index);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (index === currentQuestions[currentIndex].correct) {
      setScore(prev => prev + 1);
    }
  }, [answered, currentQuestions, currentIndex]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (!answered) {
            selectAnswer(-1); // Time's up
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [answered, selectAnswer]);

  const nextQuestion = () => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setAnswered(false);
      setSelectedAnswer(null);
      setTimeLeft(90);
    } else {
      setCurrentScreen('results');
    }
  };



  const goToMainMenu = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    // Navigate back to lab index
    window.location.href = '/';
  };


  useEffect(() => {
    if (currentScreen === 'quiz' && !answered) {
      startTimer();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentIndex, currentScreen, answered, startTimer]);

  const getAIScore = (diff: Difficulty) => {
    // Based on 2025 state-of-the-art AI model performance
    // Source: benchmark_data.txt (Q2 2025 public releases)
    const scores: Record<Difficulty, number> = { 
      easy: 89, 
      medium: 86, 
      hard: 83, 
      questions: selectedBenchmark === 'gpqa' ? 86 : selectedBenchmark === 'math' ? 95 : 86 
    };
    return scores[diff];
  };

  const currentQuestion = currentQuestions[currentIndex];

  // Benchmark selection screen
  if (currentScreen === 'benchmark') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-4xl w-full shadow-lg border border-gray-100 relative">
          <button
            onClick={goToMainMenu}
            className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 transition-colors text-sm flex items-center gap-1"
          >
            ← Back to Lab Index
          </button>
          
          <div className="text-center mt-6">
            <h1 className="text-3xl font-semibold text-gray-900 mb-3">🧠 AI Benchmark Quiz</h1>
            <p className="text-lg text-gray-700 mb-8 font-medium">Test yourself against AI across multiple benchmark datasets</p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* MMLU */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{benchmarkData.mmlu.name}</h3>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">{benchmarkData.mmlu.description}</p>
                <div className="text-xs text-gray-600 mb-4">
                  <div>• 57 academic subjects</div>
                  <div>• High school to graduate level</div>
                  <div>• AI Score: ~92% (widely considered saturated)</div>
                </div>
                <button
                  onClick={() => selectBenchmark('mmlu')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Choose MMLU
                </button>
              </div>

              {/* GPQA */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">🔬</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{benchmarkData.gpqa.name}</h3>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">{benchmarkData.gpqa.description}</p>
                <div className="text-xs text-gray-600 mb-4">
                  <div>• Graduate-level science</div>
                  <div>• Google-proof questions</div>
                  <div>• AI Score: ~86% (Diamond subset)</div>
                </div>
                <button
                  onClick={() => selectBenchmark('gpqa')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Choose GPQA
                </button>
              </div>

              {/* MATH */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">🧮</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{benchmarkData.math.name}</h3>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">{benchmarkData.math.description}</p>
                <div className="text-xs text-gray-600 mb-4">
                  <div>• Competition mathematics</div>
                  <div>• Multi-step reasoning</div>
                  <div>• AI Score: ~95% (500 subset)</div>
                </div>
                <button
                  onClick={() => selectBenchmark('math')}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Choose MATH
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Difficulty selection screen
  if (currentScreen === 'difficulty') {
    const currentBenchmarkData = benchmarkData[selectedBenchmark];
    const availableDifficulties = currentBenchmarkData.difficulties;
    
    const getDifficultyConfig = (diff: string) => {
      const configs = {
        easy: { label: '🌱 Easy', subtitle: 'High School Level', color: 'emerald' },
        medium: { label: '🔥 Medium', subtitle: 'College Level', color: 'amber' },
        hard: { label: '💀 Hard', subtitle: 'Graduate Level', color: 'rose' }
      };
      return configs[diff as keyof typeof configs] || { label: diff, subtitle: '', color: 'gray' };
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-lg border border-gray-100 relative">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setCurrentScreen('benchmark')}
              className="text-gray-600 hover:text-gray-800 transition-colors text-sm flex items-center gap-1"
            >
              ← Choose Different Benchmark
            </button>
            <button
              onClick={goToMainMenu}
              className="text-gray-600 hover:text-gray-800 transition-colors text-sm flex items-center gap-1"
            >
              ← Lab Index
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-gray-900 mb-3">
              {currentBenchmarkData.name}
            </h1>
            <p className="text-lg text-gray-700 mb-6 font-medium">Choose your difficulty level</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="font-medium text-blue-800 text-sm">📊 About This Benchmark</p>
              <p className="text-sm text-blue-700 mt-1">{currentBenchmarkData.description}</p>
            </div>

            <p className="mb-7 text-base text-gray-700">
              You&apos;ll have <span className="font-semibold">90 seconds</span> per question.
              AI typically answers in <span className="font-semibold">0.3 seconds</span>.
            </p>

            <div className="flex flex-col gap-3 justify-center max-w-md mx-auto">
              {availableDifficulties.map((diff) => {
                const config = getDifficultyConfig(diff);
                return (
                  <button
                    key={diff}
                    onClick={() => startQuiz(diff as Difficulty)}
                    className={`bg-${config.color}-500 hover:bg-${config.color}-600 text-white px-6 py-4 rounded-lg text-base font-medium transition-all hover:shadow-md`}
                  >
                    {config.label}
                    {config.subtitle && <div className="text-sm opacity-90 mt-1">{config.subtitle}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'quiz') {
    // If no questions loaded, show error
    if (currentQuestions.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-lg border border-gray-100 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Error Loading Questions</h1>
            <p className="text-gray-700 mb-6">Unable to load questions for {selectedBenchmark.toUpperCase()} benchmark.</p>
            <button
              onClick={() => setCurrentScreen('benchmark')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Back to Benchmark Selection
            </button>
          </div>
        </div>
      );
    }

    if (!currentQuestion) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-lg border border-gray-100 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Loading Question...</h1>
          </div>
        </div>
      );
    }
    const progress = (currentIndex / currentQuestions.length) * 100;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-start justify-center p-4 pt-8">
        <div className="bg-white rounded-xl p-6 max-w-4xl w-full shadow-lg border border-gray-100 relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              {selectedBenchmark === 'mmlu' && (
                <>
                  <button
                    onClick={() => setCurrentScreen('difficulty')}
                    className="text-gray-600 hover:text-gray-800 transition-colors text-sm flex items-center gap-1"
                  >
                    ← Difficulty
                  </button>
                  <span className="text-gray-400">|</span>
                </>
              )}
              <button
                onClick={() => setCurrentScreen('benchmark')}
                className="text-gray-600 hover:text-gray-800 transition-colors text-sm flex items-center gap-1"
              >
                ← Benchmark
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={goToMainMenu}
                className="text-gray-600 hover:text-gray-800 transition-colors text-sm flex items-center gap-1"
              >
                ← Lab Index
              </button>
            </div>
            <div className="text-2xl font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
              {timeLeft}s
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              Question {currentIndex + 1} of {currentQuestions.length}
            </div>
            <div className="text-sm font-medium text-gray-800">
              Score: {score}/{currentIndex + (answered ? 1 : 0)} correct
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm mb-4 border border-blue-200 font-medium">
            {currentQuestion.subject}
          </div>

          <h2 className="text-xl font-medium text-gray-900 mb-6 leading-relaxed">
            <MathText>{currentQuestion.question}</MathText>
          </h2>

          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => selectAnswer(index)}
                disabled={answered}
                className={`w-full p-4 text-left border rounded-lg transition-all text-base ${
                  answered
                    ? index === currentQuestion.correct
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                      : index === selectedAnswer && index !== currentQuestion.correct
                      ? 'border-rose-400 bg-rose-50 text-rose-800'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer text-gray-800'
                }`}
              >
                <MathText>{option}</MathText>
              </button>
            ))}
          </div>

          {answered && (
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-lg mb-6">
              <h3 className="text-base font-medium text-slate-800 mb-3">🤖 AI Performance</h3>
              <div className="space-y-1 text-sm text-slate-700">
                <p><span className="font-medium">Modern AI models:</span> {currentQuestion.aiCorrect ? '✅ Typically correct' : '❌ Sometimes incorrect'}</p>
                <p><span className="font-medium">AI accuracy on {difficulty} questions:</span> ~{getAIScore(difficulty)}%</p>
                <p><span className="font-medium">Your time:</span> {90 - timeLeft} seconds</p>
                {selectedAnswer === -1 && <p className="text-rose-600 font-medium">⏰ Time&apos;s up!</p>}
              </div>
            </div>
          )}

          {answered && (
            <div className="flex gap-3 justify-between">
              <button
                onClick={() => setCurrentScreen(selectedBenchmark === 'mmlu' ? 'difficulty' : 'benchmark')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                {selectedBenchmark === 'mmlu' ? 'Exit to Difficulty' : 'Exit to Benchmark'}
              </button>
              <button
                onClick={nextQuestion}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base font-medium transition-all"
              >
                {currentIndex < currentQuestions.length - 1 ? 'Next Question →' : 'See Results →'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentScreen === 'results') {
    const percentage = (score / currentQuestions.length) * 100;
    const aiPercentage = getAIScore(difficulty);
    const aiScore = Math.round((aiPercentage / 100) * currentQuestions.length);

    let emoji, message;
    const benchmarkName = selectedBenchmark.toUpperCase();
    if (percentage >= aiPercentage) {
      emoji = '🏆';
      message = `Incredible! You matched or beat typical AI performance on ${benchmarkName}.`;
    } else if (percentage >= 80) {
      emoji = '⭐';
      message = `Impressive! You're performing at expert level on ${benchmarkName}.`;
    } else if (percentage >= 60) {
      emoji = '👍';
      message = `Good job! You're above average on these ${benchmarkName} questions.`;
    } else {
      emoji = '🤔';
      message = `Not bad! These ${benchmarkName} questions are really challenging.`;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-lg border border-gray-100 text-center relative">
          <button
            onClick={goToMainMenu}
            className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 transition-colors text-sm flex items-center gap-1"
          >
            ← Back to Lab Index
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2 mt-6">🏁 Quiz Complete!</h1>
          <p className="text-sm text-gray-600 mb-4">{benchmarkData[selectedBenchmark].name} - {difficulty}</p>
          <div className="text-5xl mb-6">{emoji}</div>
          
          <div className="flex justify-around mb-8">
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-700">Your Score</h3>
              <div className="text-3xl font-semibold text-blue-600">{score}/{currentQuestions.length}</div>
              <div className="text-base text-gray-600">({percentage.toFixed(0)}%)</div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-700">AI Score (State-of-Art)</h3>
              <div className="text-3xl font-semibold text-emerald-600">~{aiScore}/{currentQuestions.length}</div>
              <div className="text-base text-gray-600">({aiPercentage}%)</div>
            </div>
          </div>

          <p className="text-base mb-6 text-gray-700 font-medium">{message}</p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="font-medium text-blue-800 text-sm">💡 Context</p>
            <p className="text-sm text-blue-700 mt-1">
              {selectedBenchmark === 'mmlu' 
                ? 'MMLU is now widely considered saturated by modern AI - achieving ~92% across all 57 subjects!' 
                : selectedBenchmark === 'gpqa'
                ? 'GPQA Diamond questions are still challenging for AI, especially in biology. Tool-augmented runs can push >90%.'
                : 'MATH scores >90% suggest heavy pre-training exposure. Labs now use private datasets for cleaner evaluation.'}
            </p>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            {selectedBenchmark === 'mmlu' && (
              <button
                onClick={() => setCurrentScreen('difficulty')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base font-medium transition-all"
              >
                Try Different Difficulty
              </button>
            )}
            <button
              onClick={() => setCurrentScreen('benchmark')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg text-base font-medium transition-all"
            >
              Try Different Benchmark
            </button>
            <button
              onClick={goToMainMenu}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg text-base font-medium transition-all"
            >
              Back to Lab Index
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: should never reach here, but just in case
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-lg border border-gray-100 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Unexpected State</h1>
        <p className="text-gray-700 mb-6">
          Current screen: {currentScreen}<br/>
          Selected benchmark: {selectedBenchmark}<br/>
          Questions loaded: {currentQuestions.length}
        </p>
        <button
          onClick={() => {
            setCurrentScreen('benchmark');
            setCurrentQuestions([]);
            setCurrentIndex(0);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          Reset to Benchmark Selection
        </button>
      </div>
    </div>
  );
}