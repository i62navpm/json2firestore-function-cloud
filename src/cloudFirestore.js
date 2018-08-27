const admin = require('firebase-admin')
const functions = require('firebase-functions')
const { getPosition, parseOpponent, isSameOpponent } = require('./utils/search')
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
      let count = 0
      if (snapshot.size === 0) return 0

      let batch = db.batch()
      for (let doc of snapshot.docs) {
        try {
          if (!doc.ref.path.includes('opponents')) {
            const oppRef = await doc.ref.collection('opponents')
            if (oppRef) await batchDelete(oppRef)
          }

          count++
          batch.delete(doc.ref)

          if (count % firestoreBulkLimit === 0) {
            batch.commit()
            batch = db.batch()
          }
        } catch (err) {
          console.log(err)
        }
      }

      return batch.commit()
    })
  }

  async function bulkUpdate(listName, data) {
    const staticLists = listTypes.staticLists

    const dynamicOpponents = Object.entries(data)
      .map(([, opponents]) => opponents)
      .reduce((acc, bef) => [...acc, ...bef], [])
      .map(parseOpponent)

    try {
      let deferred = []

      for (let doc of staticLists) {
        const docSnapshot = await db.collection(doc).get()
        for (let specialty of docSnapshot.docs) {
          let batch = db.batch()
          let position = 0
          let outputs = 0
          let inputs = 0

          const specialtySnapshot = await specialty.ref
            .collection('opponents')
            .orderBy('count')
            .get()

          specialtySnapshot.docs.forEach((opponent, index) => {
            const staticOpponent = parseOpponent(opponent.data())

            const opponentMatched = dynamicOpponents.find(dynamicOpponent =>
              isSameOpponent(staticOpponent, dynamicOpponent)
            )

            outputs += !!opponentMatched

            let data = { position: staticOpponent.info.position }

            if (opponentMatched) {
              opponent.ref
                .collection('info')
                .doc(new Date().toISOString())
                .set({ ...opponentMatched.info, ...{ listName } })
              data.position = getPosition(listName)
              data.status = 'OUT'
            } else {
              if (staticOpponent.info.position >= 0) {
                data.position = position++
              }
            }

            batch.update(opponent.ref, data)

            if (index % firestoreBulkLimit === 0) {
              deferred.push(batch.commit())
              batch = db.batch()
            }
          })

          const eventRef = specialty.ref
            .collection('events')
            .doc(new Date().toISOString())

          batch.set(eventRef, {
            list: listName,
            outputs,
            inputs,
          })
          deferred.push(batch.commit())
        }
      }
      return Promise.all(deferred)
    } catch (err) {
      console.log(err)
    }
  }

  return {
    isEmpty,
    isDynamicList,
    isStaticList,
    bulkInsert,
    bulkDelete,
    bulkUpdate,
  }
}
