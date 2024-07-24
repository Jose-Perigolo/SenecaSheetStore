import path from 'path'
import exceljs from 'exceljs'

type SheetStoreOptions = {
  debug?: boolean
  file: Record<string, {
    path: string
    kind: 'excel' | 'csv'
    row: {
      header?: number
      data: number
    }
  }>
}

function SheetStore(this: any, options: SheetStoreOptions) {
  // console.log('SheetStore options:', options)
  const seneca: any = this

  const init = seneca.export('entity/init')

  let store = {
    name: 'SheetStore',

    list: async function (this: any, msg: any, reply: any) {
      const { zone, base, name } = msg
      console.log(msg)

      if (!options.file[base]) {
        return reply()
      }

      const fileOptions = options.file[base]
      const filePath = path.resolve(fileOptions.path)

      try {
        const data = await loadData(filePath, fileOptions)
        reply(null, data)
      } catch (err) {
        console.error('Error in list function:', err)
        reply(err)
      }
    },

    save: async function (msg: any, reply: any) {
      reply(null, null)
    },

    load: async function (msg: any, reply: any) {
      reply(null, null)
    },

    remove: async function (msg: any, reply: any) {
      reply(null, null)
    },

    close: function (this: any, _msg: any, reply: any) {
      reply()
    },

    native: function (this: any, _msg: any, reply: any) {
      reply(null, {
        client: () => null,
      })
    },
  }

  init(seneca, options, store)

  // Load static files provided in options
  for (const [base, fileOptions] of Object.entries(options.file)) {
    defineEntity(base, fileOptions, seneca)
  }
  
  return {
    name: store.name,
    exportmap: {
      native: () => null,
      define: (base: string, fileOptions: any) => {
        return defineEntity(base, fileOptions, seneca)
      }
    },
  }
}

async function loadData(filePath: string, options: { kind: string, row: { header?: number, data: number } }): Promise<any[]> {
  if (options.kind === 'excel' || options.kind === 'csv') {
    return loadExcelOrCsvData(filePath, options.row)
  } else {
    throw new Error('Unsupported file type')
  }
}

async function loadExcelOrCsvData(filePath: string, rowOptions: { header?: number, data: number }): Promise<any[]> {
  const workbook = new exceljs.Workbook()

  if (filePath.endsWith('.csv')) {
    await workbook.csv.readFile(filePath)
  } else {
    await workbook.xlsx.readFile(filePath)
  }

  const worksheet = workbook.worksheets[0]

  console.log('worksheet:', rowOptions?.header, filePath.endsWith('.csv'))
  const headerRowIndex = (filePath.endsWith('.csv') && rowOptions?.header === undefined) ? 0 : rowOptions?.header || 1
  const dataRowIndex = (filePath.endsWith('.csv') && rowOptions?.data === undefined) ? 1 : rowOptions?.data || 2
  const headerRow = worksheet.getRow(headerRowIndex)
  let headers: string[] = []

  if (headerRowIndex > 0 && Array.isArray(headerRow.values)) {
    headers = headerRow.values.slice(1).map(value => String(value))
  } else if (headerRowIndex === 0) {
    const maxColumn = worksheet.columnCount
    headers = Array.from({ length: maxColumn }, (_, i) => `c${i + 1}`)
  }

  const data: any[] = []

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber >= dataRowIndex) {
      const rowData: any = {}
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1] || `c${colNumber}`
        if (typeof header === 'string') {
          rowData[header] = cell.value
        }
      })
      data.push(rowData)
    }
  })

  return data
}

function defineEntity(base: string, fileOptions: { path: string, kind: string, row: { header?: number, data: number } }, seneca: any) {
  const { path: filePath, kind, row } = fileOptions
  seneca.add(`role:entity,cmd:list,base:${base}`, async function (msg: any, reply: any) {
    const fileConfig = { path: filePath, kind, row }
    try {
      const data = await loadData(path.resolve(filePath), fileConfig)
      reply(null, data)
    } catch (err) {
      console.error('Error in list function:', err)
      reply(err)
    }
  })
}

// Default options.
const defaults: SheetStoreOptions = {
  debug: false,
  file: {}
}

Object.assign(SheetStore, {
  defaults
})

export default SheetStore

if ('undefined' !== typeof module) {
  module.exports = SheetStore
}
