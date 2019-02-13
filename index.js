const fs = require('fs')
const https = require('https')
const parseCSV = require('csv-parse')
const stringifyCSV = require('csv-stringify')

const REMOTE_JSON = 'https://humankhor2.dsindigo.com:4000/languages/es-lat'
const LOCAL_CSV = 'data.csv'
const OUTPUT_NAME = 'diff.csv'

// CSV file output
const csvStream = stringifyCSV({
  header: true,
  columns: {
    missing: 'falta?',
    diff: 'diferente?',
    label: 'label',
    ours: 'tenemos',
    theirs: 'tienen'
  }
})
csvStream
  .pipe(fs.createWriteStream(OUTPUT_NAME))
  .on('finish', () => { console.log('File created: %s', OUTPUT_NAME) })

function processDiff ([ ourJSON, theirJSON ]) {
  const labels = Object.keys(ourJSON)

  labels.forEach(label => {
    let isMissing = false
    let isDiff = false
    // label exists in our file but not on theirs
    if (typeof theirJSON[label] === 'undefined') { isMissing = true }
    // label has diff spanish content
    if (ourJSON[label] !== theirJSON[label] && !isMissing) { isDiff = true }

    const record = ([
      (isMissing) ? 'x' : '',
      (isDiff) ? 'x' : '',
      label,
      ourJSON[label],
      (!isMissing) ? theirJSON[label] : ''
    ])
    csvStream.write(record)
  })
  csvStream.end()
}

// Returns Promises - resolves i18n object { label: translation }
function readRemote (url) {
  let jsonString = ''
  return new Promise((resolve, reject) => {
    https.get(url, response => {
      response.on('data', chunk => { jsonString += chunk })
      response.on('end', () => resolve(JSON.parse(jsonString).data)) // format Obj
      response.on('error', err => reject(err))
    })
  })
}

// Returns Promises - resolves i18n object { label: translation }
function readLocalCSV (file) {
  const json = {}
  const parseConfig = { columns: true, trim: true }
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(parseCSV(parseConfig))
      .on('data', chunk => { json[chunk['label']] = chunk['esp'] }) // format obj
      .on('end', () => resolve(json))
      .on('error', err => reject(err))
  })
}

// EXECUTE
Promise
  .all([ readRemote(REMOTE_JSON), readLocalCSV(LOCAL_CSV) ])
  .then(processDiff)
  .catch(e => console.log('Error! >', e))
