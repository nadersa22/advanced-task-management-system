// API Configuration
const API_URL = 'http://localhost:3000/todos'; // Should be exactly this

// DOM Elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const filterBtns = document.querySelectorAll('.filter-btn');
const priorityFilters = document.querySelectorAll('.priority-filter');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');

// Form inputs
const prioritySelect = document.getElementById('prioritySelect');
const dueDateInput = document.getElementById('dueDateInput');
const categoryInput = document.getElementById('categoryInput');

// Statistics
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const completedCount = document.getElementById('completedCount');
const overdueCount = document.getElementById('overdueCount');

// Action buttons
const clearCompleted = document.getElementById('clearCompleted');
const exportTodos = document.getElementById('exportTodos');
const importTodos = document.getElementById('importTodos');
const importBtn = document.getElementById('importBtn');

// Modal elements
const editModal = document.getElementById('editModal');
const editTaskInput = document.getElementById('editTaskInput');
const editPrioritySelect = document.getElementById('editPrioritySelect');
const editDueDateInput = document.getElementById('editDueDateInput');
const editCategoryInput = document.getElementById('editCategoryInput');
const closeModal = document.getElementById('closeModal');
const cancelEdit = document.getElementById('cancelEdit');
const saveEdit = document.getElementById('saveEdit');

// Application State
let todos = [];
let currentFilter = 'all';
let currentPriorityFilter = 'all';
let searchQuery = '';
let editingTodoId = null;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    setupEventListeners();
    loadFromLocalStorage();
    setMinDate();
});

// Event Listeners Setup
function setupEventListeners() {
    // Add todo
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    
    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentFilter = e.target.dataset.filter;
            updateFilterButtons();
            renderTodos();
        });
    });
    
    priorityFilters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentPriorityFilter = e.target.dataset.priority;
            updatePriorityFilterButtons();
            renderTodos();
        });
    });
    
    // Search
    searchInput.addEventListener('input', handleSearch);
    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearch.style.display = 'none';
        renderTodos();
    });
    
    // Actions
    clearCompleted.addEventListener('click', clearCompletedTodos);
    exportTodos.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => importTodos.click());
    importTodos.addEventListener('change', importData);
    
    // Modal
    closeModal.addEventListener('click', closeEditModal);
    cancelEdit.addEventListener('click', closeEditModal);
    saveEdit.addEventListener('click', saveEditedTodo);
    
    // Close modal on outside click
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });
    
    // Auto-save to local storage
    setInterval(saveToLocalStorage, 30000); // Save every 30 seconds
}

// API Functions
async function loadTodos() {
    try {
        showLoading(true);
        hideError();
        
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch todos');
        
        todos = await response.json();
        renderTodos();
        updateStats();
        saveToLocalStorage();
        
    } catch (err) {
        showError('Failed to load todos. Using local backup if available.');
        loadFromLocalStorage();
        console.error('Error loading todos:', err);
    } finally {
        showLoading(false);
    }
}

async function addTodo() {
    const task = todoInput.value.trim();
    
    if (!task) {
        showError('Please enter a task');
        todoInput.focus();
        return;
    }
    
    if (task.length > 200) {
        showError('Task cannot be longer than 200 characters');
        return;
    }
    
    const priority = prioritySelect.value;
    const dueDate = dueDateInput.value || null;
    const category = categoryInput.value.trim() || 'general';
    
    try {
        showLoading(true);
        hideError();
        
        const todoData = {
            task,
            priority,
            dueDate,
            category
        };
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(todoData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create todo');
        }
        
        const newTodo = await response.json();
        todos.unshift(newTodo);
        
        // Clear form
        todoInput.value = '';
        dueDateInput.value = '';
        categoryInput.value = '';
        prioritySelect.value = 'medium';
        
        renderTodos();
        updateStats();
        saveToLocalStorage();
        todoInput.focus();
        
    } catch (err) {
        showError(err.message || 'Failed to add todo. Please try again.');
        console.error('Error adding todo:', err);
    } finally {
        showLoading(false);
    }
}

