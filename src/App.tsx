/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import _, { first } from "lodash";
import {
  ColumnOrderState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as XLSX from "xlsx";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

type Person = {
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  status: string;
  progress: number;
};

// const reorderColumn = (
//   draggedColumnId: string,
//   targetColumnId: string,
//   columnOrder: string[]
// ): ColumnOrderState => {
//   columnOrder.splice(
//     columnOrder.indexOf(targetColumnId),
//     0,
//     columnOrder.splice(columnOrder.indexOf(draggedColumnId), 1)[0] as string
//   );
//   return [...columnOrder];
// };
// const DraggableColumnHeader: FC<{
//   header: Header<Person, unknown>;
//   table: Table<Person>;
// }> = ({ header, table }) => {
//   const { getState, setColumnOrder } = table;
//   const { columnOrder } = getState();
//   const { column } = header;

//   const [, dropRef] = useDrop({
//     accept: "column",
//     drop: (draggedColumn: Column<Person>) => {
//       const newColumnOrder = reorderColumn(
//         draggedColumn.id,
//         column.id,
//         columnOrder
//       );
//       setColumnOrder(newColumnOrder);
//     },
//   });

//   const [{ isDragging }, dragRef, previewRef] = useDrag({
//     collect: (monitor) => ({
//       isDragging: monitor.isDragging(),
//     }),
//     item: () => column,
//     type: "column",
//   });

//   return (
//     <th
//       ref={dropRef}
//       colSpan={header.colSpan}
//       style={{ opacity: isDragging ? 0.5 : 1 }}
//     >
//       <div ref={previewRef}>
//         {header.isPlaceholder
//           ? null
//           : flexRender(header.column.columnDef.header, header.getContext())}
//         <button ref={dragRef}>🟰</button>
//       </div>
//     </th>
//   );
// };
const options = [
  "account number",
  "currency",
  "name",
  "payment type",
  "debit",
  "credit",
];

function App() {
  const [data, setData] = useState([]);
  const [modifiedData, setModifiedData] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);

  const columnHelper = createColumnHelper<Person>();

  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);

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
        // header: () => <span>{header}</span>,
        columns: records.map((columnName: any) => {
          return columnHelper.accessor(columnName, {
            cell: (info) => info.getValue(),
            header: () => <span>{columnName}</span>,
            footer: (info) => info.column.id,
          });
        }),
      },
    ];
  };

  const generateDynamicColumnsGrouping = (records: any) => {
    const grouped = _.groupBy(records, "mapped");

    const t = Object.keys(grouped).map((e) => {
      if (grouped[e].length > 1) {
        return columnHelper.group({
          id: "group",
          header: () => <span>{e}</span>,
          columns: grouped[e].map((columnName: any) => {
            return columnHelper.accessor(columnName.current, {
              cell: (info) => info.getValue(),
              header: () => <span>{columnName.current}</span>,
            });
          }),
        });
      } else {
        return columnHelper.accessor(
          (row: any) => {
            return row[first(grouped[e]).current];
          },
          {
            header: first(grouped[e]).current,
            cell: (info) => info.getValue(),
          }
        );
      }
    });

    return t;
  };
  // generateDynamicColumnsGrouping(selectedCols);
  const columns = generateDynamicColumns(getHeader);
  const columns2 = generateDynamicColumnsGrouping(selectedCols);
  // const columns2 = generateDynamicColumns(options);

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

  function mergeArraysOfObjects(...arrays: (string | any[])[]) {
    const checkLength = arrays[0].length;
    if (!arrays.every((arr) => arr.length === checkLength)) {
      throw new Error("Arrays must have the same length.");
    }

    return arrays.reduce((mergedArray, currentArray) => {
      return mergedArray.map((item: any, index: string | number) => ({
        ...item,
        ...currentArray[index],
      }));
    });
  }

  const handleSelectedValue = (e, opt) => {
    setSelectedCols((prev) => {
      const existingObjectArray = prev.findIndex((v) => v.current === opt);
      const updatedDropdownValues = [...prev];
      if (existingObjectArray !== -1) {
        updatedDropdownValues[existingObjectArray] = {
          current: opt,
          mapped: e.target.value,
        };
      } else {
        updatedDropdownValues.push({ current: opt, mapped: e.target.value });
      }
      return updatedDropdownValues;
    });
  };

  useEffect(() => {
    const updateKeys = selectedCols.map((col) => {
      return data.map((data) => {
        return { [col?.current]: data[col?.mapped] };
      });
    });
    if (updateKeys.length) setModifiedData(mergeArraysOfObjects(...updateKeys));
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
    <DndProvider backend={HTML5Backend}>
      <div className="text-base font-normal">Exploring Tanstack table</div>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      <div className="p-2">
        <div className="flex flex-col gap-3 mt-4">
          {options.map((opt) => {
            return (
              <label htmlFor="">
                {opt} :{" "}
                <select
                  className="border text-sm"
                  name="column-mapping"
                  id="column-mapping"
                  onChange={(e) => handleSelectedValue(e, opt)}
                >
                  <option value="select">select</option>
                  {table.getAllLeafColumns().map((column) => {
                    return <option value={column.id}>{column.id}</option>;
                  })}
                </select>
              </label>
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
    </DndProvider>
  );
}

export default App;

//   (e) => {
//   setCurrentValue(opt);
//   setSelectedCols((prev) => {
//     return [
//       ...prev,
//       { current: opt, mapped: e.target.value },
//     ];
//   });
// }
