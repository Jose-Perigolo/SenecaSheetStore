/* Copyright © 2024 Seneca Project Contributors, MIT License. */

require('dotenv').config({ path: '.env.local' })

import Seneca from 'seneca'

import SheetStoreDoc from '../src/SheetStoreDoc'
import SheetStore from '../src/SheetStore'

describe('SheetStore', () => {
  test('load-plugin', async () => {
    expect(SheetStore).toBeDefined()
    expect(SheetStoreDoc).toBeDefined()

    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use('entity')
      .use(SheetStore)
    await seneca.ready()

    expect(seneca.export('SheetStore/native')).toBeDefined()

    console.log('SheetStore', seneca.export('SheetStore/define'))
    expect(seneca.export('SheetStore/define')).toBeDefined()
  })

  test('options', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use('entity')
      .use(SheetStore, {
        file: {
          foo: {
            path: './test/foo.xlsx',
            kind: 'excel',
            row: {
              header: 1,
              data: 3,
            },
          },
          bar: {
            path: './test/bar.csv',
            kind: 'csv',
            row: {
              header: -1,
              data: 1,
            },
          },
        },
      })

    let rows = await seneca.entity('sheet/foo/s1').list$()
    console.log('ROWS', rows)
    expect(rows).toEqual([
      { red: 0, green: 0, blue: 0 },
      { red: 255, green: 255, blue: 255 },
    ])

    rows = await seneca.entity('sheet/bar/s1').list$()
    expect(rows).toEqual([
      { c1: 111, c2: 111, c3: 111 },
      { c1: 222, c2: 222, c3: 222 },
    ])
  })

  test('options-default', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use('entity')
      .use(SheetStore, {
        file: {
          foo: {
            path: './test/foo.xlsx',
            kind: 'excel',
            // Default row.header is 1 and data begins at 2
            // row: {
            //   header: 1,
            //   data: 3
            // }
          },
          bar: {
            path: './test/bar.csv',
            kind: 'csv',
            // Default row.header is -1 and data begins at 2
            // row: {
            //   header: -1,
            //   data: 1,
            // }
          },
        },
      })

    let rows = await seneca.entity('sheet/foo/s1').list$()
    console.log('ROWS', rows)
    expect(rows).toEqual([
      { red: 'Red', green: 'Green', blue: 'Blue' },
      { red: 0, green: 0, blue: 0 },
      { red: 255, green: 255, blue: 255 },
    ])

    rows = await seneca.entity('sheet/bar/s1').list$()
    console.log('ROWS CSV DEFAULT', rows)
    expect(rows).toEqual([
      { c1: 111, c2: 111, c3: 111 },
      { c1: 222, c2: 222, c3: 222 },
    ])
  })

  test('dynamic-loading', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use('entity')
      .use(SheetStore)

    await seneca.ready()

    const define = seneca.export('SheetStore/define')

    // Define dynamic entity for foo.xlsx
    define('foo', {
      path: './test/foo.xlsx',
      kind: 'excel',
      row: {
        header: 1,
        data: 3,
      },
    })

    // Validate dynamic entity creation
    let rows = await seneca.entity('sheet/foo/s1').list$()
    console.log('Dynamic Load Rows:', rows)
    expect(rows).toEqual([
      { red: 0, green: 0, blue: 0 },
      { red: 255, green: 255, blue: 255 },
    ])

    // Define another dynamic entity for bar.csv
    define('bar', {
      path: './test/bar.csv',
      kind: 'csv',
      row: {
        header: -1,
        data: 1,
      },
    })

    // Validate dynamic entity creation for bar.csv
    rows = await seneca.entity('sheet/bar/s1').list$()
    console.log('Dynamic Load Rows for bar.csv:', rows)
    expect(rows).toEqual([
      { c1: 111, c2: 111, c3: 111 },
      { c1: 222, c2: 222, c3: 222 },
    ])
  })
})
