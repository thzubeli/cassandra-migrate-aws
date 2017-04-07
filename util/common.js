'use strict'
const migrationSettings = require('../scripts/migrationSettings.json')
const path = require('path')

const common = (fsOverride, dbOverride) => {
  const fs = fsOverride
  const db = dbOverride

  /* eslint no-useless-escape: 0 */
  const reFileName = /^[0-9]{10}_[a-z0-9\_]*.js$/i

  return {
    createMigrationTable: () => {
      return new Promise((resolve, reject) => {
        db.execute(migrationSettings.createMigrationTable, null, { prepare: true }, function (err, response) {
          if (err) {
            reject(err)
          }
          resolve(response)
        })
      })
    },

    getMigrations: () => {
      return new Promise((resolve, reject) => {
        db.execute(migrationSettings.getMigration, null, { prepare: true }, function (err, alreadyRanFiles) {
          if (err) {
            reject(err)
          } else {
            let filesRan = {}
            for (let i = 0; i < alreadyRanFiles.rows.length; i++) {
              filesRan[ alreadyRanFiles.rows[ i ].migration_number ] = (alreadyRanFiles.rows[ i ].file_name)
            }
            resolve(filesRan)
          }
        })
      })
    },

    getMigrationFiles: (dir) => {
      return new Promise((resolve, reject) => {
        let files = fs.readdirSync(dir)
        let filesAvail = {}
        for (let j = 0; j < files.length; j++) {
          // filter migration files using regex.
          if (reFileName.test(files[ j ])) {
            filesAvail[ files[ j ].substr(0, 10) ] = path.join(dir, files[ j ])
          }
        }
        console.log(filesAvail)
        resolve(filesAvail)
      })
    },

    getMigrationSet: (migrationInfo, direction, n) => {
      return new Promise((resolve, reject) => {
        let filesRan = migrationInfo[0]
        let filesAvail = migrationInfo[1]

        let pending
        if (direction === 'up') {
          pending = difference(filesRan, filesAvail)
          if (n) {
            for (let key in pending) {
              if (pending[ n ]) {
                if (pending.hasOwnProperty(key) && key > n) {
                  delete pending[ key ]
                }
              } else {
                if (filesRan[ n ]) {
                  /* eslint prefer-promise-reject-errors: 0 */
                  reject(`migration number ${n} already ran`)
                } else {
                  reject(`migration number ${n} not found in pending migrations`)
                }
              }
            }
          }
        } else if (direction === 'down') {
          pending = filesRan
          if (n) {
            for (let key in pending) {
              if (pending[ n ]) {
                if (pending.hasOwnProperty(key) && key < n) {
                  delete pending[ key ]
                }
              } else {
                if (filesAvail[n]) {
                  /* eslint prefer-promise-reject-errors: 0 */
                  reject(`migration number ${n} not run yet`)
                } else {
                  /* eslint prefer-promise-reject-errors: 0 */
                  reject(`migration number ${n} not found in pending rollbacks`)
                }
              }
            }
          }
        } else {
          /* eslint prefer-promise-reject-errors: 0 */
          reject('Migration direction must be specified')
        }
        resolve(pending)
      })
    }
  }

  function difference (obj1, obj2) {
    for (let key in obj1) {
      if (obj1.hasOwnProperty(key)) {
        if (obj2[ key ] && obj2[ key ].length) {
          delete obj2[ key ]
        }
      }
    }
    return obj2
  }
}

module.exports = common
