'use strict'

const logger = require('winston')
const async = require('async')
const migrationSettings = require('../scripts/migrationSettings.json')
const path = require('path')

const down = (dbConnection, pendingMigrations) => {
  const db = dbConnection
  const pending = pendingMigrations
  const keyList = Object.keys(pendingMigrations).sort(function (a, b) {
    return b - a
  })

  return {
    runPending (skip) {
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
            if (skip === query.migration_number) {
              console.log(`removing ${query.file_name} from migration table, skipping migration`)
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
            reject(`Error Rolling Back Migrations: ${err}`)
          } else {
            resolve('All Migrations Rolled Back Successfully')
          }
        })
      })
    }
  }

  function run (query) {
    console.log(`Rolling back changes: ${query.title}`)

    return Promise.resolve()
    .then(() => query.run.down(db, function (err) {
      logger.warn('Callbacks are deprecated, return promise instead.  Callback will be removed in a future version')
      if (err) {
        throw err
      }
    }))
    .then(() => query)
    .catch(err => {
      throw new Error(`Failed to run DOWN migration ${query.title}: ${err}`)
    })
  }

  function updateMigrationTable (query) {
    delete query.run
    delete query.migration_number
    delete query.title
    return db.execute(migrationSettings.deleteMigration, query, { prepare: true })
      .then(() => {
        logger.debug(`Successfully Rolled Back ${query.title}`)
      })
      .catch(err => {
        throw new Error(`Failed to write migration to Migrations Table: ${query.title}: ${err}`)
      })
  }
}

module.exports = down
