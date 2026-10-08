import React, { useState, useEffect } from 'react';
import { CalendarCheck, CheckCircle2, Circle, Flame, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export default function RoadmapTasks({ pet, user }) {
  const [period, setPeriod] = useState('daily');
  const [tasks, setTasks] = useState([]);
  const [streak, setStreak] = useState(0);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getRoadmapTasks();
      setTasks(res.tasks || []);
      setStreak(res.streak ?? 0);
    } catch (err) {
      console.warn('Failed to load roadmap tasks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (id) => {
    try {
      const res = await api.toggleRoadmapTask(id);
      setTasks(tasks.map(t => (t._id === id || t.id === id) ? res.task : t));
      if (res.streak !== undefined) setStreak(res.streak);
    } catch (err) {
      console.warn('Failed to toggle task:', err.message);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const res = await api.createRoadmapTask({
        title: newTaskTitle.trim(),
        petId: pet?._id,
        category: 'Personal'
      });
      setTasks([...tasks, res.task]);
      setNewTaskTitle('');
    } catch (err) {
      console.warn('Failed to create task:', err.message);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Tasks List */}
      <div className="lg:col-span-8 space-y-6">
        <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <CalendarCheck className="w-6 h-6 text-indigo-600" />
                <span>Your Journey Roadmap</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Track your real daily goals, study commitments, and milestones.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
              {['daily', 'weekly', 'monthly'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                    period === p ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Add Task Form */}
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a new goal or milestone..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          <div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
              Tasks ({completedCount}/{tasks.length} completed)
            </span>
            {loading ? (
              <p className="text-xs text-slate-400 py-4">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No tasks yet. Add one above to get started!</p>
            ) : (
              <div className="space-y-2.5">
                {tasks.map((task) => {
                  const taskId = task._id || task.id;
                  return (
                    <div
                      key={taskId}
                      onClick={() => toggleTask(taskId)}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        task.completed
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 font-medium'
                          : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      )}
                      <span className={`text-xs flex-1 ${task.completed ? 'line-through opacity-80' : ''}`}>
                        {task.title || task.text}
                      </span>
                      {task.time && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {task.time}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Progress Circle & Dynamic Streak */}
      <div className="lg:col-span-4 space-y-6">
        {/* Progress Card */}
        <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm text-center space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Progress
          </span>
          <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-1 flex items-center justify-center shadow-md">
            <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800">{progressPercent}%</span>
              <span className="text-[10px] font-bold text-indigo-600">Complete</span>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-700">
            {progressPercent === 100 ? 'All tasks complete! Outstanding work! 🌸' : 'Keep moving forward step by step! 🌸'}
          </p>
        </div>

        {/* Dynamic Streak Tracker Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">
              Active Streak
            </span>
            <div className="text-xl font-extrabold text-slate-800">
              {streak} {streak === 1 ? 'Day' : 'Days'}
            </div>
            <span className="text-[11px] text-slate-600 font-semibold">
              {streak > 0 ? 'Consistent habit in progress!' : 'Complete today\'s tasks to start your streak!'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
