import { useState, useCallback } from 'react'

interface MCPQuery {
  query: string
  params?: any[]
  database?: 'local' | 'remote'
}

interface MCPResponse {
  success: boolean
  data?: any[]
  error?: string
  metadata?: {
    rowCount: number
    executionTime: number
    columns: string[]
  }
}

export function useMCP() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeQuery = useCallback(async (query: MCPQuery): Promise<MCPResponse | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/mcp/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'MCP query failed')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getKPIs = useCallback(async () => {
    const response = await fetch('/api/mcp/kpis')
    const result = await response.json()
    return result.data
  }, [])

  const getStorePerformance = useCallback(async () => {
    const response = await fetch('/api/mcp/stores/performance')
    const result = await response.json()
    return result.data
  }, [])

  const getTransactionTrends = useCallback(async () => {
    const response = await fetch('/api/mcp/transactions/trends')
    const result = await response.json()
    return result.data
  }, [])

  return {
    executeQuery,
    getKPIs,
    getStorePerformance,
    getTransactionTrends,
    loading,
    error
  }
}