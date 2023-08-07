import { useEffect, useState } from "react";

import {
  ColumnOrderState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as XLSX from "xlsx";
type Person = {
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  status: string;
  progress: number;
};
const defaultData: Person[] = [
  {
    firstName: "tanner",
    lastName: "linsley",
    age: 24,
    visits: 100,
    status: "In Relationship",
    progress: 50,
  },
  {
    firstName: "tandy",
    lastName: "miller",
    age: 40,
    visits: 40,
    status: "Single",
    progress: 80,
  },
  {
    firstName: "joe",
    lastName: "dirte",
    age: 45,
    visits: 20,
    status: "Complicated",
    progress: 10,
  },
];
const options = ["account number", "currency", "name"];

function App() {
  const [data, setData] = useState([]);
  const [modifiedData, setModifiedData] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);
  const columnHelper = createColumnHelper<Person>();

  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  // const [getHeader, setHeader] = useState([]);
  const getHeader = Object?.keys(data[0] || []);
  const handleFileUpload = (e: any) => {
    const reader = new FileReader();
    reader.readAsBinaryString(e.target.files[0]);
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet);
      setData(parsedData);
    };
  };

  const generateDynamicColumns = (records: any) => {
    return [
      {
        id: "column",
        header: () => <span>Current Xl</span>,
        columns: records.map((columnName) => {
          return columnHelper.accessor(columnName, {
            cell: (info) => info.getValue(),
            header: () => <span>{columnName}</span>,
            footer: (info) => info.column.id,
          });
        }),
      },
    ];
  };

  const columns = generateDynamicColumns(getHeader);
  const columns2 = generateDynamicColumns(options);
  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
      columnOrder,
    },
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
  });
  console.log({ modifiedData });

  const table2 = useReactTable({
    data: modifiedData,
    columns: columns2,
    state: {
      columnVisibility,
      columnOrder,
    },
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
  });
  console.log(selectedCols, "selected");
  useEffect(() => {
    const updateKeys = selectedCols.map((col) => {
      return data.map((data) => {
        const newObject = {};
        delete Object.assign(newObject, data, {
          [col.mapped]: data[col.current],
        })[col.current];
        return newObject;
      });
    });

    setModifiedData(updateKeys);
  }, [selectedCols]);

  if (data.length === 0) {
    return (
      <>
        <div>Exploring Tanstack table</div>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      </>
    );
  }
  return (
    <div>
      <div className="text-base font-normal">Exploring Tanstack table</div>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      <div className="p-2">
        <div className="flex flex-col gap-3 mt-4">
          {table.getAllLeafColumns().map((column) => {
            return (
              <div key={column.id} className="px-1">
                <label>
                  <input
                    {...{
                      type: "checkbox",
                      checked: column.getIsVisible(),
                      onChange: column.getToggleVisibilityHandler(),
                    }}
                  />{" "}
                  {column.id}
                </label>
                <div>
                  <label className="text-sm" for="column-mapping">
                    Column mpping :{" "}
                  </label>

                  <select
                    className="border text-sm"
                    name="column-mapping"
                    id="column-mapping"
                    onChange={(e) => {
                      setSelectedCols((prev) => [
                        ...prev,
                        { current: column.id, mapped: e.target.value },
                      ]);
                    }}
                  >
                    <option value="select">select</option>
                    {options.map((opt) => {
                      return <option value={opt}>{opt}</option>;
                    })}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
        <table className="border-2 mt-4">
          <thead className="border-2">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    className="border-2 px-2 text-left"
                    key={header.id}
                    colSpan={header.colSpan}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td className="border-2 px-2" key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="h-4" />

        <div>
          <table className="border-2 mt-4">
            <thead className="border-2">
              {table2.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      className="border-2 px-2 text-left"
                      key={header.id}
                      colSpan={header.colSpan}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table2.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td className="border-2 px-2" key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
