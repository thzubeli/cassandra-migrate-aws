const cassandra = require('cassandra-driver')

const keyspace = () => {
  return {
    checkKeyspace: (settings, createKeyspace) => {
      if (createKeyspace) {
        console.log('Will create keyspace if it doesn\'t exist')
        return Promise.resolve().then(() => {
          let driverOptions = {}

          if (settings.optionFile) {
            driverOptions = require(`${process.cwd()}/${settings.optionFile}`)
          }

          settings.hosts = (settings.hosts) ? settings.hosts.split(',') : undefined
          let envHosts = (process.env.DBHOST) ? process.env.DBHOST.split(',') : undefined
          let hosts = settings.hosts || envHosts

          driverOptions.contactPoints = hosts || driverOptions.contactPoints || [ 'localhost' ]
          const keyspace = settings.keyspace || process.env.DBKEYSPACE || driverOptions.keyspace

          const username = settings.username || process.env.DBUSER
          const password = settings.password || process.env.DBPASSWORD

          if (username && password) {
            driverOptions.authProvider = new cassandra.auth.PlainTextAuthProvider(username, password)
          }

          // If keyspace was set in the optionFile then it will have been already added to
          // driverOptions.  It needs to be removed so that no error occurs if the keyspace
          // doesn't exist yet.
          if (driverOptions.hasOwnProperty('keyspace')) {
            delete driverOptions.keyspace
          }

          console.log(`Keyspace=${keyspace}`)
          let cassandraClient = new cassandra.Client(driverOptions)

          let p = Promise.reject()
          for (let i = 0; i < 30; i++) {
            p = p.catch(() => cassandraClient.connect()).catch(rejectDelay)
          }
          p = p.then(() => {
            // For now locking the replication for cassandra to just a single node
            const replicationStrategy = 'SimpleStrategy'
            const replicationFactor = 1

            const query = `CREATE KEYSPACE IF NOT EXISTS ${keyspace} WITH replication = {'class': '${replicationStrategy}', 'replication_factor': '${replicationFactor}' }`
            return cassandraClient.execute(query)
            .then(() => {
              cassandraClient.shutdown()
            })
          })
          return p
        })
      } else {
        return Promise.resolve()
      }
    }
  }

  function rejectDelay (reason) {
    console.log('Cassandra connect fail')
    return new Promise((resolve, reject) => {
      setTimeout(reject.bind(null, reason), 2000)
    })
  }
}

module.exports = keyspace()
