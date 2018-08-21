const Storage = require('@google-cloud/storage')

module.exports = function() {
  const storage = new Storage()

  function getFile({ bucket, name }) {
    if (name.split('.')[1] !== 'json') return

    let bodyparts = []

    const readStream = storage
      .bucket(bucket)
      .file(name)
      .createReadStream()
      .on('error', err => console.log('event: error', err.message))
      .on('data', chunk => bodyparts.push(chunk))
      .on('close', () => console.log('event: close'))

    return new Promise((resolve, reject) =>
      readStream
        .on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(bodyparts).toString()))
          } catch (err) {
            console.log(err)
            reject(err)
          } finally {
            console.log(`Read "[${name.toUpperCase()}]"!`)
          }
        })
        .on('error', reject)
    )
  }

  return { getFile }
}
