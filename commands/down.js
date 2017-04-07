'use strict'
const async = require('async')
const migrationSettings = require('../scripts/migrationSettings.json')
const path = require('path')

const down = (dbOverride, pendingMigrations) => {
  const db = dbOverride
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
    return new Promise((resolve, reject) => {
      console.log(`Rolling back changes: ${query.title}`)
      query.run.down(db, function (err) {
        if (err) {
          reject(err)
        } else {
          resolve(query)
        }
      })
    })
  }

  function updateMigrationTable (query) {
    return new Promise((resolve, reject) => {
      delete query.run
      delete query.migration_number
      delete query.title
      db.execute(migrationSettings.deleteMigration, query, { prepare: true }, function (err) {
        if (err) {
          reject(err)
        } else {
          resolve(`Successfully Rolled Back ${query.title}`)
        }
      })
    })
  }
}

module.exports = down