async function toggleTodo(id, completed) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed })
        });
        
        if (!response.ok) throw new Error('Failed to update todo');
        
        const updatedTodo = await response.json();
        const index = todos.findIndex(todo => todo._id === id);
        if (index !== -1) {
            todos[index] = updatedTodo;
        }
        
        renderTodos();
        updateStats();
        saveToLocalStorage();
        
    } catch (err) {
        showError('Failed to update todo');
        console.error('Error updating todo:', err);
        // Revert checkbox state
        const checkbox = document.querySelector(`input[data-id="${id}"]`);
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
        }
    }
}

async function deleteTodo(id) {
    const todo = todos.find(t => t._id === id);
    if (!todo) return;
    
    const confirmed = confirm(`Are you sure you want to delete "${todo.task}"?`);
    if (!confirmed) return;
    
    try {
        showLoading(true);
        hideError();
        
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete todo');
        
        todos = todos.filter(todo => todo._id !== id);
        renderTodos();
        updateStats();
        saveToLocalStorage();
        
    } catch (err) {
        showError('Failed to delete todo');
        console.error('Error deleting todo:', err);
    } finally {
        showLoading(false);
    }
}

async function updateTodo(id, updateData) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update todo');
        }
        
        const updatedTodo = await response.json();
        const index = todos.findIndex(todo => todo._id === id);
        if (index !== -1) {
            todos[index] = updatedTodo;
        }
        
        renderTodos();
        updateStats();
        saveToLocalStorage();
        
        return updatedTodo;
        
    } catch (err) {
        showError(err.message || 'Failed to update todo');
        console.error('Error updating todo:', err);
        throw err;
    }
}

// Rendering Functions
function renderTodos() {
    const filteredTodos = getFilteredTodos();
    
    if (filteredTodos.length === 0) {
        todoList.style.display = 'none';
        emptyState.style.display = 'block';
        clearCompleted.style.display = 'none';
    } else {
        todoList.style.display = 'block';
        emptyState.style.display = 'none';
        
        // Show clear completed button if there are completed todos
        const hasCompleted = todos.some(todo => todo.completed);
        clearCompleted.style.display = hasCompleted ? 'block' : 'none';
    }
    
    todoList.innerHTML = filteredTodos.map(todo => createTodoHTML(todo)).join('');
    
    // Add event listeners to new elements
    addTodoEventListeners();
}

