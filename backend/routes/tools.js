const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const AuraFlowTools = require('../tools');

const router = express.Router();

router.use(authenticateToken);

// Get all available tools
router.get('/definitions', (req, res) => {
  try {
    const tools = AuraFlowTools.getAllToolDefinitions();
    res.json({ tools });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tools by category
router.get('/categories', (req, res) => {
  try {
    const toolsByCategory = AuraFlowTools.getToolsByCategory();
    res.json(toolsByCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute a tool
router.post('/execute', async (req, res) => {
  try {
    const { toolName, args } = req.body;
    
    if (!toolName) {
      return res.status(400).json({ error: 'toolName is required' });
    }

    // Add userId from authenticated user to args
    const toolArgs = {
      ...args,
      userId: req.user.userId
    };

    const result = await AuraFlowTools.executeTool(toolName, toolArgs);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;