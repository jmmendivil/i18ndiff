/**
 * toXLSX - Converts json to xls
 *
 * Json structure:
 * {
 *   label: 'text'
 *   label2: 'text2'
 * }
 *
 * TODO:
 * - validations
 * - config json object format
 * - append contents to a file (new sheet)
 */
const fs = require('fs')
const xlsx = require('node-xlsx')

const ARGV = require('minimist')(process.argv.slice(2))
if (Object.keys(ARGV).length === 1) exit(`Generates xlsx file from json.
Usage:

toXlsx --input <file> --output <filename>

 --input (filename path)
    Local file path to xlsx file.

 --output (name)
    Filename to save content to.

 --sheetname (name)
    Name for sheet to save content.
`)

if (!ARGV.input) exit('Include --input parameter with path to local json file.')

const FILE_INPUT = ARGV.input
const SHEETNAME = ARGV.SHEETNAME || 'Sheet'
let OUTPUT_NAME

// use same input filename for output
if (!ARGV.output) {
  let file = FILE_INPUT
  if (file.includes('/')) {
    fileArray = FILE_INPUT.split('/')
    file = fileArray[fileArray.length - 1]
  }
  OUTPUT_NAME = file.substr(0, file.lastIndexOf('.'))
} else {
  OUTPUT_NAME = ARGV.output
}

// -- RUN {{{
const jsonData = fs.readFileSync(FILE_INPUT, 'utf8')

const headers = ['Etiqueta', 'Traducción']  // TODO: make it configurable
const content = toArray(JSON.parse(jsonData))
content.unshift(headers)

const buffer = xlsx.build([{
  name: SHEETNAME,
  data: content
}])

// output - file
const FILE = OUTPUT_NAME + '.xlsx'
const wstream = fs.createWriteStream(FILE)
  .on('finish', () => console.log('File created: %s', FILE))
wstream.write(buffer)
wstream.end()
// }}}
// --- FNs {{{
/*
 * Generate array from object
 */
function toArray (obj) {
  return Object.keys(obj).map(k => [k, obj[k]])
}

/**
 * Exit process with message, helper
 */
function exit (message, cb) {
  console.log('\n' + message + '\n')
  process.exit()
}

// }}}