function createTodoHTML(todo) {
    const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let dueDateClass = '';
    let dueDateText = '';
    
    if (dueDate) {
        const todoDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const timeDiff = todoDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (daysDiff < 0) {
            dueDateClass = 'overdue';
            dueDateText = `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? 's' : ''}`;
        } else if (daysDiff === 0) {
            dueDateClass = 'due-soon';
            dueDateText = 'Due today';
        } else if (daysDiff <= 3) {
            dueDateClass = 'due-soon';
            dueDateText = `Due in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
        } else {
            dueDateText = formatDate(dueDate);
        }
    }
    
    return `
        <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo._id}">
            <input type="checkbox" 
                   class="todo-checkbox" 
                   ${todo.completed ? 'checked' : ''} 
                   data-id="${todo._id}">
            
            <div class="todo-content">
                <div class="todo-text" data-id="${todo._id}">${escapeHtml(todo.task)}</div>
                <div class="todo-meta">
                    <span class="priority-badge priority-${todo.priority}">${todo.priority}</span>
                    ${todo.category !== 'general' ? `<span class="category">${escapeHtml(todo.category)}</span>` : ''}
                    ${dueDate ? `<span class="due-date ${dueDateClass}">${dueDateText}</span>` : ''}
                    <span class="created-date">Created ${formatRelativeDate(new Date(todo.createdAt))}</span>
                </div>
            </div>
            
            <div class="todo-actions">
                <button class="edit-btn" data-id="${todo._id}">Edit</button>
                <button class="delete-btn" data-id="${todo._id}">Delete</button>
            </div>
        </li>
    `;
}

function addTodoEventListeners() {
    // Checkbox listeners
    document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const completed = e.target.checked;
            toggleTodo(id, completed);
        });
    });
    
    // Edit listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            openEditModal(id);
        });
    });
    
    // Delete listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            deleteTodo(id);
        });
    });
    
    // Quick edit on text double-click
    document.querySelectorAll('.todo-text').forEach(text => {
        text.addEventListener('dblclick', (e) => {
            const id = e.target.dataset.id;
            openEditModal(id);
        });
    });
}

// Filter Functions
function getFilteredTodos() {
    let filtered = [...todos];
    
    // Filter by status
    if (currentFilter === 'active') {
        filtered = filtered.filter(todo => !todo.completed);
    } else if (currentFilter === 'completed') {
        filtered = filtered.filter(todo => todo.completed);
    }
    
    // Filter by priority
    if (currentPriorityFilter !== 'all') {
        filtered = filtered.filter(todo => todo.priority === currentPriorityFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
        filtered = filtered.filter(todo => 
            todo.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
            todo.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    return filtered;
}

function updateFilterButtons() {
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === currentFilter);
    });
}

function updatePriorityFilterButtons() {
    priorityFilters.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.priority === currentPriorityFilter);
    });
}

function handleSearch() {
    searchQuery = searchInput.value.trim();
    clearSearch.style.display = searchQuery ? 'block' : 'none';
    renderTodos();
}

// Statistics Functions
function updateStats() {
    const total = todos.length;
    const active = todos.filter(todo => !todo.completed).length;
    const completed = todos.filter(todo => todo.completed).length;
    const overdue = getOverdueTodos().length;
    
    totalCount.textContent = total;
    activeCount.textContent = active;
    completedCount.textContent = completed;
    overdueCount.textContent = overdue;
}

function getOverdueTodos() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return todos.filter(todo => {
        if (!todo.dueDate || todo.completed) return false;
        const dueDate = new Date(todo.dueDate);
        const todoDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        return todoDate < today;
    });
}

// Modal Functions
function openEditModal(id) {
    const todo = todos.find(t => t._id === id);
    if (!todo) return;
    
    editingTodoId = id;
    editTaskInput.value = todo.task;
    editPrioritySelect.value = todo.priority;
    editDueDateInput.value = todo.dueDate ? formatDateForInput(new Date(todo.dueDate)) : '';
    editCategoryInput.value = todo.category;
    
    editModal.style.display = 'flex';
    editTaskInput.focus();
    editTaskInput.select();
}

function closeEditModal() {
    editModal.style.display = 'none';
    editingTodoId = null;
    
    // Clear form
    editTaskInput.value = '';
    editPrioritySelect.value = 'medium';
    editDueDateInput.value = '';
    editCategoryInput.value = '';
}

async function saveEditedTodo() {
    if (!editingTodoId) return;
    
    const task = editTaskInput.value.trim();
    if (!task) {
        showError('Task cannot be empty');
        editTaskInput.focus();
        return;
    }
    
    if (task.length > 200) {
        showError('Task cannot be longer than 200 characters');
        return;
    }
    
    const updateData = {
        task,
        priority: editPrioritySelect.value,
        dueDate: editDueDateInput.value || null,
        category: editCategoryInput.value.trim() || 'general'
    };
    
    try {
        await updateTodo(editingTodoId, updateData);
        closeEditModal();
    } catch (err) {
        // Error is already handled in updateTodo
    }
}

// Action Functions
async function clearCompletedTodos() {
    const completedTodos = todos.filter(todo => todo.completed);
    
    if (completedTodos.length === 0) {
        showError('No completed todos to clear');
        return;
    }
    
    const confirmed = confirm(`Are you sure you want to delete ${completedTodos.length} completed todo${completedTodos.length > 1 ? 's' : ''}?`);
    if (!confirmed) return;
    
    try {
        showLoading(true);
        hideError();
        
        // Delete all completed todos
        const deletePromises = completedTodos.map(todo => 
            fetch(`${API_URL}/${todo._id}`, { method: 'DELETE' })
        );
        
        const responses = await Promise.all(deletePromises);
        const failedDeletes = responses.filter(response => !response.ok);
        
        if (failedDeletes.length > 0) {
            throw new Error(`Failed to delete ${failedDeletes.length} todos`);
        }
        
        // Remove completed todos from local array
        todos = todos.filter(todo => !todo.completed);
        
        renderTodos();
        updateStats();
        saveToLocalStorage();
        
    } catch (err) {
        showError('Failed to clear completed todos');
        console.error('Error clearing completed todos:', err);
    } finally {
        showLoading(false);
    }
}

function exportData() {
    const dataToExport = {
        todos: todos,
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `todos-backup-${formatDateForFilename(new Date())}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showError('Todos exported successfully!', false);
    setTimeout(hideError, 3000);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!importedData.todos || !Array.isArray(importedData.todos)) {
                throw new Error('Invalid file format');
            }
            
            const confirmed = confirm(`This will replace all current todos with ${importedData.todos.length} imported todos. Continue?`);
            if (!confirmed) return;
            
            // Clear current todos first
            if (todos.length > 0) {
                const deletePromises = todos.map(todo => 
                    fetch(`${API_URL}/${todo._id}`, { method: 'DELETE' })
                );
                await Promise.all(deletePromises);
            }
            
            // Import new todos
            const importPromises = importedData.todos.map(todo => {
                const todoData = {
                    task: todo.task,
                    completed: todo.completed || false,
                    priority: todo.priority || 'medium',
                    dueDate: todo.dueDate || null,
                    category: todo.category || 'general'
                };
                
                return fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(todoData)
                });
            });
            
            const responses = await Promise.all(importPromises);
            const failedImports = responses.filter(response => !response.ok);
            
            if (failedImports.length > 0) {
                throw new Error(`Failed to import ${failedImports.length} todos`);
            }
            
            // Reload todos from server
            await loadTodos();
            
            showError('Todos imported successfully!', false);
            setTimeout(hideError, 3000);
            
        } catch (err) {
            showError('Failed to import todos. Please check the file format.');
            console.error('Error importing todos:', err);
        }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// Local Storage Functions
