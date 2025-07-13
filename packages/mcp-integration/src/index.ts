import { z } from 'zod'

// MCP Query Schema
export const mcpQuerySchema = z.object({
  query: z.string(),
  params: z.array(z.any()).optional(),
  database: z.enum(['local', 'remote']).default('local')
})

export type MCPQuery = z.infer<typeof mcpQuerySchema>

// MCP Response Schema
export const mcpResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.record(z.any())).optional(),
  error: z.string().optional(),
  metadata: z.object({
    rowCount: z.number(),
    executionTime: z.number(),
    columns: z.array(z.string())
  }).optional()
})

export type MCPResponse = z.infer<typeof mcpResponseSchema>

// MCP Client Configuration
export interface MCPClientConfig {
  localDbPath: string
  remoteServerUrl: string
  timeout: number
  retries: number
}

export class MCPClient {
  private config: MCPClientConfig

  constructor(config: MCPClientConfig) {
    this.config = config
  }

  async executeQuery(query: MCPQuery): Promise<MCPResponse> {
    try {
      // Validate query
      const validatedQuery = mcpQuerySchema.parse(query)
      
      if (validatedQuery.database === 'local') {
        return this.executeLocalQuery(validatedQuery)
      } else {
        return this.executeRemoteQuery(validatedQuery)
      }
    } catch (error) {
      return {
        success: false,
        error: `Query validation failed: ${error}`
      }
    }
  }

  private async executeLocalQuery(query: MCPQuery): Promise<MCPResponse> {
    // Local SQLite execution via MCP
    const startTime = Date.now()
    
    try {
      // This would integrate with local MCP server
      // For now, return mock response
      const mockData = [
        { id: 1, name: 'Sample Store', revenue: 12500 },
        { id: 2, name: 'Another Store', revenue: 9800 }
      ]
      
      return {
        success: true,
        data: mockData,
        metadata: {
          rowCount: mockData.length,
          executionTime: Date.now() - startTime,
          columns: ['id', 'name', 'revenue']
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Local query failed: ${error}`
      }
    }
  }

  private async executeRemoteQuery(query: MCPQuery): Promise<MCPResponse> {
    // Remote MCP server execution
    const startTime = Date.now()
    
    try {
      const response = await fetch(`${this.config.remoteServerUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MCP_API_KEY || ''}`
        },
        body: JSON.stringify({
          query: query.query,
          params: query.params || []
        })
      })

      const result = await response.json()
      
      return {
        success: response.ok,
        data: result.data || [],
        metadata: {
          rowCount: result.data?.length || 0,
          executionTime: Date.now() - startTime,
          columns: result.columns || []
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Remote query failed: ${error}`
      }
    }
  }

  // Analytics-specific methods
  async getKPIs(): Promise<MCPResponse> {
    return this.executeQuery({
      query: `
        SELECT 
          'Total Revenue' as name,
          SUM(amount) as value,
          'monthly' as period
        FROM transactions 
        WHERE timestamp >= date('now', '-1 month')
        UNION ALL
        SELECT 
          'Transaction Count' as name,
          COUNT(*) as value,
          'monthly' as period
        FROM transactions 
        WHERE timestamp >= date('now', '-1 month')
      `,
      database: 'local'
    })
  }

  async getStorePerformance(): Promise<MCPResponse> {
    return this.executeQuery({
      query: `
        SELECT 
          s.name,
          s.location,
          s.region,
          COUNT(t.id) as transaction_count,
          SUM(t.amount) as total_revenue,
          AVG(t.amount) as avg_transaction
        FROM stores s
        LEFT JOIN transactions t ON s.id = t.storeId
        WHERE t.timestamp >= date('now', '-1 month')
        GROUP BY s.id, s.name, s.location, s.region
        ORDER BY total_revenue DESC
      `,
      database: 'local'
    })
  }

  async getTransactionTrends(): Promise<MCPResponse> {
    return this.executeQuery({
      query: `
        SELECT 
          date(timestamp) as date,
          COUNT(*) as transaction_count,
          SUM(amount) as daily_revenue,
          AVG(amount) as avg_order_value
        FROM transactions
        WHERE timestamp >= date('now', '-30 days')
        GROUP BY date(timestamp)
        ORDER BY date
      `,
      database: 'local'
    })
  }
}

// Factory function for creating MCP client
export function createMCPClient(config: Partial<MCPClientConfig> = {}): MCPClient {
  const defaultConfig: MCPClientConfig = {
    localDbPath: './apps/api/dev.db',
    remoteServerUrl: process.env.MCP_SERVER_URL || 'https://mcp-sqlite-backend.onrender.com',
    timeout: 10000,
    retries: 3
  }

  return new MCPClient({ ...defaultConfig, ...config })
}