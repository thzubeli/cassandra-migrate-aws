'use strict'
const async = require('async')
const migrationSettings = require('../scripts/migrationSettings.json')
const path = require('path')

const up = (dbOverride, pendingMigrations) => {
  const db = dbOverride
  const pending = pendingMigrations
  const keyList = Object.keys(pendingMigrations).sort(function (a, b) {
    return a - b
  })

  return {
    runPending: (skip) => {
      return new Promise((resolve, reject) => {
        async.eachSeries(keyList, (id, callback) => {
          let fileName = pending[ id ]
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
              updateMigrationTable(query)
                .then((result) => callback(null, result))
                .catch((error) => callback(error))
            } else {
              callback(null, '')
            }
          } else {
            run(query)
              .then((query) => updateMigrationTable(query))
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
  }

  function run (query) {
    return new Promise((resolve, reject) => {
      console.log(`Migrating changes: ${query.title}`)
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

  function updateMigrationTable (query) {
    return new Promise((resolve, reject) => {
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

module.exports = up
