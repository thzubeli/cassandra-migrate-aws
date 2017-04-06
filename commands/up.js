'use strict'
var async = require('async')
var migrationSettings = require('../scripts/migrationSettings.json')
var path = require('path')

class Up {
  constructor (db, pendingMigrations) {
    this.db = db
    this.pending = pendingMigrations
    this.keyList = Object.keys(pendingMigrations).sort(function (a, b) {
      return a - b
    })
  }

  runPending (skip) {
    return new Promise((resolve, reject) => {
      async.eachSeries(this.keyList, (id, callback) => {
        let fileName = this.pending[ id ]
        let attributes = path.basename(fileName).split('_')

        let query = {
          'file_name': fileName,
          'migration_number': attributes[ 0 ],
          'title': path.basename(fileName, '.js'),
          'run': require(path.resolve(fileName))
        }
        if (skip) {
          if (query.migration_number === skip) {
            console.log(`adding ${query.file_name} to Migration table, skipping migration`)
            this.updateMigrationTable(query)
              .then((result) => callback(null, result))
              .catch((error) => callback(error))
          } else {
            callback(null, '')
          }
        } else {
          this.run(query)
            .then((query) => this.updateMigrationTable(query))
            .then((result) => callback(null, result))
            .catch((error) => callback(error))
        }
      }, (err) => {
        if (err) {
          /* eslint prefer-promise-reject-errors: 0 */
          reject(`Error Running Migrations: ${err}`)
        } else {
          resolve('All Migrations Ran Successfully')
        }
      })
    })
  }

  run (query) {
    return new Promise((resolve, reject) => {
      console.log(`Migrating changes: ${query.title}`)
      let db = this.db
      query.run.up(db, function (err) {
        if (err) {
          /* eslint prefer-promise-reject-errors: 0 */
          reject(`Failed to run migration ${query.title}: ${err}`)
        } else {
          resolve(query)
        }
      })
    })
  }

  updateMigrationTable (query) {
    return new Promise((resolve, reject) => {
      let db = this.db
      delete query.run
      query.created_at = Date.now()
      db.execute(migrationSettings.insertMigration, query, { prepare: true }, function (err) {
        if (err) {
          /* eslint prefer-promise-reject-errors: 0 */
          reject(`Failed to write migration to Migrations Table: ${query.title}: ${err}`)
        } else {
          resolve(`Successfully Migrated ${query.title}`)
        }
      })
    })
  }
}

module.exports = Up
