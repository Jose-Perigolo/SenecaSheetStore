type SheetStoreOptions = {
    debug?: boolean;
    file: Record<string, {
        path: string;
        kind: 'excel' | 'csv';
        row: {
            header?: number;
            data: number;
        };
    }>;
};
declare function SheetStore(this: any, options: SheetStoreOptions): {
    name: string;
    exportmap: {
        native: () => null;
        define: (base: string, fileOptions: any) => void;
    };
};
export default SheetStore;