function saveToLocalStorage() {
    try {
        const dataToSave = {
            todos: todos,
            timestamp: Date.now()
        };
        localStorage.setItem('todoApp', JSON.stringify(dataToSave));
    } catch (err) {
        console.error('Failed to save to localStorage:', err);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('todoApp');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (parsedData.todos && Array.isArray(parsedData.todos)) {
                todos = parsedData.todos;
                renderTodos();
                updateStats();
            }
        }
    } catch (err) {
        console.error('Failed to load from localStorage:', err);
    }
}

// Utility Functions
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
}

function showError(message, isError = true) {
    error.textContent = message;
    error.style.display = 'block';
    error.style.background = isError ? '#ffebee' : '#e8f5e9';
    error.style.color = isError ? '#c62828' : '#2e7d32';
    error.style.borderLeftColor = isError ? '#f44336' : '#4caf50';
}

function hideError() {
    error.style.display = 'none';
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

function formatDateForFilename(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

function formatRelativeDate(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'today';
    } else if (diffDays <= 7) {
        return `${diffDays} days ago`;
    } else if (diffDays <= 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
        return formatDate(date);
    }
}

function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.min = today;
    editDueDateInput.min = today;
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to add todo or save edit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (editModal.style.display === 'flex') {
            saveEditedTodo();
        } else {
            addTodo();
        }
    }
    
    // Escape to close modal
    if (e.key === 'Escape' && editModal.style.display === 'flex') {
        closeEditModal();
    }
    
    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Ctrl/Cmd + E to export data
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportData();
    }
});

// Service Worker for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Performance optimization: Debounce search
const debouncedSearch = debounce(() => {
    searchQuery = searchInput.value.trim();
    clearSearch.style.display = searchQuery ? 'block' : 'none';
    renderTodos();
}, 300);

// Replace the direct search handler with debounced version
searchInput.addEventListener('input', debouncedSearch);

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}