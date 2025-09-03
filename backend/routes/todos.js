// routes/todos.js
const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// GET /todos - Get all todos
router.get('/', async (req, res) => {
    try {
        const todos = await Todo.find();
        res.json(todos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /todos/:id - Get single todo
router.get('/:id', async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        res.json(todo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /todos - Create new todo
router.post('/', async (req, res) => {
    try {
        const todo = new Todo({
            task: req.body.task,
            priority: req.body.priority,
            dueDate: req.body.dueDate,
            category: req.body.category
        });

        const newTodo = await todo.save();
        res.status(201).json(newTodo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT /todos/:id - Update todo
router.put('/:id', async (req, res) => {
    try {
        const { task, completed, priority, dueDate, category } = req.body;
        
        // Only update fields that are provided
        const updateFields = {};
        if (task !== undefined) updateFields.task = task.trim();
        if (completed !== undefined) updateFields.completed = completed;
        if (priority !== undefined) updateFields.priority = priority;
        if (dueDate !== undefined) updateFields.dueDate = dueDate;
        if (category !== undefined) updateFields.category = category;
        
        const todo = await Todo.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        );
        
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        
        res.json(todo);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error', 
                error: error.message 
            });
        }
        res.status(500).json({ 
            message: 'Error updating todo', 
            error: error.message 
        });
    }
});

// DELETE /todos/:id - Delete todo
router.delete('/:id', async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }

        await Todo.deleteOne({ _id: req.params.id });
        res.json({ message: 'Todo deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;