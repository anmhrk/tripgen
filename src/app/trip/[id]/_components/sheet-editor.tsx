"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { api } from "~/trpc/react";
import { parse, unparse } from "papaparse";
import type { Session } from "next-auth";
import debounce from "lodash.debounce";

import { DataGrid, textEditor } from "react-data-grid";
import { cn } from "~/lib/utils";
import { SheetNav } from "./sheet-nav";
import type { Sheet } from "~/lib/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SheetEditorProps {
  name: string;
  isOwner: boolean;
  session: Session | null;
  csvContent: string;
}

const MIN_ROWS = 100;
const MIN_COLS = 26;
const DEBOUNCE_MS = 1000;

export function SheetEditor({
  name,
  isOwner,
  session,
  csvContent,
}: SheetEditorProps) {
  const { resolvedTheme } = useTheme();
  const params = useParams<{ id: string }>();
  const [currentSheet, setCurrentSheet] = useState<Sheet>("itinerary");
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const trpcUtils = api.useUtils();

  useEffect(() => {
    setMounted(true);
  }, []);

  const tripSheets = api.trips.getSheetData.useQuery({
    tripId: params.id,
  });
  const sheetData = tripSheets.data?.find(
    (sheet) => sheet.name === currentSheet,
  );

  const [lastSaved, setLastSaved] = useState(sheetData?.lastUpdated);
  const [content, setContent] = useState(sheetData?.content);

  useEffect(() => {
    if (sheetData) {
      setContent(sheetData.content);
      setLastSaved(sheetData.lastUpdated);
    }
  }, [sheetData]);

  const updateTripSheet = api.trips.updateTripSheet.useMutation({
    onSuccess: (_, variables) => {
      const { sheetName, sheetContent } = variables;
      setLastSaved(new Date());
      setContent(sheetContent);

      trpcUtils.trips.getSheetData.setData({ tripId: params.id }, (old) => {
        if (!old) return [];
        return old.map((sheet) =>
          sheet.name === sheetName
            ? { ...sheet, content: sheetContent, lastUpdated: new Date() }
            : sheet,
        );
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const debouncedUpdateSheet = useCallback(
    debounce((sheetContent: string) => {
      if (!session) return;

      setSaving(true);
      updateTripSheet.mutate({
        tripId: params.id,
        sheetName: currentSheet,
        sheetContent,
      });
    }, DEBOUNCE_MS) as ReturnType<typeof debounce>,
    [params.id, currentSheet, session, updateTripSheet],
  );

  useEffect(() => {
    // For now, only support the itinerary sheet
    if (csvContent && currentSheet === "itinerary" && session) {
      const result = parse<string[]>(csvContent, { skipEmptyLines: true });

      if (result.data && result.data.length > 0) {
        const formattedCsv = unparse(result.data);
        setContent(formattedCsv);
        debouncedUpdateSheet(formattedCsv);
      }
    }

    return () => {
      debouncedUpdateSheet.cancel();
    };
  }, [csvContent, currentSheet, session, debouncedUpdateSheet]);

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
      width: i === 4 ? 250 : i === 5 ? 400 : 120,
      cellClass: cn(
        `border-t dark:bg-zinc-950 dark:text-zinc-50 whitespace-normal`,
        {
          "border-l": i !== 0,
        },
      ),
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
    if (!session) {
      toast.error("Please sign in to save your changes");
      return;
    }
    setRows(newRows);

    const updatedData = newRows.map((row) => {
      return columns.slice(1).map((col) => row[col.key] ?? "");
    });

    const newCsvContent = unparse(updatedData);

    setSaving(true);
    updateTripSheet.mutate({
      tripId: params.id,
      sheetName: currentSheet,
      sheetContent: newCsvContent,
    });
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
            lastSaved={lastSaved}
            saving={saving}
            isDataLoading={tripSheets.isLoading}
          />
          <div className="flex-1 overflow-auto">
            {tripSheets.isLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="size-8 animate-spin" />
              </div>
            ) : (
              <DataGrid
                columns={columns}
                rows={rows}
                rowHeight={40}
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
            )}
          </div>
        </>
      )}
    </div>
  );
}
