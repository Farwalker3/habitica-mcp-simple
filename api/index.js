// Simple redirect to MCP endpoint
module.exports = async (req, res) => {
  res.setHeader('Location', '/mcp');
  res.status(302).end();
};