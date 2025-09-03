// models/Todo.js
const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    task: {
        type: String,
        required: [true, 'Task is required'],
        trim: true,
        maxlength: [200, 'Task cannot be longer than 200 characters']
    },
    completed: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    dueDate: {
        type: Date,
        default: null
    },
    category: {
        type: String,
        trim: true,
        default: 'general'
    }
}, {
    timestamps: true
});

// Add index for better query performance
todoSchema.index({ completed: 1 });
todoSchema.index({ dueDate: 1 });
todoSchema.index({ priority: 1 });

module.exports = mongoose.model('Todo', todoSchema);