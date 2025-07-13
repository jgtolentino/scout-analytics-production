#!/usr/bin/env tsx

import fs from 'fs'

class MonitoringSetup {
  async setupMonitoring() {
    console.log('📊 Setting up monitoring and alerting...')
    
    // Create Sentry configuration
    await this.setupSentry()
    
    // Create health check endpoints
    await this.setupHealthChecks()
    
    // Create performance monitoring
    await this.setupPerformanceMonitoring()
    
    // Create alerting configuration
    await this.setupAlerting()
    
    console.log('✅ Monitoring setup complete!')
  }
  
  private async setupSentry() {
    console.log('🐛 Setting up Sentry error tracking...')
    
    const sentryConfig = `
import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'

export const initSentry = (app: any) => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Tracing.Integrations.Express({ app }),
      ],
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV
    })
  }
}
`
    
    await fs.promises.writeFile('apps/api/src/utils/sentry.ts', sentryConfig.trim())
    console.log('✅ Sentry configuration created')
  }
  
  private async setupHealthChecks() {
    console.log('💓 Setting up health check endpoints...')
    
    const healthCheck = `
import { Router } from 'express'
import { prisma } from '../utils/db'

const router = Router()

router.get('/health', async (req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    database: 'unknown',
    memory: process.memoryUsage(),
    uptime: process.uptime()
  }
  
  try {
    await prisma.$queryRaw\`SELECT 1\`
    checks.database = 'connected'
  } catch {
    checks.database = 'disconnected'
  }
  
  const isHealthy = checks.database === 'connected'
  res.status(isHealthy ? 200 : 503).json(checks)
})

router.get('/health/deep', async (req, res) => {
  // More comprehensive health checks
  const checks = {
    database: false,
    redis: false,
    external_apis: false
  }
  
  try {
    await prisma.$queryRaw\`SELECT 1\`
    checks.database = true
  } catch {}
  
  const allHealthy = Object.values(checks).every(Boolean)
  res.status(allHealthy ? 200 : 503).json(checks)
})

export { router as healthRoutes }
`
    
    await fs.promises.writeFile('apps/api/src/routes/health.ts', healthCheck.trim())
    console.log('✅ Health check endpoints created')
  }
  
  private async setupPerformanceMonitoring() {
    console.log('⚡ Setting up performance monitoring...')
    
    const performanceMiddleware = `
import { Request, Response, NextFunction } from 'express'

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    
    // Log slow requests
    if (duration > 1000) {
      console.warn('Slow request detected:', {
        method: req.method,
        url: req.url,
        duration: \`\${duration}ms\`,
        statusCode: res.statusCode
      })
    }
    
    // Add performance headers
    res.setHeader('X-Response-Time', \`\${duration}ms\`)
  })
  
  next()
}
`
    
    await fs.promises.writeFile('apps/api/src/middleware/performance.ts', performanceMiddleware.trim())
    console.log('✅ Performance monitoring middleware created')
  }
  
  private async setupAlerting() {
    console.log('🚨 Setting up alerting configuration...')
    
    const alertConfig = `
version: '1'
alerts:
  - name: 'High Error Rate'
    condition: 'error_rate > 5%'
    duration: '5m'
    action: 'webhook'
    
  - name: 'Database Connection Issues'
    condition: 'database_health != "connected"'
    duration: '1m'
    action: 'email'
    
  - name: 'High Response Time'
    condition: 'avg_response_time > 2000ms'
    duration: '10m'
    action: 'slack'
`
    
    await fs.promises.writeFile('monitoring/alerts/alerts.yml', alertConfig.trim())
    console.log('✅ Alerting configuration created')
  }
}

async function main() {
  const setup = new MonitoringSetup()
  await setup.setupMonitoring()
}

if (require.main === module) {
  main().catch(console.error)
}
