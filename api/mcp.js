// Simple MCP implementation for Poke
const axios = require('axios');

// Configure Habitica API
const habiticaApi = axios.create({
  baseURL: 'https://habitica.com/api/v3',
  headers: {
    'x-api-user': process.env.HABITICAUSERID,
    'x-api-key': process.env.HABITICAAPITOKEN,
    'Content-Type': 'application/json'
  }
});

// MCP Schema
const mcpSchema = {
  type: 'mcp',
  version: '1',
  models: {
    Task: {
      description: 'A Habitica task',
      fields: {
        id: { type: 'string' },
        text: { type: 'string' }, 
        type: { type: 'string' },
        completed: { type: 'boolean' }
      }
    },
    User: {
      description: 'A Habitica user',
      fields: {
        id: { type: 'string' },
        username: { type: 'string' },
        hp: { type: 'number' },
        gold: { type: 'number' },
        level: { type: 'number' }
      }
    }
  },
  functions: {
    getTasks: {
      description: 'Get all tasks',
      parameters: {},
      returns: { type: 'array', items: { $ref: '#/models/Task' } }
    },
    createTask: {
      description: 'Create a new task',
      parameters: {
        text: { type: 'string' },
        type: { type: 'string' }
      },
      returns: { $ref: '#/models/Task' }
    },
    completeTask: {
      description: 'Complete a task',
      parameters: {
        id: { type: 'string' }
      },
      returns: { $ref: '#/models/Task' }
    },
    getUser: {
      description: 'Get user info',
      parameters: {},
      returns: { $ref: '#/models/User' }
    }
  }
};

// Function implementations
const functions = {
  // Get all tasks
  getTasks: async () => {
    try {
      const response = await habiticaApi.get('/tasks/user');
      return response.data.data.map(task => ({
        id: task.id,
        text: task.text,
        type: task.type,
        completed: !!task.completed
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw new Error('Failed to fetch tasks');
    }
  },
  
  // Create a new task
  createTask: async ({ text, type = 'todo' }) => {
    try {
      const response = await habiticaApi.post('/tasks/user', { 
        text, 
        type 
      });
      const task = response.data.data;
      return {
        id: task.id,
        text: task.text,
        type: task.type,
        completed: !!task.completed
      };
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  },
  
  // Complete a task
  completeTask: async ({ id }) => {
    try {
      const response = await habiticaApi.post(`/tasks/${id}/score/up`);
      const task = response.data.data;
      return {
        id: task.id,
        text: task.text,
        type: task.type,
        completed: true
      };
    } catch (error) {
      console.error('Error completing task:', error);
      throw new Error('Failed to complete task');
    }
  },
  
  // Get user info
  getUser: async () => {
    try {
      const response = await habiticaApi.get('/user');
      const user = response.data.data;
      return {
        id: user.id,
        username: user.auth?.local?.username || 'Habitica User',
        hp: user.stats.hp,
        gold: user.stats.gp,
        level: user.stats.lvl
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user');
    }
  }
};

// MCP endpoint handler
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Health check
  if (req.method === 'GET') {
    // Return schema directly
    return res.status(200).json(mcpSchema);
  }
  
  if (req.method === 'POST') {
    try {
      const body = req.body;
      
      if (!body || !body.jsonrpc || body.jsonrpc !== '2.0') {
        return res.status(400).json({
          jsonrpc: '2.0',
          error: { code: -32600, message: 'Invalid request' },
          id: body?.id || null
        });
      }
      
      // Handle methods
      const method = body.method;
      const params = body.params || {};
      const id = body.id;
      
      if (method === 'schema') {
        return res.status(200).json({
          jsonrpc: '2.0',
          result: mcpSchema,
          id
        });
      }
      
      if (method === 'tools/list') {
        return res.status(200).json({
          jsonrpc: '2.0',
          result: Object.entries(mcpSchema.functions).map(([name, details]) => ({
            name,
            description: details.description,
            parameters: details.parameters,
            returns: details.returns
          })),
          id
        });
      }
      
      if (method === 'tools/call') {
        const toolName = params.name;
        const toolParams = params.parameters || {};
        
        if (!toolName || !functions[toolName]) {
          return res.status(404).json({
            jsonrpc: '2.0',
            error: { code: -32601, message: 'Function not found' },
            id
          });
        }
        
        const result = await functions[toolName](toolParams);
        return res.status(200).json({
          jsonrpc: '2.0',
          result,
          id
        });
      }
      
      // Default - method not found
      return res.status(404).json({
        jsonrpc: '2.0',
        error: { code: -32601, message: 'Method not found' },
        id
      });
      
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: error.message || 'Internal error' },
        id: req.body?.id || null
      });
    }
  }
  
  // Default - method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
};