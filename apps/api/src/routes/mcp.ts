import { Router } from 'express'
import { createMCPClient } from '@scout-analytics/mcp-integration'

const router = Router()
const mcpClient = createMCPClient()

// Execute custom MCP query
router.post('/query', async (req, res) => {
  try {
    const { query, params, database = 'local' } = req.body
    
    const result = await mcpClient.executeQuery({
      query,
      params,
      database
    })
    
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `MCP query failed: ${error}`
    })
  }
})

// Get KPIs via MCP
router.get('/kpis', async (req, res) => {
  try {
    const result = await mcpClient.getKPIs()
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `MCP KPIs failed: ${error}`
    })
  }
})

// Get store performance via MCP
router.get('/stores/performance', async (req, res) => {
  try {
    const result = await mcpClient.getStorePerformance()
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `MCP store performance failed: ${error}`
    })
  }
})

// Get transaction trends via MCP
router.get('/transactions/trends', async (req, res) => {
  try {
    const result = await mcpClient.getTransactionTrends()
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `MCP transaction trends failed: ${error}`
    })
  }
})

export default router