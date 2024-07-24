"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const exceljs_1 = __importDefault(require("exceljs"));
function SheetStore(options) {
    console.log('SheetStore options:', options);
    const seneca = this;
    const init = seneca.export('entity/init');
    let store = {
        name: 'SheetStore',
        list: async function (msg, reply) {
            const { zone, base, name } = msg;
            console.log(msg);
            if (!options.file[base]) {
                return reply();
            }
            const fileOptions = options.file[base];
            const filePath = path_1.default.resolve(fileOptions.path);
            try {
                const data = await loadData(filePath, fileOptions);
                reply(null, data);
            }
            catch (err) {
                console.error('Error in list function:', err);
                reply(err);
            }
        },
        save: async function (msg, reply) {
            reply(null, null);
        },
        load: async function (msg, reply) {
            reply(null, null);
        },
        remove: async function (msg, reply) {
            reply(null, null);
        },
        close: function (_msg, reply) {
            reply();
        },
        native: function (_msg, reply) {
            reply(null, {
                client: () => null,
            });
        },
    };
    init(seneca, options, store);
    // Load static files provided in options
    for (const [base, fileOptions] of Object.entries(options.file)) {
        defineEntity(base, fileOptions, seneca);
    }
    return {
        name: store.name,
        exportmap: {
            native: () => null,
            define: (base, fileOptions) => {
                return defineEntity(base, fileOptions, seneca);
            }
        },
    };
}
async function loadData(filePath, options) {
    if (options.kind === 'excel' || options.kind === 'csv') {
        return loadExcelOrCsvData(filePath, options.row);
    }
    else {
        throw new Error('Unsupported file type');
    }
}
async function loadExcelOrCsvData(filePath, rowOptions) {
    const workbook = new exceljs_1.default.Workbook();
    if (filePath.endsWith('.csv')) {
        await workbook.csv.readFile(filePath);
    }
    else {
        await workbook.xlsx.readFile(filePath);
    }
    const worksheet = workbook.worksheets[0];
    console.log('worksheet:', rowOptions === null || rowOptions === void 0 ? void 0 : rowOptions.header, filePath.endsWith('.csv'));
    const headerRowIndex = (filePath.endsWith('.csv') && (rowOptions === null || rowOptions === void 0 ? void 0 : rowOptions.header) === undefined) ? 0 : (rowOptions === null || rowOptions === void 0 ? void 0 : rowOptions.header) || 1;
    const dataRowIndex = (filePath.endsWith('.csv') && (rowOptions === null || rowOptions === void 0 ? void 0 : rowOptions.data) === undefined) ? 1 : (rowOptions === null || rowOptions === void 0 ? void 0 : rowOptions.data) || 2;
    const headerRow = worksheet.getRow(headerRowIndex);
    let headers = [];
    if (headerRowIndex > 0 && Array.isArray(headerRow.values)) {
        headers = headerRow.values.slice(1).map(value => String(value));
    }
    else if (headerRowIndex === 0) {
        const maxColumn = worksheet.columnCount;
        headers = Array.from({ length: maxColumn }, (_, i) => `c${i + 1}`);
    }
    const data = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber >= dataRowIndex) {
            const rowData = {};
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1] || `c${colNumber}`;
                if (typeof header === 'string') {
                    rowData[header] = cell.value;
                }
            });
            data.push(rowData);
        }
    });
    return data;
}
function defineEntity(base, fileOptions, seneca) {
    const { path: filePath, kind, row } = fileOptions;
    seneca.add(`role:entity,cmd:list,base:${base}`, async function (msg, reply) {
        const fileConfig = { path: filePath, kind, row };
        try {
            const data = await loadData(path_1.default.resolve(filePath), fileConfig);
            reply(null, data);
        }
        catch (err) {
            console.error('Error in list function:', err);
            reply(err);
        }
    });
}
// Default options.
const defaults = {
    debug: false,
    file: {}
};
Object.assign(SheetStore, {
    defaults
});
exports.default = SheetStore;
if ('undefined' !== typeof module) {
    module.exports = SheetStore;
}
//# sourceMappingURL=SheetStore.js.map