import React, { useState } from 'react';
import {
  Brain,
  Search,
  Plus,
  Network,
  Trash2,
  Bookmark,
  Sparkles,
  Calendar,
  Clock,
  ShieldCheck,
  Tag,
  X,
  Check
} from 'lucide-react';

export default function MemoryPanel({
  pet,
  memories = [],
  onProcessMemories,
  onDeleteMemory,
  onSearchMemories,
  onAddMemory,
  isProcessing
}) {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'PERMANENT', 'LONG_TERM', 'SHORT_TERM'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Add Memory Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState('LONG_TERM');
  const [isSavingMemory, setIsSavingMemory] = useState(false);

  const normalizeCat = (cat) => {
    const s = String(cat || '').toUpperCase().replace(/[-\s]/g, '_');
    if (s.includes('PERM')) return 'PERMANENT';
    if (s.includes('LONG')) return 'LONG_TERM';
    return 'SHORT_TERM';
  };

  const permanentCount = memories.filter(m => normalizeCat(m.category) === 'PERMANENT').length;
  const longTermCount = memories.filter(m => normalizeCat(m.category) === 'LONG_TERM').length;
  const shortTermCount = memories.filter(m => normalizeCat(m.category) === 'SHORT_TERM').length;

  const filteredMemories = activeTab === 'ALL'
    ? memories
    : (memories || []).filter(m => normalizeCat(m.category) === activeTab);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await onSearchMemories(searchQuery);
      setSearchResults(res?.results || []);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveNewMemory = async (e) => {
    e.preventDefault();
    if (!newMemoryContent.trim()) return;
    setIsSavingMemory(true);
    try {
      await onAddMemory(newMemoryContent.trim(), newMemoryCategory);
      setNewMemoryContent('');
      setIsAddModalOpen(false);
    } finally {
      setIsSavingMemory(false);
    }
  };

  const getCategoryBadge = (category) => {
    const cat = normalizeCat(category);
    if (cat === 'PERMANENT') {
      return {
        label: 'Permanent',
        retention: 'Indefinite',
        bg: 'bg-purple-100 text-purple-800 border-purple-200',
        dot: 'bg-purple-500',
        iconBg: 'bg-purple-100 text-purple-600',
        cardBorder: 'hover:border-purple-300'
      };
    }
    if (cat === 'LONG_TERM') {
      return {
        label: 'Long-term',
        retention: '3 Months',
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
        dot: 'bg-blue-500',
        iconBg: 'bg-blue-100 text-blue-600',
        cardBorder: 'hover:border-blue-300'
      };
    }
    return {
      label: 'Short-term',
      retention: '1 Month',
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      iconBg: 'bg-emerald-100 text-emerald-600',
      cardBorder: 'hover:border-emerald-300'
    };
  };

  // Generate dynamic memory summary from active memories
  const buildMemorySummary = () => {
    if (!memories || memories.length === 0) {
      return `Chat with ${pet?.name} about your day, work, or hobbies, or click "Extract From Recent Chat" to synthesize your personal memory knowledge base!`;
    }

    const perm = memories.filter(m => normalizeCat(m.category) === 'PERMANENT');
    const long = memories.filter(m => normalizeCat(m.category) === 'LONG_TERM');
    const short = memories.filter(m => normalizeCat(m.category) === 'SHORT_TERM');

    const highlights = [];
    if (perm.length > 0) highlights.push(`Core facts: ${perm.slice(0, 2).map(m => m.content).join('; ')}`);
    if (long.length > 0) highlights.push(`Interests & projects: ${long.slice(0, 2).map(m => m.content).join('; ')}`);
    if (short.length > 0) highlights.push(`Recent notes: ${short.slice(0, 1).map(m => m.content).join('; ')}`);

    return `${pet?.name} actively remembers ${memories.length} facts about you! ${highlights.join('. ')}.`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Categorized Memories View */}
      <div className="lg:col-span-8 space-y-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-5">
          {/* Top Category Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl flex-wrap">
              {[
                { id: 'ALL', label: 'All Memories', count: memories.length },
                { id: 'PERMANENT', label: 'Permanent', count: permanentCount },
                { id: 'LONG_TERM', label: 'Long-term', count: longTermCount },
                { id: 'SHORT_TERM', label: 'Short-term', count: shortTermCount }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchResults(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-white/60'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border border-indigo-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Memory</span>
              </button>
            </div>
          </div>

          {/* Category Description Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold">
                {activeTab === 'ALL' && 'All Categorized Memories: 3-Tier Cognitive Architecture defined by retention stability (iPET Paper)'}
                {activeTab === 'PERMANENT' && '🟣 Permanent Memory: Enduring user traits & preferences (e.g. favorite food is pizza, likes sci-fi, name is Yash) — Retained indefinitely'}
                {activeTab === 'LONG_TERM' && '🔵 Long-term Memory: Medium-term plans, intentions & skill acquisition (e.g. learning Python, hackathons, exam prep) — Retained for 3 months'}
                {activeTab === 'SHORT_TERM' && '🟢 Short-term Memory: Transient details, recent events & immediate tasks (e.g. exam tomorrow, went to park, feeling tired) — Retained for 1 month'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              Dense 384D Embeddings
            </span>
          </div>

          {/* Search Results Display */}
          {searchResults ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                <span>Semantic Search Cosine Similarity Ranking:</span>
                <button
                  onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                  className="text-slate-400 hover:text-slate-600 underline text-[11px]"
                >
                  Clear Search
                </button>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  No memories matched this query above threshold.
                </div>
              ) : (
                searchResults.map((item, idx) => {
                  const badge = getCategoryBadge(item.category);
                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white font-mono">
                            Cosine Sim: {Number(item.similarityScore || item.similarity || 0).toFixed(3)}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800">{item.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-3">
              <Brain className="w-10 h-10 text-slate-200 mx-auto" />
              <p className="font-semibold text-slate-500">
                {activeTab === 'ALL'
                  ? 'No memories recorded yet!'
                  : `No ${activeTab.replace('_', ' ').toLowerCase()} memories recorded yet.`}
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Chat with {pet?.name} about your work, plans, or hobbies, or click "+ Add Memory" to manually record a memory.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMemories.map((mem) => {
                const badge = getCategoryBadge(mem.category);
                return (
                  <div
                    key={mem._id}
                    className={`p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/80 ${badge.cardBorder} shadow-sm transition-all flex items-start justify-between gap-3 group`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl ${badge.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Bookmark className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            <span>{badge.label}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Retention: {badge.retention}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 leading-relaxed">
                          {mem.content}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-0.5">
                          <span>Recorded: {new Date(mem.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Expires: {mem.expiresAt ? new Date(mem.expiresAt).toLocaleDateString() : 'Never'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteMemory(mem._id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Memory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Actions, Dense Search & Dynamic Memory Summary */}
      <div className="lg:col-span-4 space-y-6">
        {/* Memory Actions Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-500" />
            <span>Memory Operations</span>
          </h3>

          {/* Dense Retrieval Search Input */}
          <form onSubmit={handleSearch} className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories (Cosine sim)..."
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSearching ? 'Ranking Embeddings...' : 'Search Memories'}
            </button>
          </form>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={onProcessMemories}
              disabled={isProcessing}
              className="w-full flex items-center gap-2.5 p-3 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-800 border border-indigo-200 text-xs font-bold transition-all text-left cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 text-indigo-600 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Extracting from Chat...' : 'Extract From Recent Chat'}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100 text-xs font-bold transition-all text-left cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>Manually Add New Memory</span>
            </button>
          </div>
        </div>

        {/* Dynamic Memory Summary Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-pink-50/60 border border-purple-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-purple-900 font-extrabold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Companion Memory Summary</span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {buildMemorySummary()}
          </p>

          <div className="pt-2 flex items-center justify-between text-[11px] text-purple-700 font-bold border-t border-purple-100/60">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Active in Dialogue Context</span>
            </span>
            <span className="font-mono">{memories.length} Facts Stored</span>
          </div>
        </div>
      </div>

      {/* Add Memory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-800">
                  Record Memory for {pet?.name}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMemory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Memory Content</label>
                <textarea
                  rows={3}
                  value={newMemoryContent}
                  onChange={(e) => setNewMemoryContent(e.target.value)}
                  placeholder="e.g. User's favorite food is pizza (Permanent), User is learning Python (Long-term), User has an exam tomorrow (Short-term)..."
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Category & Retention Stability</label>
                <select
                  value={newMemoryCategory}
                  onChange={(e) => setNewMemoryCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="PERMANENT">🟣 Permanent Memory (Enduring traits & preferences, favorites, name — Retained indefinitely)</option>
                  <option value="LONG_TERM">🔵 Long-term Memory (Medium-term plans, intentions, skill acquisition — Retained for 3 months)</option>
                  <option value="SHORT_TERM">🟢 Short-term Memory (Transient details, recent events, immediate tasks, current feelings — Retained for 1 month)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMemory || !newMemoryContent.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingMemory ? 'Saving...' : 'Save Memory'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
