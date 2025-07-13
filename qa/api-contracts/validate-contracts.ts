#!/usr/bin/env tsx

import fs from 'fs'

interface ApiEndpoint {
  method: string
  path: string
  requestType?: string
  responseType: string
  statusCodes: number[]
}

class ApiContractValidator {
  private endpoints: ApiEndpoint[] = [
    {
      method: 'POST',
      path: '/api/auth/login',
      requestType: 'LoginRequest',
      responseType: 'AuthResponse',
      statusCodes: [200, 400, 401]
    },
    {
      method: 'GET', 
      path: '/api/users',
      responseType: 'User[]',
      statusCodes: [200, 403, 500]
    },
    {
      method: 'GET',
      path: '/api/transactions',
      responseType: 'Transaction[]', 
      statusCodes: [200, 400, 500]
    },
    {
      method: 'GET',
      path: '/api/analytics/kpis',
      responseType: 'KPIMetric[]',
      statusCodes: [200, 404, 500]
    }
  ]
  
  async validateContracts(): Promise<boolean> {
    console.log('🔍 Validating API contracts...')
    
    let allValid = true
    
    for (const endpoint of this.endpoints) {
      const isValid = await this.validateEndpoint(endpoint)
      if (!isValid) allValid = false
    }
    
    return allValid
  }
  
  private async validateEndpoint(endpoint: ApiEndpoint): Promise<boolean> {
    console.log(`\n📡 Validating ${endpoint.method} ${endpoint.path}`)
    
    // Check if route exists in backend
    const routeExists = await this.checkRouteExists(endpoint.path)
    
    // Check if response type is defined
    const responseTypeExists = await this.checkTypeExists(endpoint.responseType)
    
    // Check if request type is defined (if applicable)
    const requestTypeExists = endpoint.requestType ? 
      await this.checkTypeExists(endpoint.requestType) : true
    
    const isValid = routeExists && responseTypeExists && requestTypeExists
    
    console.log(`  Route exists: ${routeExists ? '✅' : '❌'}`)
    console.log(`  Response type defined: ${responseTypeExists ? '✅' : '❌'}`)
    if (endpoint.requestType) {
      console.log(`  Request type defined: ${requestTypeExists ? '✅' : '❌'}`)
    }
    console.log(`  Status: ${isValid ? '✅ Valid' : '❌ Invalid'}`)
    
    return isValid
  }
  
  private async checkRouteExists(path: string): Promise<boolean> {
    // Check if route is defined in backend routes
    try {
      const routeFile = path.includes('/auth/') ? 'apps/api/src/routes/auth.ts' :
                       path.includes('/analytics/') ? 'apps/api/src/routes/analytics.ts' :
                       path.includes('/transactions') ? 'apps/api/src/routes/transactions.ts' :
                       'apps/api/src/routes/users.ts'
      
      const content = await fs.promises.readFile(routeFile, 'utf-8')
      return content.includes(path.split('/').pop() || '')
    } catch {
      return false
    }
  }
  
  private async checkTypeExists(typeName: string): Promise<boolean> {
    // Check if type is defined in shared types
    try {
      const content = await fs.promises.readFile('packages/types/src/index.ts', 'utf-8')
      
      // Handle array types
      if (typeName.endsWith('[]')) {
        const baseType = typeName.slice(0, -2)
        return content.includes(`interface ${baseType}`) || content.includes(`type ${baseType}`)
      }
      
      return content.includes(`interface ${typeName}`) || content.includes(`type ${typeName}`)
    } catch {
      return false
    }
  }
}

async function main() {
  const validator = new ApiContractValidator()
  const isValid = await validator.validateContracts()
  
  if (!isValid) {
    console.log('\n❌ API contract validation failed!')
    process.exit(1)
  }
  
  console.log('\n✅ All API contracts are valid!')
}

if (require.main === module) {
  main().catch(console.error)
}
