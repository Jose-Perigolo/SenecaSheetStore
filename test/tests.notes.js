/* Copyright © 2024 Seneca Project Contributors, MIT License. */

require('dotenv').config({ path: '.env.local' })
// console.log(process.env) // remove this


import Seneca from 'seneca'
// import SenecaMsgTest from 'seneca-msg-test'
// import { Maintain } from '@seneca/maintain'

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

    // No sheet options, but this should still work, as perhaps
    // only dynamic files are needed
          .use(SheetStore)
    await seneca.ready()

    // An object containing any libs used to load excel, csv, etc
    expect(seneca.export('SheetStore/native')).toBeDefined()

    // A utility function to dynamically define entities
    // Definitions are local to the senenca delegate
    expect(seneca.export('SheetStore/define')).toBeDefined()
  })


  test('options', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use('entity')

    // static files
          .use(SheetStore, {
            file: {
              foo: {
                path: 'local-file-path',
                kind: 'excel', // let's be explicit, not using file extensions
                row: {
                  // header: 1 - default
                  data: 3 // data starts at row 3
                }
              },
              bar: {
                path: 'local-file-path',
                kind: 'csv',
                row: {
                  header: -1, // no headers - create column names
                  data: 1,
                }
              },
            },
          })

    // Test data in local files:
    // 
    // foo:
    // 1; red, green, blue # field names
    // 2: Red, Green, Blue # field titles, ignored
    // 3: 0, 0, 0
    // 4: 255, 255, 255
    // 
    // bar:
    // 111,111,111
    // 222,222,222
    
    // Load test files and validate
    const rows = await seneca.entity('sheet/foo/s1').list$()
    // rows = [{red:0,green:0,blue:0},{red:255,green:255,blue:255}] # seneca Entity objects
    // namespacing:
    // zone: sheet - fixed
    // base: key name from options.file
    // name: sheet number, or name if named in file (in this case, apply s/[^\w\d_]/_/g)
    //       if unnamed, use s1, s2, s3, etc
    
    rows = await seneca.entity('sheet/bar/s1').list$()
    // rows = [{c1:111,c2:111,c3:111},{c1:222,c2:222,c3:222}] # seneca Entity objects
    // columns fields: c1, c2, c3, etc

    // in general, for data sheets, start coounting at 1, not 0
  })

  
  test('dyanmic', async () => {
    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use('entity')

    // static files
          .use(SheetStore)

    const define = seneca.export(SheetStore/define)

    // returns a seneca delegate
    const seneca0 = define({
      file: {
        foo: {
          path: 'local-file-path',
          // kind: excel - default
          row: {
            data: 3
          }
        },
        bar: {
          path: 'local-file-path',
          kind: 'csv',
          row: {
            header: -1,
            data: 1,
          }
        },
      },
    })

    // same result as options

    // A different sheet/foo/s1 file
    const seneca1 = define({
      file: {
        foo: {
          path: 'other local-file-path',
        },
      }
    })
    
  })
  
})