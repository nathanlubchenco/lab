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

interface QuestionSet {
  [key: string]: Question[];
}

// Import real MMLU questions
import mmluQuestions from '../../data/mmlu_questions.json';

const questions: QuestionSet = mmluQuestions;

type Difficulty = 'easy' | 'medium' | 'hard';

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
  const [currentScreen, setCurrentScreen] = useState<'start' | 'quiz' | 'results'>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startQuiz = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    const shuffled = [...questions[selectedDifficulty]].sort(() => Math.random() - 0.5);
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

  const restart = () => {
    setCurrentScreen('start');
    setCurrentIndex(0);
    setScore(0);
    setAnswered(false);
    setSelectedAnswer(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const goToMainMenu = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    // Navigate back to lab index
    window.location.href = '/index';
  };

  const goToQuizStart = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    restart(); // This will go back to quiz start screen
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
    // Based on actual GPT-4 performance across different subject categories
    // Easy = high school level, Medium = college level, Hard = graduate/professional level
    const scores = { easy: 89, medium: 86, hard: 83 };
    return scores[diff];
  };

  const currentQuestion = currentQuestions[currentIndex];

  if (currentScreen === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-lg border border-gray-100 relative">
          <button
            onClick={goToMainMenu}
            className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 transition-colors text-sm flex items-center gap-1"
          >
            ← Back to Lab Index
          </button>
          <div className="text-center mt-6">
            <h1 className="text-3xl font-semibold text-gray-900 mb-3">🧠 Human vs AI: The MMLU Challenge</h1>
            <p className="text-lg text-gray-700 mb-6 font-medium">Think you&apos;re smarter than AI? Let&apos;s find out!</p>
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-5 text-left">
              <p className="font-medium text-emerald-800 text-sm">✅ Authentic MMLU Questions</p>
              <p className="text-sm text-emerald-700 mt-1">This quiz uses real questions from the official Massive Multitask Language Understanding (MMLU) benchmark dataset.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="font-medium text-blue-800 text-sm">📊 Benchmark Context</p>
              <p className="text-sm text-blue-700 mt-1">The MMLU benchmark tests knowledge across 57 subjects. AI models like GPT-4 score around 86% overall, while human experts average around 89.8%.</p>
            </div>

            <p className="mb-7 text-base text-gray-700">
              Choose your difficulty level. You&apos;ll have <span className="font-semibold">90 seconds</span> per question.
              AI typically answers in <span className="font-semibold">0.3 seconds</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => startQuiz('easy')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-lg text-base font-medium transition-all hover:shadow-md"
              >
                🌱 Easy
                <div className="text-sm opacity-90 mt-1">High School Level</div>
              </button>
              <button
                onClick={() => startQuiz('medium')}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-4 rounded-lg text-base font-medium transition-all hover:shadow-md"
              >
                🔥 Medium
                <div className="text-sm opacity-90 mt-1">College Level</div>
              </button>
              <button
                onClick={() => startQuiz('hard')}
                className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-4 rounded-lg text-base font-medium transition-all hover:shadow-md"
              >
                💀 Hard
                <div className="text-sm opacity-90 mt-1">Graduate Level</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'quiz' && currentQuestion) {
    const progress = (currentIndex / currentQuestions.length) * 100;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-start justify-center p-4 pt-8">
        <div className="bg-white rounded-xl p-6 max-w-4xl w-full shadow-lg border border-gray-100 relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={goToQuizStart}
                className="text-gray-600 hover:text-gray-800 transition-colors text-sm flex items-center gap-1"
              >
                ← Quiz Start
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
                onClick={goToQuizStart}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Exit to Quiz Start
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
    if (percentage >= aiPercentage) {
      emoji = '🏆';
      message = `Incredible! You matched or beat typical AI performance on ${difficulty} questions.`;
    } else if (percentage >= 80) {
      emoji = '⭐';
      message = 'Impressive! You&apos;re performing at expert level.';
    } else if (percentage >= 60) {
      emoji = '👍';
      message = 'Good job! You&apos;re above average.';
    } else {
      emoji = '🤔';
      message = 'Not bad! These questions are tough.';
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
          <h1 className="text-2xl font-semibold text-gray-900 mb-4 mt-6">🏁 Quiz Complete!</h1>
          <div className="text-5xl mb-6">{emoji}</div>
          
          <div className="flex justify-around mb-8">
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-700">Your Score</h3>
              <div className="text-3xl font-semibold text-blue-600">{score}/{currentQuestions.length}</div>
              <div className="text-base text-gray-600">({percentage.toFixed(0)}%)</div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-700">AI Score (GPT-4)</h3>
              <div className="text-3xl font-semibold text-emerald-600">~{aiScore}/{currentQuestions.length}</div>
              <div className="text-base text-gray-600">({aiPercentage}%)</div>
            </div>
          </div>

          <p className="text-base mb-6 text-gray-700 font-medium">{message}</p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="font-medium text-blue-800 text-sm">💡 Context</p>
            <p className="text-sm text-blue-700 mt-1">Remember, AI maintains this performance across ALL 57 subjects simultaneously!</p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={restart}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base font-medium transition-all"
            >
              Try Again
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

  return null;
}