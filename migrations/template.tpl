
var migration${this.dateString} = {
  up: function (db, handler) {
    return Promise.resolve()
      .then(() => {
        console.log(1)
        return db.execute('')
      })
      .then(() => {
        handler(null, 'Done')
      })
      .catch(err => {
        console.error(err)
        handler(err)
      })
  },

  down: function (db, handler) {
  }
}

module.exports = migration${this.dateString}
