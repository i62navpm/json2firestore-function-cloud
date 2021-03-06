const admin = require('firebase-admin')
const axios = require('axios')
const { url } = require('../config/sendGridAppEngine')

module.exports = function() {
  const db = admin.firestore()

  async function getFirestoreUsers() {
    const snapshot = await db
      .collection('users')
      .where('emailNotifications', '==', true)
      .get()
    let users = []
    for (let doc of snapshot.docs) {
      let user = await doc.ref.get()
      let { email, name } = user.data()
      users = [...users, { email, name }]
    }

    return users
  }

  async function sendEmails(listName) {
    const users = await getFirestoreUsers()
    return axios.post(`${url}/sendNotifications`, {
      listName,
      users,
    })
  }

  function sendNotifications(listName) {
    return sendEmails(listName)
  }

  return {
    sendNotifications,
  }
}
