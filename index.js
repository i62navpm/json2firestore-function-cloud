const cloudFirestore = require('./src/cloudFirestore')()
const cloudStorage = require('./src/cloudStorage')()

// exports.json2firebase = async (event, context) => {
const json2firebase = async (event, context) => {
  const gcsEvent = event

  const [listName] = gcsEvent.name.split('.')
  const isEmpty = await cloudFirestore.isEmpty(listName)
  const isDynamicList = cloudFirestore.isDynamicList(listName)

  if (isEmpty) {
    try {
      console.log(`Adding the list: ${listName}...`)
      let result = await cloudStorage.getFile(gcsEvent)
      await cloudFirestore.bulkInsert(listName, result)

      console.log('All documents inserted!')
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
      console.log('All dynamics documents inserted!')

      console.log(`Updating static list with the outputs of: ${listName}...`)
      await cloudFirestore.updateTransaction(listName, result)

      console.log('All documents inserted and updated!')
    } catch (err) {
      console.log(err)
    }
  }
}

json2firebase()
