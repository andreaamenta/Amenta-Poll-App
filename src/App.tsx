/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, CheckCircle2, Users, ArrowRight } from 'lucide-react';

interface Option {
  id: number;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: Option[];
}

export default function App() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await fetch('/api/polls');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setPolls(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching polls:', error);
      setLoading(false);
    }
  };

  const handleOptionSelect = (pollId: string, optionId: number) => {
    setSelectedOptions(prev => ({ ...prev, [pollId]: optionId }));
  };

  const handleNext = () => {
    if (currentStep < polls.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitAllVotes();
    }
  };

  const submitAllVotes = async () => {
    setLoading(true);
    try {
      // Submit all votes in a single batch request for speed
      const response = await fetch('/api/vote-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votes: selectedOptions }),
      });
      
      if (!response.ok) throw new Error('Failed to submit votes');
      
      const result = await response.json();
      if (result.success) {
        setPolls(result.polls);
        setHasVoted(true);
      }
    } catch (error) {
      console.error('Error submitting votes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (polls.length === 0) return null;

  const currentPoll = polls[currentStep];
  const isLastStep = currentStep === polls.length - 1;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100">
      <main className="max-w-2xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!hasVoted ? (
            <motion.div
              key={`poll-${currentPoll.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="space-y-4">
                <div className="flex justify-between items-center">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-emerald-600 font-bold text-xs tracking-widest uppercase bg-emerald-50 px-3 py-1 rounded-full"
                  >
                    Domanda {currentStep + 1} di {polls.length}
                  </motion.div>
                  <div className="h-1.5 w-32 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentStep + 1) / polls.length) * 100}%` }}
                    />
                  </div>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                  {currentPoll.question}
                </h1>
              </header>

              <div className="grid gap-3">
                {currentPoll.options.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleOptionSelect(currentPoll.id, option.id)}
                    className={`
                      relative flex items-center p-5 rounded-2xl border-2 transition-all duration-200 text-left
                      ${selectedOptions[currentPoll.id] === option.id 
                        ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/10' 
                        : 'border-white bg-white hover:border-slate-200 shadow-sm'}
                    `}
                  >
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 transition-colors
                      ${selectedOptions[currentPoll.id] === option.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}
                    `}>
                      {selectedOptions[currentPoll.id] === option.id && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-base font-medium">{option.text}</span>
                  </motion.button>
                ))}
              </div>

              <motion.button
                disabled={!selectedOptions[currentPoll.id]}
                onClick={handleNext}
                className={`
                  w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all
                  ${selectedOptions[currentPoll.id] 
                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                `}
              >
                {isLastStep ? 'Concludi e vedi i risultati' : 'Prossima Domanda'}
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <header className="text-center space-y-4 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50">
                <div className="inline-flex p-4 bg-emerald-50 rounded-3xl">
                  <BarChart3 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-4xl font-black tracking-tighter">Report Finale</h2>
                <p className="text-slate-500 font-medium">Sistemi Informativi Aziendali - 4^ SIA</p>
              </header>

              <div className="grid gap-6">
                {polls.map((poll) => {
                  const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
                  return (
                    <motion.div 
                      key={poll.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-8 rounded-[2rem] shadow-lg shadow-slate-200/30 space-y-6"
                    >
                      <h3 className="text-xl font-bold leading-snug">{poll.question}</h3>
                      <div className="space-y-5">
                        {poll.options.map((option) => {
                          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                          const isUserChoice = selectedOptions[poll.id] === option.id;
                          return (
                            <div key={option.id} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className={`text-sm font-bold ${isUserChoice ? 'text-emerald-600' : 'text-slate-600'}`}>
                                  {option.text} {isUserChoice && '(Tua scelta)'}
                                </span>
                                <span className="text-sm font-black text-slate-900">{percentage}%</span>
                              </div>
                              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 1.2, ease: "circOut" }}
                                  className={`h-full rounded-full ${isUserChoice ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="pt-4 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <Users className="w-4 h-4" />
                        {totalVotes} voti totali
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <button 
                onClick={() => {
                  setHasVoted(false);
                  setSelectedOptions({});
                  setCurrentStep(0);
                }}
                className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-bold text-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
              >
                Ricomincia il Test
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
