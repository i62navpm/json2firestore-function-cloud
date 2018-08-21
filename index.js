const cloudFirestore = require('./src/cloudFirestore')()
const cloudStorage = require('./src/cloudStorage')()
const listTypes = require('./config/filesConfig')

// exports.json2firebase = async (event, context) => {
const json2firebase = async (event, context) => {
  const gcsEvent = event

  const [listName] = gcsEvent.name.split('.')
  const isEmpty = await cloudFirestore.isEmpty(listName)
  const isDynamicList = listTypes.dynamicLists.indexOf(listName) !== -1

  if (isEmpty) {
    try {
      let result = await cloudStorage.getFile(gcsEvent)
      await cloudFirestore.bulkInsert(listName, result)
      console.log('All documents inserted!')
      return true
    } catch (err) {
      console.log(err)
    }
  } else if (isDynamicList) {
    // TODO: Transaction Time
  }
}

json2firebase()
