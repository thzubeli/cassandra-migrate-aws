'use strict'
const migrationSettings = require('../scripts/migrationSettings.json')
const path = require('path')

const createMigrationTableCheck = async (db, keyspaceName) => {
  try {
    console.log(`Checking migration table status for keyspace ${keyspaceName}`)
    const response = await db.execute(migrationSettings.createMigrationTableCheck, {
      'keyspace_name': keyspaceName
    }, { prepare: true })
    console.log(`Migration table status is: ${response?.rows?.[0]?.status}`)
    return response?.rows?.[0]?.status === 'ACTIVE'
  } catch(e) {
    console.error('Error while checking migration table status')
    console.error(e)
    return false;
  }
}

const common = (dbConnection, fsOverride) => {
  const db = dbConnection
  const fs = fsOverride || require('fs')

  /* eslint no-useless-escape: 0 */
  const reFileName = /^[0-9]{10}_[a-z0-9\_]*.js$/i

  return {
    createMigrationTable: (keyspaceName, skipMigrationTableCheck) => {
      return new Promise(async (resolve, reject) => {
        // Setting prepared to false, as AWS Keyspaces doesn't handle prepared statements on DDL queries
        db.execute(migrationSettings.createMigrationTable, null, { prepare: false }, async function (err, response) {
          if (err) {
            reject(err)
          }
          if (skipMigrationTableCheck) {
            resolve(response)
            return
          }
          let checkCount = 0;
          let success = false;
          do {
            if (await createMigrationTableCheck(db, keyspaceName)) {
              resolve(response)
              success = true;
              break;
            }
            checkCount++;
            console.log('Waiting for 10 secondes before checking again')
            await new Promise(res => setTimeout(res, 10000));
          } while (checkCount <= 6)
          if (!success) {
            reject('Could not check if table was correctly created after waiting for 1 minute')
          }
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
