const cloudFirestore = require('./src/cloudFirestore')()
const cloudStorage = require('./src/cloudStorage')()
const cloudNotifications = require('./src/cloudNotifications')()

exports.json2firebase = async (event, context) => {
  const gcsEvent = event

  const [listName] = gcsEvent.name.split('.')
  const isEmpty = await cloudFirestore.isEmpty(listName)
  const isDynamicList = cloudFirestore.isDynamicList(listName)
  const isNextList = cloudFirestore.isNextList(listName)

  if (isEmpty) {
    try {
      console.log(`Adding the list: ${listName}...`)
      let result = await cloudStorage.getFile(gcsEvent)
      await cloudFirestore.bulkInsert(listName, result)

      console.log('All documents are inserted!')

      if (isDynamicList) {
        console.log(`Updating static list with the outputs of: ${listName}...`)
        await cloudFirestore.bulkUpdate(listName, result)

        await cloudNotifications.sendNotifications(listName)
        console.log('All documents are updated!')
      } else if (isNextList) {
        console.log(`Updating static list with the outputs of: ${listName}...`)
        await cloudFirestore.bulkNextUpdate(listName, result)

        await cloudNotifications.sendNotifications(listName)
        console.log('All documents are updated!')
      }

      return true
    } catch (err) {
      console.log(err)
    }
  } else if (isDynamicList) {
    try {
      console.log(`Removing the list: ${listName}...`)
      await cloudFirestore.bulkDelete(listName)

      console.log(`Adding the list: ${listName}...`)
      let result = await cloudStorage.getFile(gcsEvent)
      await cloudFirestore.bulkInsert(listName, result)
      console.log('All dynamics documents are inserted!')

      console.log(`Updating static list with the outputs of: ${listName}...`)
      await cloudFirestore.bulkUpdate(listName, result)

      await cloudNotifications.sendNotifications(listName)
      console.log('All documents are inserted and updated!')
    } catch (err) {
      console.log(err)
    }
  } else if (isNextList) {
    try {
      console.log(`Removing the list: ${listName}...`)
      await cloudFirestore.bulkDelete(listName)

      console.log(`Adding the list: ${listName}...`)
      let result = await cloudStorage.getFile(gcsEvent)
      await cloudFirestore.bulkInsert(listName, result)
      console.log('All dynamics documents are inserted!')

      console.log(`Updating static list with the outputs of: ${listName}...`)
      await cloudFirestore.bulkNextUpdate(listName, result)

      await cloudNotifications.sendNotifications(listName)
      console.log('All documents are inserted and updated!')
    } catch (err) {
      console.log(err)
    }
  }
}
