const express = require('express');
const router = express.Router();

// Hardcoded maintenance tasks
const maintenanceTasks = [
  {
    id: '1',
    roomId: '101',
    room: { roomNumber: '101', type: 'Deluxe' },
    issue: 'Leaky faucet in bathroom',
    status: 'pending',
    priority: 'medium',
    reportedBy: 'Reception',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    roomId: '202',
    room: { roomNumber: '202', type: 'Suite' },
    issue: 'AC not cooling',
    status: 'in-progress',
    priority: 'high',
    reportedBy: 'Guest',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    roomId: '303',
    room: { roomNumber: '303', type: 'Standard' },
    issue: 'Broken window lock',
    status: 'completed',
    priority: 'low',
    reportedBy: 'Housekeeping',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /api/maintenance - return all maintenance tasks
router.get('/', (req, res) => {
  res.json(maintenanceTasks);
});

// PUT /api/maintenance/:id - update a maintenance task
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { status, priority, assignedTo } = req.body;
  const task = maintenanceTasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ msg: 'Task not found' });
  }
  if (status) task.status = status;
  if (priority) task.priority = priority;
  if (assignedTo) task.assignedTo = assignedTo;
  task.updatedAt = new Date().toISOString();
  res.json(task);
});

module.exports = router; 