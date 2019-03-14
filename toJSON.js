/**
 * toJSON - Converts xls to json file
 *
 * Headers order expected:
 * [ 'Etiqueta', 'Traducción Español', 'Traducción Inglés' ]
 *
 * TODO:
 * - validations
 * - use name page instead of index
 * - config headers format
 * - config languaje index
 */
const fs = require('fs')
const xlsx = require('node-xlsx')

const ARGV = require('minimist')(process.argv.slice(2))
if (Object.keys(ARGV).length === 1) exit(`Generates json object from xlsx.
Usage:

toJSON --lang esp||eng --input <file> [ --output <filename> --page <number> ]

 --lang (esp or eng):
    Language to generate json (should change in the future).

 --input (filename path)
    Local file path to xlsx file.

 --page (number)
    Page index inside the xlsx file.

 --output (name)
    Filename to save content to, default tho stdout.

------- NOTE -------
Use xlsx headers:
  Etiqueta - Traducción Español - Traducción Inglés 
`)

if (!ARGV.lang) exit('Include --lang parameter with \'esp\' or \'eng\' option.')
if (!ARGV.input) exit('Include --input parameter with path to local xlsx file.')

const PAGE = (typeof ARGV.page !== 'undefined') ? ARGV.page : null
const FILE_INPUT = ARGV.input
const LANG = ARGV.lang
const OUTPUT_NAME = ARGV.output || null

// -- RUN {{{
const parsedXlsx = xlsx.parse(FILE_INPUT)
let pages
if (PAGE === null) {
  const headers = parsedXlsx.map(p => p.data[0])
  testEqualHeaders(headers)
  pages = concatPages(parsedXlsx)
} else {
  pages = concatPages([ parsedXlsx[PAGE] ])
}

const json = JSON.stringify(
  langObject(pages, LANG),
  null,
  2
)

// output - file or stdout
if (OUTPUT_NAME !== null) {
  const FILE = OUTPUT_NAME + '.json'
  const wstream = fs.createWriteStream(FILE)
    .on('finish', () => console.log('File created: %s', FILE))
  wstream.write(json)
  wstream.end()
} else {
  console.log(json)
}
// }}}
// --- FNs {{{
/*
 * Generate object from array
 * - must follow current header order
 */
function langObject (pages, lang) {
  return pages.reduce((obj, row) => {
    // !! - Consider header order
    const [ label = null, esp, eng ] = row
    if (label !== null) {
      switch (lang) {
        case 'esp':
          obj[label] = esp
          break
        case 'eng':
          obj[label] = eng
          break
      }
    }
    return obj
  }, {})
}

/**
 * Check if headers from all pages are equal
 * - compares to page 0
 *
 * test break > headers[2] = [ 'Traducción Español','Etiqueta', 'Traducción Inglés' ]
 */
function testEqualHeaders (headers) {
  const equalHeaders = headers.every(header => 
    header.every((item, i) => 
      item === headers[0][i]
    )
  )
  if (!equalHeaders) exit('Pages headers are not equal. Use --page param or set same headers on all the pages.')
}

/**
 * Concat all pages rows with no headers
 * - pages[].data = all the rows (headers as first element)
 */
function concatPages (pages, lang) {
  return pages.reduce((all, page) => {
    const [ headers, ...rows ] = page.data
    return all.concat(rows)
  }, [])
}

/**
 * Exit process with message, helper
 */
function exit (message, cb) {
  console.log('\n' + message + '\n')
  process.exit()
}

// }}}
