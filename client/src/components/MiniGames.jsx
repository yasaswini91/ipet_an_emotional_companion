import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Sparkles,
  RefreshCw,
  Trophy,
  Smile,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Compass,
  Heart,
  Star,
  Award,
  Lightbulb,
  Check,
  X
} from 'lucide-react';
import PetVisual from './PetVisual';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function MiniGames({ pet, emotion, growth, onAwardXP }) {
  const [activeGame, setActiveGame] = useState(null); // 'tictactoe' | 'wordguess' | 'scramble' | 'vocab' | 'emotion' | 'adventure'
  const [petCheer, setPetCheer] = useState({
    bubble: `Ready to play together, Master? Pick any game! I'm cheering for you! 🐾`,
    animation: 'normal'
  });

  const recordGame = async (gameType, score = 50, result = 'completed') => {
    if (pet?._id) {
      try {
        await api.recordGameResult({
          petId: pet._id,
          gameType,
          score,
          result,
          duration: 45
        });
      } catch (err) {
        console.warn('Game recording failed:', err.message);
      }
    }
    if (onAwardXP) onAwardXP('game');
  };

  // Helper to trigger pet cheer
  const triggerPetReaction = (text, anim = 'bounce') => {
    setPetCheer({ bubble: text, animation: anim });
    setTimeout(() => {
      setPetCheer(prev => ({ ...prev, animation: 'normal' }));
    }, 2000);
  };

  const handleHighFive = () => {
    triggerPetReaction(`High five! 🐾 You're my favorite human! Let's win together! ✨`, 'jump');
    try {
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
    } catch {}
    if (onAwardXP) onAwardXP();
  };

  // ==========================================
  // GAME 1: TIC TAC TOE
  // ==========================================
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [tttWinner, setTttWinner] = useState(null);

  const checkTTTWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (squares.every(s => s !== null)) return 'Tie';
    return null;
  };

  const handleCellClick = (idx) => {
    if (board[idx] || tttWinner || !isXNext) return;

    const newBoard = [...board];
    newBoard[idx] = 'X';
    setBoard(newBoard);

    const w = checkTTTWinner(newBoard);
    if (w) {
      setTttWinner(w);
      if (w === 'X') {
        try { confetti(); } catch {}
        triggerPetReaction(`🎉 Wow Master, you won! That was an amazing tactical move!`, 'celebrate');
        recordGame('tictactoe', 100, 'won');
      } else if (w === 'Tie') {
        triggerPetReaction(`A cozy tie! We think alike, Master! 🤝`, 'normal');
        recordGame('tictactoe', 50, 'tie');
      }
      return;
    }

    triggerPetReaction(`Nice move! Let me calculate my counter-strategy... 🐾`, 'think');
    setIsXNext(false);
    setTimeout(() => {
      const emptyIdxs = newBoard.map((val, i) => val === null ? i : null).filter(val => val !== null);
      if (emptyIdxs.length > 0) {
        const petMove = emptyIdxs[Math.floor(Math.random() * emptyIdxs.length)];
        newBoard[petMove] = 'O';
        setBoard([...newBoard]);
        const petW = checkTTTWinner(newBoard);
        if (petW) {
          setTttWinner(petW);
          if (petW === 'O') {
            triggerPetReaction(`Hehe, I got three in a row! Rematch? 🐾✨`, 'bounce');
            recordGame('tictactoe', 25, 'lost');
          } else if (petW === 'Tie') {
            triggerPetReaction(`A cozy tie! Well played! 🤝`, 'normal');
            recordGame('tictactoe', 50, 'tie');
          }
        } else {
          triggerPetReaction(`Your turn again, Master! Where will you strike? ✨`, 'normal');
        }
      }
      setIsXNext(true);
    }, 500);
  };

  const resetTTT = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setTttWinner(null);
    triggerPetReaction(`New game! Good luck, Master! 🐾`, 'normal');
  };

  // ==========================================
  // GAME 2: WORD GUESS (STUDY & COMPANION VOCAB)
  // ==========================================
  const wordList = [
    { word: 'DATABASE', clue: 'Organized collection of structured information or data' },
    { word: 'SCHEMA', clue: 'The blueprint or structure that defines database organization' },
    { word: 'NORMAL', clue: 'Process of structuring relations to avoid redundancy (1NF, 2NF)' },
    { word: 'PRIMARY', clue: 'A unique key attribute that identifies records in a relation' },
    { word: 'COMPANION', clue: 'Your loyal virtual emotional buddy in iPET!' },
    { word: 'EMOTION', clue: 'Pet internal state simulated via psychological vector models' }
  ];
  const [wordIndex, setWordIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wordMistakes, setWordMistakes] = useState(0);
  const maxMistakes = 6;

  const currentWordObj = wordList[wordIndex];
  const currentWord = currentWordObj.word;
  const isWordWon = currentWord.split('').every(ch => guessedLetters.includes(ch));
  const isWordLost = wordMistakes >= maxMistakes;

  const handleGuessLetter = (letter) => {
    if (guessedLetters.includes(letter) || isWordWon || isWordLost) return;
    const newGuessed = [...guessedLetters, letter];
    setGuessedLetters(newGuessed);

    if (currentWord.includes(letter)) {
      triggerPetReaction(`Great guess! Letter '${letter}' is correct! 💡`, 'bounce');
      if (currentWord.split('').every(ch => newGuessed.includes(ch))) {
        try { confetti(); } catch {}
        triggerPetReaction(`🎉 Superb! You found '${currentWord}'! +15 XP!`, 'celebrate');
        recordGame('wordguess', 80, 'won');
      }
    } else {
      const nextMistakes = wordMistakes + 1;
      setWordMistakes(nextMistakes);
      if (nextMistakes >= maxMistakes) {
        triggerPetReaction(`Aww, the word was '${currentWord}'. Let's try the next one! 🐾`, 'comfort');
        recordGame('wordguess', 20, 'lost');
      } else {
        triggerPetReaction(`Oops, not '${letter}'. Don't give up, Master! ❤️`, 'think');
      }
    }
  };

  const nextWord = () => {
    setWordIndex((wordIndex + 1) % wordList.length);
    setGuessedLetters([]);
    setWordMistakes(0);
    triggerPetReaction(`Here comes a new secret word! Read the clue carefully! 🔤`, 'normal');
  };

  // ==========================================
  // GAME 3: SENTENCE SCRAMBLE
  // ==========================================
  const scramblePuzzles = [
    {
      original: ['Databases', 'store', 'structured', 'information', 'efficiently'],
      hint: 'Core definition of relational database management.'
    },
    {
      original: ['Normalization', 'eliminates', 'unnecessary', 'data', 'redundancy'],
      hint: 'The main academic purpose of 1NF, 2NF and 3NF.'
    },
    {
      original: ['Primary', 'keys', 'uniquely', 'identify', 'table', 'records'],
      hint: 'The most essential concept for database relation integrity.'
    },
    {
      original: ['Luna', 'loves', 'studying', 'together', 'every', 'day'],
      hint: 'Your sweet companion promise!'
    }
  ];
  const [scrambleIdx, setScrambleIdx] = useState(0);
  const [availableWords, setAvailableWords] = useState([]);
  const [assembledWords, setAssembledWords] = useState([]);
  const [scrambleStatus, setScrambleStatus] = useState(null); // 'correct' | 'wrong' | null

  useEffect(() => {
    if (activeGame === 'scramble') {
      const p = scramblePuzzles[scrambleIdx];
      // Shuffle words
      const shuffled = [...p.original].sort(() => Math.random() - 0.5);
      setAvailableWords(shuffled);
      setAssembledWords([]);
      setScrambleStatus(null);
    }
  }, [activeGame, scrambleIdx]);

  const addWordToAssembled = (word, index) => {
    setAssembledWords([...assembledWords, word]);
    setAvailableWords(availableWords.filter((_, i) => i !== index));
    setScrambleStatus(null);
  };

  const removeWordFromAssembled = (word, index) => {
    setAvailableWords([...availableWords, word]);
    setAssembledWords(assembledWords.filter((_, i) => i !== index));
    setScrambleStatus(null);
  };

  const checkScramble = () => {
    const target = scramblePuzzles[scrambleIdx].original.join(' ');
    const attempt = assembledWords.join(' ');
    if (attempt === target) {
      setScrambleStatus('correct');
      try { confetti(); } catch {}
      triggerPetReaction(`✨ Incredible sentence building, Master! +15 XP!`, 'celebrate');
      recordGame('scramble', 80, 'won');
    } else {
      setScrambleStatus('wrong');
      triggerPetReaction(`Almost there! Check the order of the words and try again! 🐾`, 'think');
    }
  };

  const nextScramblePuzzle = () => {
    setScrambleIdx((scrambleIdx + 1) % scramblePuzzles.length);
  };

  // ==========================================
  // GAME 4: VOCABULARY & DBMS QUIZ
  // ==========================================
  const quizQuestions = [
    {
      q: 'Which Normal Form eliminates partial functional dependencies on composite keys?',
      options: ['1NF', '2NF', '3NF', 'BCNF'],
      answer: 1,
      explain: '2NF requires relations to be in 1NF with zero partial key dependencies.'
    },
    {
      q: "In ACID transaction properties, what does 'A' represent?",
      options: ['Availability', 'Atomicity', 'Accuracy', 'Association'],
      answer: 1,
      explain: 'Atomicity ensures transactions are all-or-nothing operations.'
    },
    {
      q: 'Which Normal Form eliminates transitive dependencies (X → Y, Y → Z)?',
      options: ['1NF', '2NF', '3NF', '4NF'],
      answer: 2,
      explain: '3NF removes transitive dependencies where a non-key determines another non-key.'
    },
    {
      q: 'Which SQL keyword is used to filter records matching specified conditions?',
      options: ['GROUP BY', 'WHERE', 'ORDER BY', 'JOIN'],
      answer: 1,
      explain: 'The WHERE clause specifies search conditions for rows.'
    },
    {
      q: 'What is the role of the T+1 Offline Simulation in the iPET architecture?',
      options: [
        'Pre-generates realistic daily virtual schedules and companion memories',
        'Turns off the companion voice',
        'Deletes the pet database',
        'Plays music in the background'
      ],
      answer: 0,
      explain: 'T+1 offline simulation pre-computes daily companion events while the user rests.'
    }
  ];
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleSelectQuizOption = (optIdx) => {
    if (selectedOption !== null) return;
    setSelectedOption(optIdx);

    const isCorrect = optIdx === quizQuestions[quizIdx].answer;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      triggerPetReaction(`🎯 Bullseye! That's 100% correct! You're a DBMS genius!`, 'celebrate');
      try { confetti({ particleCount: 20, spread: 40 }); } catch {}
    } else {
      triggerPetReaction(`Close try! Take a look at the explanation below! 💡`, 'think');
    }
  };

  const nextQuizQuestion = () => {
    if (quizIdx + 1 < quizQuestions.length) {
      setQuizIdx(quizIdx + 1);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
      const finalScore = Math.round((quizScore / quizQuestions.length) * 100);
      recordGame('vocab_quiz', finalScore, finalScore >= 60 ? 'won' : 'completed');
      triggerPetReaction(`🎓 Quiz finished! You scored ${quizScore}/${quizQuestions.length}!`, 'celebrate');
    }
  };

  const resetQuiz = () => {
    setQuizIdx(0);
    setSelectedOption(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  // ==========================================
  // GAME 5: EMOTION GUESS (COMPANION PSYCHOLOGY)
  // ==========================================
  const emotionScenarios = [
    {
      cue: `${pet?.name || 'Luna'} nudges your hand with a warm headbutt, purrs, and brings her favorite squeaky toy.`,
      options: ['Affectionate & Playful', 'Tired & Sleepy', 'Angry & Scared', 'Bored & Lonely'],
      correct: 0,
      detail: 'Interactive nudges and presenting toys indicate high affection and eagerness to play.'
    },
    {
      cue: `${pet?.name || 'Luna'} curls into a fluffy doughnut on your warm keyboard and lets out a soft sigh with closed eyes.`,
      options: ['Hyperactive', 'Cozy & Drowsy', 'Grumpy & Annoyed', 'Hungry'],
      correct: 1,
      detail: 'Curling tightly on warm surfaces with deep sighs indicates cozy relaxation and sleepiness.'
    },
    {
      cue: `${pet?.name || 'Luna'} stands by her empty food dish, looking between the cupboard and your eyes with little meows.`,
      options: ['Curious about birds', 'Hungry for a snack', 'Wants to study SQL', 'Feeling cold'],
      correct: 1,
      detail: 'Positioning by the bowl and making gentle vocalizations is a clear hunger cue.'
    },
    {
      cue: `${pet?.name || 'Luna'} watches a flying butterfly through the sunny window, ears rotating forward and tail twitching gently.`,
      options: ['Curious & Focused', 'Depressed', 'Sleepy', 'Frightened'],
      correct: 0,
      detail: 'Ears forward and slow tail twitches signify heightened curiosity and playful focus.'
    }
  ];
  const [emotionIdx, setEmotionIdx] = useState(0);
  const [selectedEmotion, setSelectedEmotion] = useState(null);

  const handlePickEmotion = (eIdx) => {
    if (selectedEmotion !== null) return;
    setSelectedEmotion(eIdx);
    const correct = eIdx === emotionScenarios[emotionIdx].correct;
    if (correct) {
      try { confetti(); } catch {}
      triggerPetReaction(`💖 Exactly! You understand my feelings so deeply, Master! +15 XP!`, 'celebrate');
      recordGame('emotion_guess', 80, 'won');
    } else {
      triggerPetReaction(`Not quite! But you're learning how I express my mood! 🐾`, 'think');
      recordGame('emotion_guess', 30, 'attempted');
    }
  };

  const nextEmotionScenario = () => {
    setEmotionIdx((emotionIdx + 1) % emotionScenarios.length);
    setSelectedEmotion(null);
  };

  // ==========================================
  // GAME 6: PET ADVENTURE (VILLAGE EXPEDITION)
  // ==========================================
  const adventureLocations = [
    {
      id: 'meadow',
      name: 'Sunflower Meadow',
      icon: '🌻',
      desc: 'Bask in golden sunbeams and catch vibrant butterflies.',
      outcome: `Found a lucky 4-leaf clover! 🍀 ${pet?.name || 'Luna'} had an energizing run!`
    },
    {
      id: 'cafe',
      name: 'Catnip & Milk Cafe',
      icon: '☕',
      desc: 'Sip warm honey milk and socialize with neighboring pets.',
      outcome: `Enjoyed a bowl of gourmet cream! 🥛 Made friends with a cute Shiba Inu!`
    },
    {
      id: 'library',
      name: 'Library of Scrolls',
      icon: '📚',
      desc: 'Discover ancient study parchment and study peaceful lore.',
      outcome: `Read a forgotten scroll on Database Normalization! 📜 Gained +20 Study Wisdom!`
    },
    {
      id: 'lake',
      name: 'Crystal Ripple Lake',
      icon: '🌊',
      desc: 'Skip smooth shiny pebbles across mirror-clear waters.',
      outcome: `Found a glistening iridescent seashell! 🐚 ${pet?.name || 'Luna'} is mesmerized!`
    },
    {
      id: 'tree',
      name: 'Dream Sakura Tree',
      icon: '🌸',
      desc: 'Take a restorative afternoon nap under falling pink petals.',
      outcome: `Had a sweet dream about floating fish snacks! 🐟 Restored full companion energy!`
    }
  ];
  const [exploringLocation, setExploringLocation] = useState(null);
  const [adventureResult, setAdventureResult] = useState(null);

  const startExpedition = (loc) => {
    setExploringLocation(loc);
    setAdventureResult(null);
    triggerPetReaction(`Off to ${loc.name}! I'll be back in just a moment with treasures! 🎒`, 'bounce');

    setTimeout(() => {
      setExploringLocation(null);
      setAdventureResult(loc);
      try { confetti(); } catch {}
      triggerPetReaction(`I'm back, Master! Look what I discovered at ${loc.name}! ✨`, 'celebrate');
      recordGame('adventure', 90, 'completed');
    }, 2000);
  };

  // Game Catalog
  const games = [
    {
      id: 'tictactoe',
      title: 'Tic Tac Toe',
      desc: 'Play classic 3x3 strategic match against your companion!',
      icon: '❌⭕',
      difficulty: 'Easy',
      xp: '+10 XP'
    },
    {
      id: 'wordguess',
      title: 'Word Guess',
      desc: 'Guess study & database terminology before attempts run out!',
      icon: '🔤',
      difficulty: 'Medium',
      xp: '+15 XP'
    },
    {
      id: 'scramble',
      title: 'Sentence Scramble',
      desc: 'Arrange words into meaningful study and companion phrases!',
      icon: '📝',
      difficulty: 'Medium',
      xp: '+15 XP'
    },
    {
      id: 'vocab',
      title: 'DBMS & Vocab Quiz',
      desc: 'Test your database knowledge with 5 multiple-choice questions!',
      icon: '🎓',
      difficulty: 'Study',
      xp: '+20 XP'
    },
    {
      id: 'emotion',
      title: 'Emotion Guess',
      desc: 'Interpret your companion behavioral cues and psychological state!',
      icon: '💖',
      difficulty: 'Fun',
      xp: '+15 XP'
    },
    {
      id: 'adventure',
      title: 'Pet Village Adventure',
      desc: 'Send your pet on virtual world expeditions to find rare treasures!',
      icon: '🌲',
      difficulty: 'Relax',
      xp: '+20 XP'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-rose-100/70 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                Companion Game Arcade
              </h2>
              <span className="text-xs font-semibold text-indigo-600">
                Interactive Multi-Game Hub • Screen 9
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 max-w-xl leading-relaxed">
            Play classic strategy, academic word puzzles, DBMS quizzes, or send {pet?.name || 'Luna'} on virtual village quests! All games award live companion XP and boost affection.
          </p>
        </div>

        {activeGame && (
          <button
            onClick={() => {
              setActiveGame(null);
              triggerPetReaction(`Back to the arcade menu! Which game shall we play next? 🎮`, 'normal');
            }}
            className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Games</span>
          </button>
        )}
      </div>

      {/* Main Grid: Game View + Dedicated Pet Companion Cheerleader Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Game Area (Left 8 cols) */}
        <div className="lg:col-span-8">
          {/* ======================================================== */}
          {/* 1. TIC TAC TOE */}
          {/* ======================================================== */}
          {activeGame === 'tictactoe' && (
            <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6 text-center">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Tic Tac Toe</h3>
                  <p className="text-xs text-slate-500">You (X) vs {pet?.name || 'Luna'} (O)</p>
                </div>
                <button
                  onClick={resetTTT}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restart</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                {board.map((cell, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCellClick(idx)}
                    disabled={!!cell || !!tttWinner || !isXNext}
                    className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-slate-50 hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 text-3xl font-black text-slate-800 flex items-center justify-center transition-all shadow-xs active:scale-95 disabled:hover:border-slate-200"
                  >
                    {cell === 'X' ? (
                      <span className="text-indigo-600 animate-fadeIn">X</span>
                    ) : cell === 'O' ? (
                      <span className="text-pink-500 animate-fadeIn">O</span>
                    ) : ''}
                  </button>
                ))}
              </div>

              {tttWinner && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 font-bold text-xs animate-fadeIn max-w-sm mx-auto">
                  {tttWinner === 'Tie'
                    ? "It's a cozy tie! 🤝 Well played both!"
                    : tttWinner === 'X'
                    ? `🎉 Victory! You defeated ${pet?.name || 'Luna'}! +10 Companion XP!`
                    : `🐾 ${pet?.name || 'Luna'} won this round with clever strategy!`}
                </div>
              )}

              <div className="flex justify-center gap-3">
                <button
                  onClick={resetTTT}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all"
                >
                  Play Another Round
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. WORD GUESS */}
          {/* ======================================================== */}
          {activeGame === 'wordguess' && (
            <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Word Guess Challenge</h3>
                  <p className="text-xs text-slate-500">Guess the secret study word letter by letter</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500">Lives:</span>
                  {Array.from({ length: maxMistakes }).map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-4 h-4 ${i < maxMistakes - wordMistakes ? 'text-rose-500 fill-rose-500' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Clue Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-indigo-700 tracking-wider block">Clue</span>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{currentWordObj.clue}</p>
                </div>
              </div>

              {/* Word Blanks */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 py-6">
                {currentWord.split('').map((letter, idx) => {
                  const isRevealed = guessedLetters.includes(letter) || isWordLost;
                  return (
                    <div
                      key={idx}
                      className={`w-10 h-14 sm:w-12 sm:h-16 rounded-2xl border-2 flex items-center justify-center text-xl sm:text-2xl font-black ${
                        isRevealed
                          ? guessedLetters.includes(letter)
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                            : 'bg-rose-50 border-rose-300 text-rose-700'
                          : 'bg-slate-50 border-slate-200 text-transparent'
                      }`}
                    >
                      {isRevealed ? letter : '_'}
                    </div>
                  );
                })}
              </div>

              {/* Status Message */}
              {isWordWon && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs text-center">
                  🎉 Word solved! You earned +15 Companion XP!
                </div>
              )}
              {isWordLost && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs text-center">
                  Out of attempts! The word was: <span className="font-extrabold">{currentWord}</span>.
                </div>
              )}

              {/* On-Screen Virtual Keyboard */}
              <div className="max-w-xl mx-auto space-y-2">
                <div className="flex flex-wrap justify-center gap-1.5">
                  {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((ch) => {
                    const isGuessed = guessedLetters.includes(ch);
                    return (
                      <button
                        key={ch}
                        onClick={() => handleGuessLetter(ch)}
                        disabled={isGuessed || isWordWon || isWordLost}
                        className={`w-8 h-10 sm:w-9 sm:h-10 rounded-xl text-xs font-extrabold transition-all ${
                          isGuessed
                            ? currentWord.includes(ch)
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-400'
                            : 'bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 active:scale-95'
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={nextWord}
                  className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all shadow-sm"
                >
                  Next Word →
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. SENTENCE SCRAMBLE */}
          {/* ======================================================== */}
          {activeGame === 'scramble' && (
            <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Sentence Scramble</h3>
                  <p className="text-xs text-slate-500">Tap words to arrange them into the correct grammatical sentence</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700">
                  Puzzle {scrambleIdx + 1} of {scramblePuzzles.length}
                </span>
              </div>

              {/* Hint */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs font-medium text-purple-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>Hint: {scramblePuzzles[scrambleIdx].hint}</span>
              </div>

              {/* Assembled Words Box */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Your Sentence:</span>
                <div className="min-h-[70px] p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-wrap items-center gap-2">
                  {assembledWords.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">Click words below to construct the sentence here...</span>
                  ) : (
                    assembledWords.map((word, idx) => (
                      <button
                        key={idx}
                        onClick={() => removeWordFromAssembled(word, idx)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm hover:bg-rose-500 transition-colors flex items-center gap-1.5 group"
                      >
                        <span>{word}</span>
                        <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Available Words Pool */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available Word Blocks:</span>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                  {availableWords.map((word, idx) => (
                    <button
                      key={idx}
                      onClick={() => addWordToAssembled(word, idx)}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-800 text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Alert */}
              {scrambleStatus === 'correct' && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs text-center animate-fadeIn">
                  🎉 Perfect sentence! You built it with 100% accuracy! +15 XP!
                </div>
              )}
              {scrambleStatus === 'wrong' && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs text-center animate-fadeIn">
                  Not quite the exact order! Tap words above to readjust them.
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    const p = scramblePuzzles[scrambleIdx];
                    setAvailableWords([...p.original].sort(() => Math.random() - 0.5));
                    setAssembledWords([]);
                    setScrambleStatus(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs"
                >
                  Reset Words
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={checkScramble}
                    disabled={assembledWords.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-100"
                  >
                    Check Sentence
                  </button>
                  {scrambleStatus === 'correct' && (
                    <button
                      onClick={nextScramblePuzzle}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-100 animate-fadeIn"
                    >
                      Next Phrase →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. VOCABULARY & DBMS QUIZ */}
          {/* ======================================================== */}
          {activeGame === 'vocab' && (
            <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">DBMS & Vocab Quiz</h3>
                  <p className="text-xs text-slate-500">Demonstrate your knowledge and boost study proficiency</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
                  Question {quizIdx + 1} of {quizQuestions.length}
                </span>
              </div>

              {!quizFinished ? (
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider">Question</span>
                    <h4 className="text-sm font-bold text-slate-800 mt-1 leading-snug">
                      {quizQuestions[quizIdx].q}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quizQuestions[quizIdx].options.map((opt, oIdx) => {
                      const isChosen = selectedOption === oIdx;
                      const isCorrect = oIdx === quizQuestions[quizIdx].answer;
                      let btnStyle = 'bg-slate-50 hover:bg-indigo-50 border-slate-200 text-slate-800';

                      if (selectedOption !== null) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-500 text-white border-emerald-600 font-bold';
                        } else if (isChosen) {
                          btnStyle = 'bg-rose-500 text-white border-rose-600 font-bold';
                        } else {
                          btnStyle = 'bg-slate-100 text-slate-400 border-slate-200 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectQuizOption(oIdx)}
                          disabled={selectedOption !== null}
                          className={`p-4 rounded-2xl border text-left text-xs font-semibold transition-all ${btnStyle}`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{opt}</span>
                            {selectedOption !== null && isCorrect && <Check className="w-4 h-4 text-white" />}
                            {selectedOption !== null && isChosen && !isCorrect && <X className="w-4 h-4 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedOption !== null && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 animate-fadeIn">
                      <span className="font-extrabold text-indigo-600 block">Explanation:</span>
                      <p>{quizQuestions[quizIdx].explain}</p>
                    </div>
                  )}

                  {selectedOption !== null && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={nextQuizQuestion}
                        className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100"
                      >
                        {quizIdx + 1 < quizQuestions.length ? 'Next Question →' : 'View Results'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-black">
                    🏆
                  </div>
                  <h4 className="text-lg font-black text-slate-800">Quiz Completed!</h4>
                  <p className="text-xs text-slate-500">
                    You scored <span className="font-extrabold text-indigo-600">{quizScore}</span> out of {quizQuestions.length}!
                  </p>
                  <button
                    onClick={resetQuiz}
                    className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100"
                  >
                    Retake Quiz
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 5. EMOTION GUESS */}
          {/* ======================================================== */}
          {activeGame === 'emotion' && (
            <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Companion Emotion Guess</h3>
                  <p className="text-xs text-slate-500">Observe {pet?.name || 'Luna'} behavior to understand emotional states</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-pink-50 text-pink-700">
                  Scenario {emotionIdx + 1} of {emotionScenarios.length}
                </span>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-pink-50/70 to-purple-50/70 border border-pink-100 space-y-2 text-center">
                <span className="text-3xl">🐾</span>
                <p className="text-sm font-bold text-slate-800 max-w-lg mx-auto leading-relaxed">
                  "{emotionScenarios[emotionIdx].cue}"
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {emotionScenarios[emotionIdx].options.map((opt, idx) => {
                  const isCorrect = idx === emotionScenarios[emotionIdx].correct;
                  const isPicked = selectedEmotion === idx;
                  let style = 'bg-slate-50 hover:bg-pink-50 border-slate-200 text-slate-700';

                  if (selectedEmotion !== null) {
                    if (isCorrect) style = 'bg-emerald-500 text-white border-emerald-600 font-bold';
                    else if (isPicked) style = 'bg-rose-500 text-white border-rose-600 font-bold';
                    else style = 'bg-slate-100 text-slate-400 border-slate-200 opacity-60';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handlePickEmotion(idx)}
                      disabled={selectedEmotion !== null}
                      className={`p-4 rounded-2xl border text-xs font-semibold text-left transition-all ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {selectedEmotion !== null && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 animate-fadeIn">
                  <span className="font-extrabold text-pink-600 block">Companion Psychology:</span>
                  <p className="mt-0.5">{emotionScenarios[emotionIdx].detail}</p>
                </div>
              )}

              {selectedEmotion !== null && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={nextEmotionScenario}
                    className="px-6 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md shadow-pink-100"
                  >
                    Next Scenario →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 6. PET VILLAGE ADVENTURE */}
          {/* ======================================================== */}
          {activeGame === 'adventure' && (
            <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Pet Village Expeditions</h3>
                  <p className="text-xs text-slate-500">Send {pet?.name || 'Luna'} to explore simulated village areas</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span>World Simulation</span>
                </span>
              </div>

              {exploringLocation ? (
                <div className="p-12 text-center space-y-4 bg-emerald-50/40 rounded-3xl border border-emerald-100 animate-pulse">
                  <span className="text-5xl">{exploringLocation.icon}</span>
                  <h4 className="text-base font-extrabold text-slate-800">
                    {pet?.name || 'Luna'} is exploring {exploringLocation.name}...
                  </h4>
                  <p className="text-xs text-slate-500">Searching for rare treasures, flowers, and memories!</p>
                  <div className="w-48 h-2 bg-emerald-200 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full animate-progress" />
                  </div>
                </div>
              ) : adventureResult ? (
                <div className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-200 text-center space-y-4 animate-fadeIn">
                  <span className="text-5xl">{adventureResult.icon}</span>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-800">
                      Expedition Complete: {adventureResult.name}!
                    </h4>
                    <p className="text-xs font-semibold text-emerald-800 mt-2 max-w-md mx-auto leading-relaxed">
                      {adventureResult.outcome}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-700 font-extrabold text-xs shadow-xs">
                    <span>Reward: +20 XP • Affection Up! 💖</span>
                  </div>
                  <div>
                    <button
                      onClick={() => setAdventureResult(null)}
                      className="px-6 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md"
                    >
                      Choose Another Destination
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {adventureLocations.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => startExpedition(loc)}
                      className="p-5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer space-y-2.5 hover:scale-[1.02] active:scale-95 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{loc.icon}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-emerald-700 border border-slate-200">
                          +20 XP
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
                          {loc.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {loc.desc}
                        </p>
                      </div>
                      <button className="w-full py-1.5 rounded-xl bg-white group-hover:bg-emerald-600 group-hover:text-white text-slate-700 font-bold text-[11px] border border-slate-200 transition-colors">
                        Send on Expedition →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ALL GAMES CATALOG MENU */}
          {/* ======================================================== */}
          {!activeGame && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {games.map((g) => (
                <div
                  key={g.id}
                  onClick={() => {
                    setActiveGame(g.id);
                    triggerPetReaction(`Awesome! Let's play ${g.title} together! 🐾✨`, 'bounce');
                  }}
                  className="p-6 rounded-3xl bg-white border border-slate-100 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group hover:scale-[1.02] active:scale-98"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl group-hover:scale-110 transition-transform">{g.icon}</span>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Play Now
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                      {g.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      {g.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-[11px]">
                    <span className="font-bold text-slate-400">{g.difficulty}</span>
                    <span className="font-extrabold text-indigo-600">{g.xp}</span>
                  </div>

                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white font-bold text-xs transition-colors"
                  >
                    Play with {pet?.name || 'Luna'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: PERMANENT PET COMPANION GAMING BUDDY */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-50/80 via-white to-purple-50/80 border border-indigo-100 shadow-sm space-y-5 relative overflow-hidden">
            {/* Companion Title Header */}
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100/70">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Gaming Sidekick
                </span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Cheerleader
              </span>
            </div>

            {/* Pet Speech Bubble (Reacts to Game Events in Realtime) */}
            <div className="relative bg-white/95 backdrop-blur-sm p-4 rounded-2xl rounded-bl-sm border border-indigo-200/80 shadow-sm text-center">
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                {petCheer.bubble}
              </p>
            </div>

            {/* Pet Avatar with Interactive Jump/Bounce */}
            <div className="flex justify-center my-2">
              <div
                className={`transition-all duration-300 ${
                  petCheer.animation === 'bounce'
                    ? 'scale-110 animate-bounce'
                    : petCheer.animation === 'jump'
                    ? 'scale-125 -rotate-6'
                    : petCheer.animation === 'celebrate'
                    ? 'scale-115 animate-spin'
                    : 'hover:scale-105'
                }`}
              >
                <PetVisual
                  species={pet?.species}
                  breed={pet?.breed}
                  customization={pet?.customization}
                  size={140}
                />
              </div>
            </div>

            {/* Pet Stats & Status */}
            <div className="bg-white/80 p-3.5 rounded-2xl border border-indigo-100 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-700">{pet?.name || 'Luna'}</span>
                <span className="text-indigo-600">Lv. {growth?.level || pet?.level || 3}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Mood: {emotion?.currentMood ? emotion.currentMood.charAt(0).toUpperCase() + emotion.currentMood.slice(1) : 'Excited'}</span>
                <span className="text-rose-500 font-bold">❤️ {emotion?.affection ?? 91}% Affection</span>
              </div>
            </div>

            {/* Interactive High Five / Cheer Button */}
            <button
              onClick={handleHighFive}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>High Five {pet?.name || 'Luna'}! 🐾</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Game Perks Card */}
          <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Gaming Rewards
            </span>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>+10 to +20 XP per completed round</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                <Heart className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>Deepens emotional bonding & affection</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span>Generates memories in pet's daily diary</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
