/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeEvent, useEffect, useState } from "react";
import { first, groupBy, merge } from "lodash";
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
  "transaction",
];

function App() {
  const [data, setData] = useState<any[]>([]);
  const [modifiedData, setModifiedData] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);
  const [getSpecific, setGetSpecific] = useState("");
  const [updatedData, setUpdatedData] = useState<unknown[]>([]);
  const [seperatedData, setSeperatedData] = useState<any[]>([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);

  const columnHelper = createColumnHelper<Person>();
  const getHeader = Object?.keys(data[0] || []);

  const handleFileUpload = (e: any) => {
    const reader = new FileReader();
    reader.readAsBinaryString(e.target.files[0]);
    reader.onload = (e: any) => {
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
        header: () => <span>From Xl</span>,
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
    const grouped = groupBy(records, "mapped");

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
  const columns = generateDynamicColumns(getHeader);
  const columns2 = generateDynamicColumnsGrouping(selectedCols);

  const updateEditPayment = (mfData: unknown[]) => {
    if (mfData.length === 0) return;
    setUpdatedData(mfData);
    const modifiedData2 = mfData.map((item: any, index: number) => {
      return merge(modifiedData[index], item);
    });
    setModifiedData(modifiedData2);
  };

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
    // const checkLength = arrays[0].length;
    // if (!arrays.every((arr) => arr.length === checkLength)) {
    //   throw new Error("Arrays must have the same length.");
    // }

    return arrays.reduce((mergedArray: any, currentArray: any) => {
      return mergedArray.map((item: any, index: string | number) => ({
        ...item,
        ...currentArray[index],
      }));
    });
  }

  const handleSelectedValue = (
    e: ChangeEvent<HTMLSelectElement>,
    opt: string
  ) => {
    setSelectedCols((prev) => {
      const existingObjectArray = prev.findIndex((v: any) => v.current === opt);
      const updatedDropdownValues: any = [...prev];
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
    const updateKeys = selectedCols.map((col: any) => {
      return data.map((data) => {
        return { [col?.current]: data[col?.mapped] };
      });
    });
    if (selectedCols.some((col: any) => col.current === "transaction")) {
      const splittingNegatives: any = modifiedData.map((item: any) => {
        return {
          ...item,
          credit: Math.sign(item.transaction) === 1 ? item.transaction : 0,
          debit: Math.sign(item.transaction) === -1 ? item.transaction : 0,
        };
      });
      setModifiedData(
        mergeArraysOfObjects(
          ...updateKeys,
          updatedData,
          splittingNegatives
        ) as any
      );
    } else if (updateKeys.length) {
      setModifiedData(mergeArraysOfObjects(...updateKeys, updatedData) as any);
    }
    if (getSpecific === "payment type" && getSpecific.length) {
      setSeperatedData(mergeArraysOfObjects(...updateKeys) as any);
      setGetSpecific("");
      setUpdatedData([]);
    }
  }, [selectedCols, getSpecific, data, updatedData]);

  useEffect(() => {
    if (updatedData.length !== 0) {
      const modifiedData2 = updatedData.map((item: any, index: number) => {
        return merge(modifiedData[index], item);
      });
      setModifiedData(modifiedData2);
    }
  }, [updatedData]);

  if (data.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div>XL to Table</div>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      </div>
    );
  }
  console.log(modifiedData);

  return (
    <div className="max-w-4xl mx-auto py-10">
      <p className="text-lg font-semibold">Mapping controls</p>
      <div className="p-2">
        <div className="grid grid-cols-3 gap-3 mt-4">
          {options.map((opt, index) => {
            return (
              <div key={index}>
                <p className="mb-2 capitalize font-medium text-base">{opt}</p>
                <select
                  className="border text-sm"
                  name="column-mapping"
                  id="column-mapping"
                  onChange={(e) => {
                    if (opt === "payment type") setGetSpecific("payment type");
                    handleSelectedValue(e, opt);
                  }}
                >
                  <option value="select">select</option>
                  {table.getAllLeafColumns().map((column) => {
                    return <option value={column.id}>{column.id}</option>;
                  })}
                </select>
              </div>
            );
          })}
        </div>
        <table className="border-2 mt-10">
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
        {seperatedData.length > 0 && (
          <EditTable
            randomModification={seperatedData}
            handleUpdate={(data: any) => updateEditPayment(data)}
          />
        )}
        <FinalTable table2={table2} />
      </div>
    </div>
  );
}

export default App;

const EditTable = ({
  randomModification,
  handleUpdate,
}: {
  randomModification: any;
  handleUpdate: any;
}) => {
  const [array, setArray] = useState(randomModification);

  useEffect(() => {
    setArray(randomModification);
  }, [randomModification]);

  return (
    <div>
      <p className="px-1">Stone reference mapping</p>
      <table className="border-2 my-1">
        <tr>
          <th className="border-2 p-2">Payment Type</th>
          <th className="border-2 p-2">Payment Type - Stone</th>
        </tr>
        {array.map((e: any, index: number) => {
          return (
            <tr key={index}>
              <td className="border-2 p-1">{e["payment type"]}</td>
              <td className="border-2 p-1">
                <select
                  className="border text-sm"
                  name="column-mapping"
                  id="column-mapping"
                  onChange={(el) => {
                    setArray((prev: any) => {
                      return prev.map((item: any, idx: number) => {
                        if (idx === index) {
                          return {
                            ["payment type"]: el.target.value,
                          };
                        }
                        return item;
                      });
                    });
                  }}
                >
                  <option value="select">select</option>
                  <option value="val 1">val 1</option>
                  <option value="val 2">val 2</option>
                  <option value="val 3">val 3</option>
                </select>
              </td>
            </tr>
          );
        })}
      </table>
      <button
        onClick={() => handleUpdate(array)}
        className="rounded-sm shadow-sm mb-4 border py-2 px-4 bg-black text-white font-medium text-xs"
      >
        Update
      </button>
    </div>
  );
};

const FinalTable = ({ table2 }: { table2: any }) => {
  return (
    <div>
      <p className="px-1">Final table structure</p>
      <table className="border-2 mt-1">
        <thead className="border-2">
          {table2.getHeaderGroups().map((headerGroup: any) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header: any) => (
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
          {table2.getRowModel().rows.map((row: any) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell: any) => (
                <td className="border-2 px-2" key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

//   (e) => {
//   setCurrentValue(opt);
//   setSelectedCols((prev) => {
//     return [
//       ...prev,
//       { current: opt, mapped: e.target.value },
//     ];
//   });
// }
