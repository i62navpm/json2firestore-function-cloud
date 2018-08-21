const admin = require('firebase-admin')
// const functions = require('firebase-functions')

module.exports = function() {
  var serviceAccount = require('C:\\Users\\m.navarro\\Downloads\\oppositions-project-0d4d13f39a54.json')

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })

  // In google function
  // admin.initializeApp(functions.config().firebase)

  const db = admin.firestore()

  function isEmpty(doc) {
    return db
      .collection(doc)
      .get()
      .then(snapshot => !snapshot.size)
  }

  function bulkInsert(doc, data) {
    const batch = db.batch()
    let count = 0

    for (const [specialty, opponents] of Object.entries(data)) {
      opponents.forEach(opponent => {
        let oppRef = db
          .collection(doc)
          .doc(specialty)
          .collection('opponents')
          .doc()
        batch.set(oppRef, { ...opponent, count: count++ })
      })
    }

    return batch.commit()
  }

  return { isEmpty, bulkInsert }
}
