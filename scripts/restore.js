#!/usr/bin/env node

/**
 * Mental Health Platform - Database Restore Script
 *
 * This script restores backups of the SQLite database and Redis cache.
 * Run with: node scripts/restore.js --backup backup-2025-10-27T07-40-48.736Z
 */

const fs = require('fs').promises
const path = require('path')
const { execSync } = require('child_process')
const { cache } = require('../src/lib/redis')

class RestoreManager {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups')
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir)
      const backups = []

      for (const file of files) {
        if (file.startsWith('backup-') && file.endsWith('.json')) {
          const metadataPath = path.join(this.backupDir, file)
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))

          backups.push({
            id: metadata.timestamp,
            created: metadata.created,
            version: metadata.version,
            environment: metadata.environment,
            files: metadata.backups
          })
        }
      }

      return backups.sort((a, b) => new Date(b.created) - new Date(a.created))
    } catch (error) {
      console.error('❌ Failed to list backups:', error.message)
      return []
    }
  }

  async restoreBackup(backupId) {
    try {
      console.log(`🔄 Starting restore process for backup: ${backupId}`)

      // Find backup metadata
      const metadataPath = path.join(this.backupDir, `backup-${backupId}.json`)

      if (!(await this.fileExists(metadataPath))) {
        throw new Error(`Backup metadata not found: ${backupId}`)
      }

      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
      console.log(`📋 Restoring backup from ${metadata.created}`)

      // Confirm restore operation
      if (!await this.confirmRestore(metadata)) {
        console.log('❌ Restore cancelled by user')
        return
      }

      // Restore each backup file
      for (const backup of metadata.backups) {
        await this.restoreFile(backup)
      }

      console.log('✅ Restore process completed successfully!')
      console.log('🔄 You may need to restart the application for changes to take effect')

    } catch (error) {
      console.error('❌ Restore process failed:', error.message)
      process.exit(1)
    }
  }

  async restoreFile(backupInfo) {
    const backupPath = path.join(this.backupDir, backupInfo.path)

    try {
      if (backupInfo.type === 'database') {
        await this.restoreDatabase(backupPath)
      } else if (backupInfo.type === 'redis') {
        await this.restoreRedis(backupPath)
      } else {
        console.warn(`⚠️ Unknown backup type: ${backupInfo.type}`)
      }
    } catch (error) {
      console.error(`❌ Failed to restore ${backupInfo.type}:`, error.message)
      throw error
    }
  }

  async restoreDatabase(backupPath) {
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './dev.db'
    const tempDbPath = `${dbPath}.backup`

    try {
      console.log('💾 Restoring SQLite database...')

      // Create backup of current database
      if (await this.fileExists(dbPath)) {
        await fs.copyFile(dbPath, tempDbPath)
        console.log('💾 Current database backed up to .backup')
      }

      // Restore from backup
      await fs.copyFile(backupPath, dbPath)

      // Verify restoration
      const stats = await fs.stat(dbPath)
      console.log(`✅ Database restored: ${stats.size} bytes`)

      // Clean up temp backup after successful restore
      if (await this.fileExists(tempDbPath)) {
        await fs.unlink(tempDbPath)
      }

    } catch (error) {
      // Restore original database if restore failed
      if (await this.fileExists(tempDbPath)) {
        await fs.copyFile(tempDbPath, dbPath)
        console.log('🔄 Original database restored due to restore failure')
      }
      throw error
    }
  }

  async restoreRedis(backupPath) {
    try {
      console.log('🔄 Restoring Redis cache...')

      const data = JSON.parse(await fs.readFile(backupPath, 'utf8'))
      let restoredCount = 0

      for (const [key, value] of Object.entries(data)) {
        try {
          // Remove prefix and restore
          const cleanKey = key.replace('mental_health:', '')
          await cache.set(cleanKey, value, 3600) // 1 hour TTL
          restoredCount++
        } catch (error) {
          console.warn(`⚠️ Failed to restore Redis key ${key}:`, error.message)
        }
      }

      console.log(`✅ Redis cache restored: ${restoredCount} keys`)

    } catch (error) {
      console.error('❌ Redis restore failed:', error.message)
      // Don't throw - Redis restore is optional
    }
  }

  async confirmRestore(metadata) {
    console.log('\n🚨 RESTORE OPERATION WARNING 🚨')
    console.log('This will overwrite current data with backup data.')
    console.log('Make sure the application is stopped before proceeding.')
    console.log('')
    console.log('Backup Details:')
    console.log(`- Created: ${metadata.created}`)
    console.log(`- Version: ${metadata.version}`)
    console.log(`- Environment: ${metadata.environment}`)
    console.log(`- Files: ${metadata.backups.length}`)
    console.log('')

    // In a real implementation, you'd prompt for confirmation
    // For now, we'll assume confirmation for automated scripts
    return true
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  async run() {
    const args = process.argv.slice(2)
    const backupId = args.find(arg => arg.startsWith('--backup='))?.split('=')[1]

    if (args.includes('--list')) {
      const backups = await this.listBackups()
      console.log('📦 Available Backups:')
      console.log('==================')

      if (backups.length === 0) {
        console.log('No backups found')
        return
      }

      backups.forEach((backup, index) => {
        console.log(`${index + 1}. ${backup.id}`)
        console.log(`   Created: ${backup.created}`)
        console.log(`   Files: ${backup.files.length}`)
        console.log('')
      })

    } else if (backupId) {
      await this.restoreBackup(backupId)
    } else {
      console.log('Usage:')
      console.log('  List backups: node scripts/restore.js --list')
      console.log('  Restore backup: node scripts/restore.js --backup=<backup-id>')
      console.log('')
      console.log('Example:')
      console.log('  node scripts/restore.js --backup=2025-10-27T07-40-48.736Z')
    }
  }
}

// Run restore if called directly
if (require.main === module) {
  const restoreManager = new RestoreManager()
  restoreManager.run()
}

module.exports = RestoreManager