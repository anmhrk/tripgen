"use client";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { DataGrid, textEditor } from "react-data-grid";
import { parse, unparse } from "papaparse";
import { cn } from "~/lib/utils";
import { SheetNav } from "./sheet-nav";
import type { Sheet } from "~/lib/types";

interface SheetEditorProps {
  name: string;
  isOwner: boolean;
}

const MIN_ROWS = 100;
const MIN_COLS = 26;

export function SheetEditor({ name, isOwner }: SheetEditorProps) {
  const { resolvedTheme } = useTheme();
  const [content, setContent] = useState("");
  const [currentSheet, setCurrentSheet] = useState<Sheet>("itinerary");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const parseData = useMemo(() => {
    if (!content)
      return Array(MIN_ROWS).fill(Array(MIN_COLS).fill("")) as string[][];

    const result = parse<string[]>(content, { skipEmptyLines: true });

    const paddedData = result.data.map((row) => {
      const paddedRow = [...row];
      while (paddedRow.length < MIN_COLS) {
        paddedRow.push("");
      }
      return paddedRow;
    });

    while (paddedData.length < MIN_ROWS) {
      paddedData.push(Array(MIN_COLS).fill("") as string[]);
    }

    return paddedData;
  }, [content]);

  const columns = useMemo(() => {
    const rowNumberColumn = {
      key: "rowNumber",
      name: "",
      frozen: true,
      width: 50,
      renderCell: ({ rowIdx }: { rowIdx: number }) => rowIdx + 1,
      cellClass: "border-t border-r dark:bg-zinc-950 dark:text-zinc-50",
      headerCellClass: "border-t border-r dark:bg-zinc-900 dark:text-zinc-50",
    };

    const dataColumns = Array.from({ length: MIN_COLS }, (_, i) => ({
      key: i.toString(),
      name: String.fromCharCode(65 + i),
      renderEditCell: textEditor,
      width: 120,
      cellClass: cn(`border-t dark:bg-zinc-950 dark:text-zinc-50`, {
        "border-l": i !== 0,
      }),
      headerCellClass: cn(`border-t dark:bg-zinc-900 dark:text-zinc-50`, {
        "border-l": i !== 0,
      }),
    }));

    return [rowNumberColumn, ...dataColumns];
  }, []);

  const initialRows = useMemo(() => {
    return parseData.map((row, rowIndex) => {
      const rowData: Record<string, string> = {
        id: rowIndex.toString(),
        rowNumber: (rowIndex + 1).toString(),
      };

      columns.slice(1).forEach((col, colIndex) => {
        rowData[col.key] = row[colIndex] ?? "";
      });

      return rowData;
    });
  }, [parseData, columns]);

  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const handleRowsChange = (newRows: Record<string, string>[]) => {
    setRows(newRows);

    const updatedData = newRows.map((row) => {
      return columns.slice(1).map((col) => row[col.key] ?? "");
    });

    const newCsvContent = unparse(updatedData);
    // saveContent(newCsvContent, true);
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden border-l border-zinc-200 dark:border-zinc-700">
      {mounted && (
        <>
          <SheetNav
            name={name}
            isOwner={isOwner}
            currentSheet={currentSheet}
            setCurrentSheet={setCurrentSheet}
          />
          <div className="flex-1 overflow-auto">
            <DataGrid
              columns={columns}
              rows={rows}
              className={resolvedTheme === "dark" ? "rdg-dark" : "rdg-light"}
              enableVirtualization
              style={{
                height: "100%",
                width: "100%",
              }}
              defaultColumnOptions={{
                resizable: true,
                sortable: true,
              }}
              onRowsChange={handleRowsChange}
              onCellClick={(args) => {
                if (args.column.key !== "rowNumber") {
                  args.selectCell(true);
                }
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
