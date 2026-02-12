import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type ColumnKey<T> = Extract<keyof T, string> | string;

interface Column<T> {
  key: ColumnKey<T>;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  stackedHeaders?: boolean;
  forceDir?: "ltr" | "rtl";
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  emptyMessage = "No data available",
  onRowClick,
  stackedHeaders = false,
  forceDir,
}: DataTableProps<T>) {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const tableDir = forceDir ?? (isRTL ? "rtl" : "ltr");

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border border-border"
      dir={tableDir}
    >
      <table
        className="w-full"
        style={{ tableLayout: "fixed", borderCollapse: "collapse" }}
      >
        {!stackedHeaders && (
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => {
                // Extract width from className
                const headerClass = col.headerClassName ?? col.className ?? "";
                const minWidthMatch = headerClass.match(/min-w-\[(\d+)px\]/);
                const widthMatch = headerClass.match(/w-\[(\d+)px\]/);
                const width = widthMatch?.[1] || minWidthMatch?.[1];

                return (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-start font-semibold text-sm text-muted-foreground",
                      headerClass,
                    )}
                    style={
                      width
                        ? {
                            width: `${width}px`,
                            minWidth: `${width}px`,
                            maxWidth: `${width}px`,
                          }
                        : undefined
                    }
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
        )}
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={cn(
                "border-b border-border transition-colors",
                onRowClick && "cursor-pointer hover:bg-muted/30",
              )}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(item);
                      }
                    }
                  : undefined
              }
            >
              {columns.map((col) => {
                // Extract width from className (same as header)
                const cellClass = col.cellClassName ?? col.className ?? "";
                const minWidthMatch = cellClass.match(/min-w-\[(\d+)px\]/);
                const widthMatch = cellClass.match(/w-\[(\d+)px\]/);
                const width = widthMatch?.[1] || minWidthMatch?.[1];

                return (
                  <td
                    key={col.key}
                    className={cn("px-4 py-4", cellClass)}
                    style={
                      width
                        ? {
                            width: `${width}px`,
                            minWidth: `${width}px`,
                            maxWidth: `${width}px`,
                          }
                        : undefined
                    }
                  >
                    {stackedHeaders ? (
                      <div className="space-y-1">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {col.header}
                        </div>
                        <div>
                          {col.render
                            ? col.render(item)
                            : ((item as Record<string, unknown>)[
                                String(col.key)
                              ] as ReactNode)}
                        </div>
                      </div>
                    ) : col.render ? (
                      col.render(item)
                    ) : (
                      ((item as Record<string, unknown>)[
                        String(col.key)
                      ] as ReactNode)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
