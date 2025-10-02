const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const tasksService = require('../services/tasksService');

const router = express.Router();

router.use(authenticateToken);

router.get('/lists', async (req, res) => {
  try {
    const taskLists = await tasksService.getTaskLists(req.user.userId);
    res.json({ taskLists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { listId } = req.query;
    const tasks = await tasksService.getTasks(req.user.userId, listId);
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { listId } = req.query;
    const task = await tasksService.createTask(req.user.userId, req.body, listId);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { listId } = req.query;
    const task = await tasksService.updateTask(req.user.userId, taskId, req.body, listId);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { listId } = req.query;
    const result = await tasksService.deleteTask(req.user.userId, taskId, listId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:taskId/complete', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { listId } = req.query;
    console.log('Complete task route called:', { taskId, listId, userId: req.user.userId });
    const task = await tasksService.completeTask(req.user.userId, taskId, listId);
    res.json(task);
  } catch (error) {
    console.error('Complete task route error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
