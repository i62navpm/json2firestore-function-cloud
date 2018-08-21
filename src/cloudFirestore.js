const admin = require('firebase-admin')
const functions = require('firebase-functions')

module.exports = function() {
  admin.initializeApp(functions.config().firebase)
  const db = admin.firestore()
  const firestoreBulkLimit = 500

  function isEmpty(doc) {
    return db
      .collection(doc)
      .get()
      .then(snapshot => !snapshot.size)
  }

  function bulkInsert(doc, data) {
    let deferred = []

    for (const [specialty, opponents] of Object.entries(data)) {
      let count = 0
      let batch = db.batch()

      opponents.forEach(opponent => {
        let oppRef = db
          .collection(doc)
          .doc(specialty)
          .collection('opponents')
          .doc()
        batch.set(oppRef, { ...opponent, count: count++ })

        if (count % firestoreBulkLimit === 0) {
          deferred.push(batch.commit())
          batch = db.batch()
        }
      })

      let statisticsRef = db.collection(doc).doc(specialty)

      batch.set(statisticsRef, {
        total: count,
        createdAt: new Date().toISOString(),
      })
      deferred.push(batch.commit())
    }

    return Promise.all(deferred)
  }

  return { isEmpty, bulkInsert }
}
