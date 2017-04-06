var async = require('async')

var migration0000000000 = {
  up: function (db, handler) {
    db.execute('SELECT * from sys_cassandra_migrations', null, { prepare: true }, (err, result) => {
      console.log('starting')
      if (err) {
        handler(err)
      } else {
        console.log('saving old migrations')
        const data = result.rows
        db.execute('drop table sys_cassandra_migrations', null, { prepare: true }, (err) => {
          console.log('dropping migration table')
          if (err) {
            handler(err)
          } else {
            db.execute('CREATE TABLE IF NOT EXISTS sys_cassandra_migrations(file_name TEXT, created_at TIMESTAMP, migration_number TEXT, title TEXT, PRIMARY KEY (file_name));',
              null, { prepare: true }, (err) => {
                if (err) {
                  handler(err)
                } else {
                  console.log('repopulating migration table')
                  async.eachSeries(data, (row, callback) => {
                    console.log(row)
                    db.execute('INSERT INTO sys_cassandra_migrations(file_name, created_at, migration_number, title) values (:file_name, :created_at, :migration_number, :title)',
                      row, { prepare: true }, err => {
                        if (err) {
                          callback(err)
                        } else {
                          callback()
                        }
                      })
                  }, (err) => {
                    if (err) {
                      handler(`Error Running Migrations: ${err}`)
                    } else {
                      handler(null, 'Migration table rebuilt Successfully')
                    }
                  })
                }
              })
          }
        })
      }
    })
  },
  down: function (db, handler) {
    db.execute('SELECT * from sys_cassandra_migrations', null, { prepare: true }, (err, result) => {
      console.log('starting')
      if (err) {
        handler(err)
      } else {
        console.log('saving old migrations')
        const data = result.rows
        db.execute('drop table sys_cassandra_migrations', null, { prepare: true }, (err) => {
          console.log('dropping migration table')
          if (err) {
            handler(err)
          } else {
            db.execute('CREATE TABLE IF NOT EXISTS sys_cassandra_migrations(file_name TEXT, created_at TIMESTAMP, migration_number TEXT, title TEXT, PRIMARY KEY (file_name, created_at));',
              null, { prepare: true }, (err) => {
                if (err) {
                  handler(err)
                } else {
                  console.log('repopulating migration table')
                  async.eachSeries(data, (row, callback) => {
                    db.execute('INSERT INTO sys_cassandra_migrations(file_name, created_at, migration_number, title) values(:file_name, :created_at, :migration_number, :title);',
                      row, { prepare: true }, err => {
                        if (err) {
                          callback(err)
                        } else {
                          callback(null, 'success')
                        }
                      })
                  }, (err) => {
                    if (err) {
                      handler(`Error Running Migrations: ${err}`)
                    } else {
                      handler(null, 'Migration table rebuilt Successfully')
                    }
                  })
                }
              })
          }
        })
      }
    })
  }
}

module.exports = migration0000000000
