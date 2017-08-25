const logger = require('winston')

const startupRetryAttempts = 50

const migrate = () => {
  return {
    check: (client, migrationFile) => {
      let p = Promise.reject()
      for (let i = 0; i < startupRetryAttempts; i++) {
        p = p.catch(() => client.connect()).catch(rejectDelay)
      }
      p = p.then(() => {
        logger.info('Connection to Cassandra database established')
        return Promise.reject()
      })
      for (let i = 0; i < startupRetryAttempts; i++) {
        p = p.catch(() => queryForMigration(client, migrationFile)).catch(rejectDelay)
      }
      p = p.then(() => {
        logger.info('Cassandra migrations found to be acceptable')
      })
      return p
    }
  }

  function queryForMigration (client, migrationFile) {
    const query = `SELECT * from sys_cassandra_migrations where file_name='/var/app/migrations/${migrationFile}.js';`

    return client.execute(query)
    .then(result => {
      if (result.rowLength === 1) {
        return Promise.resolve()
      } else {
        return Promise.reject('Specified migration not found in cassandra')
      }
    })
  }

  function rejectDelay (reason) {
    // logger.debug(reason)
    return new Promise((resolve, reject) => {
      setTimeout(reject.bind(null, reason), 2000)
    })
  }
}

module.exports = migrate()
