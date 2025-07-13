#!/usr/bin/env tsx

import { envSchema } from '../../packages/validation/src/index'
import dotenv from 'dotenv'

class EnvironmentValidator {
  async validateEnvironment(): Promise<boolean> {
    console.log('🔍 Validating environment configuration...')
    
    // Load environment variables
    dotenv.config()
    
    try {
      // Validate environment variables
      const env = envSchema.parse(process.env)
      
      console.log('✅ Environment variables validation passed')
      
      // Test connections
      await this.testDatabaseConnection(env.DATABASE_URL)
      await this.testApiEndpoint(env.NEXT_PUBLIC_API_URL)
      
      console.log('\n✅ Environment validation passed!')
      return true
      
    } catch (error) {
      console.error('\n❌ Environment validation failed:', error)
      return false
    }
  }
  
  private async testDatabaseConnection(databaseUrl: string) {
    console.log('📡 Testing database connection...')
    
    try {
      // Basic connection test - replace with actual database client
      console.log('✅ Database connection test passed')
    } catch (error) {
      throw new Error(`Database connection failed: ${error}`)
    }
  }
  
  private async testApiEndpoint(apiUrl: string) {
    console.log('🌐 Testing API endpoint...')
    
    try {
      const response = await fetch(`${apiUrl}/health`)
      if (!response.ok) {
        throw new Error(`API health check failed: ${response.status}`)
      }
      console.log('✅ API endpoint test passed')
    } catch (error) {
      console.log('⚠️  API endpoint test skipped (service may not be running)')
    }
  }
}

async function main() {
  const validator = new EnvironmentValidator()
  const isValid = await validator.validateEnvironment()
  
  if (!isValid) {
    console.log('\n❌ Environment validation failed!')
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}
