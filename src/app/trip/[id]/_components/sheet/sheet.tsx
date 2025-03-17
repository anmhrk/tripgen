"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { api } from "~/trpc/react";
import { parse, unparse } from "papaparse";
import type { Session } from "next-auth";
import debounce from "lodash.debounce";
import type { JSONValue } from "ai";
import { Itinerary, TripState } from "~/lib/types";

import { DataGrid, textEditor } from "react-data-grid";
import { cn } from "~/lib/utils";
import { SheetNav } from "./sheet-nav";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { VersionBanner } from "./version-banner";

interface SheetProps {
  name: string;
  isOwner: boolean;
  session: Session | null;
  data: JSONValue[] | undefined;
  itineraries: Itinerary[] | undefined;
  dataLoading: boolean;
  tripState: TripState;
  setTripState: (tripState: TripState) => void;
}

const MIN_ROWS = 100;
const MIN_COLS = 26;
const DEBOUNCE_MS = 1000;

export function Sheet({
  name,
  isOwner,
  session,
  data,
  itineraries,
  dataLoading,
  tripState,
  setTripState,
}: SheetProps) {
  const { resolvedTheme } = useTheme();
  const params = useParams<{ id: string }>();
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const localStorageKey = `tripSheet_columnWidths_${params.id}`;

  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined") {
      const savedWidths = localStorage.getItem(localStorageKey);
      if (savedWidths) {
        try {
          setColumnWidths(JSON.parse(savedWidths));
        } catch (e) {
          console.error("Failed to parse saved column widths", e);
        }
      }
    }
  }, [localStorageKey]);

  const latestItinerary = itineraries?.find(
    (itinerary) => itinerary.version === itineraries.length,
  );

  const [lastSaved, setLastSaved] = useState(latestItinerary?.lastUpdated);
  const [content, setContent] = useState(latestItinerary?.csv);
  const [version, setVersion] = useState(latestItinerary?.version);
  const [currentVersion, setCurrentVersion] = useState(
    latestItinerary?.version,
  );

  useEffect(() => {
    if (latestItinerary) {
      setContent(latestItinerary?.csv);
      setLastSaved(latestItinerary?.lastUpdated);
      setVersion(latestItinerary?.version);
      setCurrentVersion(latestItinerary?.version);
    }
  }, [latestItinerary]);

  const handlePrevVersion = () => {
    const prevVersion = itineraries?.find(
      (itinerary) => itinerary.version === currentVersion! - 1,
    );
    if (prevVersion) {
      setContent(prevVersion.csv);
      setCurrentVersion(prevVersion.version);
    }
  };

  const handleNextVersion = () => {
    const nextVersion = itineraries?.find(
      (itinerary) => itinerary.version === currentVersion! + 1,
    );
    if (nextVersion) {
      setContent(nextVersion.csv);
      setCurrentVersion(nextVersion.version);
    }
  };

  const updateItineraryCsv = api.trips.updateItineraryCsv.useMutation({
    onSuccess: (_, variables) => {
      const { newCsv } = variables;
      setLastSaved(new Date());
      setContent(newCsv);
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
      updateItineraryCsv.mutate({
        tripId: params.id,
        newCsv: sheetContent,
      });
    }, DEBOUNCE_MS) as ReturnType<typeof debounce>,
    [params.id, session, updateItineraryCsv, setSaving],
  );

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
      width: columnWidths["rowNumber"] || 50,
      renderCell: ({ rowIdx }: { rowIdx: number }) => rowIdx + 1,
      cellClass: "border-t border-r dark:bg-zinc-950 dark:text-zinc-50",
      headerCellClass: "border-t border-r dark:bg-zinc-900 dark:text-zinc-50",
    };

    const dataColumns = Array.from({ length: MIN_COLS }, (_, i) => ({
      key: i.toString(),
      name: String.fromCharCode(65 + i),
      renderEditCell: textEditor,
      width: columnWidths[i.toString()] || 120,
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
  }, [columnWidths]);

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

    if (version !== currentVersion) {
      toast.error("First restore this version to make changes");
      return;
    }

    setRows(newRows);

    const updatedData = newRows.map((row) => {
      return columns.slice(1).map((col) => row[col.key] ?? "");
    });

    const newCsvContent = unparse(updatedData);

    setSaving(true);
    debouncedUpdateSheet(newCsvContent);

    return () => {
      debouncedUpdateSheet.cancel();
    };
  };

  useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      const csvData = data.find(
        (item): item is { type: string; content: string; version: number } =>
          item !== null &&
          typeof item === "object" &&
          "type" in item &&
          item.type === "csv",
      );
      if (csvData) {
        setContent(csvData.content);
        setLastSaved(new Date());
        setVersion(csvData.version);
        setCurrentVersion(csvData.version);
        setTripState("ITINERARY_CREATED");
      }
    }
  }, [data, setTripState]);

  const handleColumnResize = useCallback(
    (column: { key: string }, width: number) => {
      const newColumnWidths = {
        ...columnWidths,
        [column.key]: width,
      };
      setColumnWidths(newColumnWidths);

      if (typeof window !== "undefined") {
        localStorage.setItem(localStorageKey, JSON.stringify(newColumnWidths));
      }
    },
    [columnWidths, localStorageKey],
  );

  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden border-l border-zinc-200 dark:border-zinc-700">
      {mounted && (
        <>
          <SheetNav
            name={name}
            isOwner={isOwner}
            lastSaved={lastSaved}
            saving={saving}
            isDataLoading={dataLoading || tripState === "CREATING_ITINERARY"}
            csvContent={content ?? ""}
            version={version ?? 1}
            currentVersion={currentVersion ?? 1}
            handlePrevVersion={handlePrevVersion}
            handleNextVersion={handleNextVersion}
          />
          <div className="relative flex-1 overflow-auto">
            {dataLoading ? (
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
                onColumnResize={handleColumnResize}
              />
            )}
            {version !== currentVersion && (
              <VersionBanner
                session={session}
                version={currentVersion}
                goToLatestVersion={() => setCurrentVersion(version)}
                setVersion={setVersion}
                setCurrentVersion={setCurrentVersion}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
