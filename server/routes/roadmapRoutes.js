import express from 'express';
import { RoadmapTask } from '../models/RoadmapTask.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get tasks and streak for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    let tasks = await RoadmapTask.findByUserId(req.user._id);
    if (!tasks || tasks.length === 0) {
      // Seed initial tasks for user
      const initial = [
        { title: 'Morning hydration & mindfulness', category: 'Health', priority: 'high', time: '08:00 AM' },
        { title: 'Core study / focus session', category: 'Study', priority: 'high', time: '10:00 AM' },
        { title: 'Afternoon pet walk & fresh air', category: 'Companion', priority: 'medium', time: '03:00 PM' }
      ];
      tasks = [];
      for (const t of initial) {
        tasks.push(await RoadmapTask.create({ ...t, userId: req.user._id }));
      }
    }
    const streak = await RoadmapTask.calculateStreak(req.user._id);
    res.json({ tasks, streak });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving roadmap tasks', error: err.message });
  }
});

// Create task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, category, priority, time, petId } = req.body;
    if (!title) return res.status(400).json({ message: 'Task title is required' });

    const task = await RoadmapTask.create({
      userId: req.user._id,
      petId,
      title,
      category,
      priority,
      time
    });
    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ message: 'Error creating task', error: err.message });
  }
});

// Toggle / update task
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const task = await RoadmapTask.collection.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (String(task.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const nextCompleted = !task.completed;
    const updated = await RoadmapTask.updateById(task._id, {
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : null
    });
    const streak = await RoadmapTask.calculateStreak(req.user._id);
    res.json({ task: updated, streak });
  } catch (err) {
    res.status(500).json({ message: 'Error updating task', error: err.message });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await RoadmapTask.collection.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (String(task.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await RoadmapTask.deleteById(task._id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting task', error: err.message });
  }
});

export default router;
