import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../Modal';
import QuizSetup from './QuizSetup';
import QuizPlay from './QuizPlay';
import QuizResults from './QuizResults';
import { QuizAnswer, QuizConfig, QuizQuestion, QuizResult } from '../../../data/quiz/quizTypes';
import { generateQuiz } from '../../../utilities/quiz/quizGenerator';
import { decodeQuizCode, mulberry32, randomSeed } from '../../../utilities/quiz/quizCode';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * A shareable quiz code (from a ?quiz=… link). When present on open, the
   * setup screen is skipped and the exact same quiz is rebuilt from the code.
   */
  initialCode?: string | null;
}

type Phase = 'setup' | 'loading' | 'play' | 'results';

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, initialCode }) => {
  const [phase, setPhase] = useState<Phase>('setup');
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  // remembered alongside `questions` so handleFinish reports the right seed
  const seedRef = useRef(0);

  const buildQuiz = useCallback(async (cfg: QuizConfig, quizSeed: number = randomSeed()) => {
    setConfig(cfg);
    seedRef.current = quizSeed;
    setPhase('loading');
    try {
      const qs = await generateQuiz(cfg, mulberry32(quizSeed));
      if (qs.length === 0) {
        toast.error('Not enough data for those options — try more years or question types.');
        setPhase('setup');
        return;
      }
      setQuestions(qs);
      setPhase('play');
    } catch (e) {
      toast.error('Failed to build quiz. Please try again.');
      setPhase('setup');
    }
  }, []);

  // On open: rebuild from a shared code if one was provided, else fresh setup.
  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    if (initialCode) {
      const decoded = decodeQuizCode(initialCode);
      if (decoded) {
        buildQuiz(decoded.config, decoded.seed);
        return;
      }
      toast.error('That quiz code is invalid or out of date.');
    }
    setPhase('setup');
  }, [isOpen, initialCode, buildQuiz]);

  const handleFinish = (answers: QuizAnswer[], elapsedMs: number) => {
    if (!config) return;
    const score = answers.filter((a) => a.correct).length;
    setResult({
      config,
      seed: seedRef.current,
      questions,
      answers,
      score,
      total: questions.length,
      elapsedMs,
    });
    setPhase('results');
  };

  // Play Again is a fresh draw (new seed) of the same config, not a replay.
  const handlePlayAgain = () => {
    if (config) buildQuiz(config);
  };

  const isPlaying = phase === 'play';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={`!max-w-xl${phase === 'setup' ? ' h-[85vh]' : ''}`}
      shouldCloseWarn={isPlaying}
      closeWarning="Leave the quiz? Your progress will be lost."
    >
      <div className="mt-2 flex flex-col min-h-0 flex-1">
        {phase === 'setup' && <QuizSetup onStart={buildQuiz} />}

        {phase !== 'setup' && (
          <div className="max-h-[78vh] overflow-y-auto px-1 -mx-1">
            {phase === 'loading' && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-white/20 border-t-[var(--er-interactive-primary)] rounded-full animate-spin" />
                <p className="text-[var(--er-text-subtle)] text-sm">Building your quiz...</p>
              </div>
            )}

            {phase === 'play' && questions.length > 0 && (
              <QuizPlay key={questions[0]?.id} questions={questions} onFinish={handleFinish} />
            )}

            {phase === 'results' && result && (
              <QuizResults
                result={result}
                onPlayAgain={handlePlayAgain}
                onNewQuiz={() => setPhase('setup')}
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default QuizModal;
