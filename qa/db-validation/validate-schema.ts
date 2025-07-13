#!/usr/bin/env tsx

import fs from 'fs'
import path from 'path'

class DatabaseIntegrityValidator {
  
  async validateIntegrity(): Promise<boolean> {
    console.log('🔍 Validating database schema...')
    
    try {
      // Check schema file exists
      const schemaPath = path.join(process.cwd(), 'apps/api/prisma/schema.prisma')
      
      if (!fs.existsSync(schemaPath)) {
        throw new Error('Prisma schema file not found')
      }
      
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
      
      // Check required models exist
      await this.checkRequiredModels(schemaContent)
      
      // Check relationships
      await this.checkRelationships(schemaContent)
      
      // Check indexes exist
      await this.checkIndexes(schemaContent)
      
      console.log('\n✅ Database schema validation passed!')
      return true
      
    } catch (error) {
      console.error('\n❌ Database schema validation failed:', error)
      return false
    }
  }
  
  private async checkRequiredModels(schemaContent: string) {
    console.log('📋 Checking required models...')
    
    const requiredModels = ['User', 'Store', 'Product', 'Transaction']
    
    for (const model of requiredModels) {
      if (!schemaContent.includes(`model ${model}`)) {
        throw new Error(`❌ Model ${model} missing from schema`)
      }
      console.log(`✅ Model ${model} exists`)
    }
  }
  
  private async checkRelationships(schemaContent: string) {
    console.log('🔗 Checking relationships...')
    
    // Check Transaction relations
    const transactionModel = schemaContent.match(/model Transaction \{[^}]+\}/s)?.[0]
    if (!transactionModel) {
      throw new Error('Transaction model not found')
    }
    
    const requiredRelations = ['user', 'store', 'product']
    for (const relation of requiredRelations) {
      if (!transactionModel.includes(`${relation}`)) {
        throw new Error(`Transaction model missing ${relation} relation`)
      }
    }
    
    console.log('✅ All relationships validated')
  }
  
  private async checkIndexes(schemaContent: string) {
    console.log('📊 Checking database indexes...')
    
    if (schemaContent.includes('@@index')) {
      console.log('✅ Database indexes configured')
    } else {
      console.log('⚠️  No indexes found - consider adding for performance')
    }
  }
}

async function main() {
  const validator = new DatabaseIntegrityValidator()
  const isValid = await validator.validateIntegrity()
  
  if (!isValid) {
    console.log('\n❌ Database integrity validation failed!')
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}
