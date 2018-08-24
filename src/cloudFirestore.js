const admin = require('firebase-admin')
const functions = require('firebase-functions')
const listTypes = require('../config/filesConfig')

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

  function isDynamicList(listName) {
    return listTypes.dynamicLists.indexOf(listName) !== -1
  }

  function isStaticList(listName) {
    return listTypes.staticLists.indexOf(listName) !== -1
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

        const data = { ...opponent, count: count++ }

        if (isStaticList(doc)) data.position = data.count

        if (doc) batch.set(oppRef, data)

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

  function bulkDelete(col) {
    const oppRef = db.collection(col)
    return batchDelete(oppRef)
  }

  async function batchDelete(query) {
    return query.get().then(async snapshot => {
      if (snapshot.size === 0) return 0

      const batch = db.batch()
      for (let doc of snapshot.docs) {
        try {
          const oppRef = await doc.ref.collection('opponents')
          if (oppRef) await batchDelete(oppRef)

          batch.delete(doc.ref)
        } catch (err) {
          console.log(err)
        }
      }

      return batch.commit()
    })
  }

  return { isEmpty, isDynamicList, isStaticList, bulkInsert, bulkDelete }
}
