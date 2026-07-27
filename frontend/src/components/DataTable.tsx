import { Fragment, useState } from "react"
import {
  type ColumnDef,
  type Row,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  emptyMessage?: string
  emptySubMessage?: string

  // Pagination
  pageCount?: number
  pageIndex?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  onPageSizeChange?: (pageSize: number) => void

  // Search (Optional)
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  totalItems?: number
  extraFilters?: React.ReactNode

  // Collapsible rows
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode
  getRowCanExpand?: (row: Row<TData>) => boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  emptyMessage = "Data tidak ditemukan",
  emptySubMessage,
  pageCount = 1,
  pageIndex = 1,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  searchPlaceholder = "Cari...",
  searchValue,
  onSearchChange,
  totalItems,
  extraFilters,
  renderSubComponent,
  getRowCanExpand,
}: DataTableProps<TData, TValue>) {
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand,
  })

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      {(onSearchChange !== undefined || totalItems !== undefined || extraFilters) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            {onSearchChange && (
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  className="pl-9"
                  value={searchValue || ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            )}
            {extraFilters}
          </div>
          {totalItems !== undefined && (
            <p className="text-sm text-muted-foreground ml-auto hidden sm:block">
              {totalItems} total data
            </p>
          )}
        </div>
      )}

      <div className="border rounded-none bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta: any = header.column.columnDef.meta
                  return (
                    <TableHead key={header.id} className={`h-10 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${meta?.className ?? ""}`}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && !data.length ? (
              // Loading state only when no previous data exists
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col, j) => {
                    const meta: any = col.meta
                    return (
                      <TableCell key={j} className={`px-4 py-2.5 ${meta?.className ?? ""}`}>
                        <div className="h-4 bg-muted/50 rounded-none animate-pulse w-full max-w-[120px]" />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              <>
                {table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className={`transition-colors hover:bg-muted/30 ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta: any = cell.column.columnDef.meta
                        return (
                          <TableCell key={cell.id} className={`px-4 py-1 ${meta?.className ?? ""}`}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                    {row.getIsExpanded() && renderSubComponent && (
                      <TableRow className="bg-slate-50/50">
                        <TableCell colSpan={row.getVisibleCells().length} className="p-0 border-b">
                          {renderSubComponent({ row })}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <p className="text-sm font-medium">{emptyMessage}</p>
                    {emptySubMessage && <p className="text-xs mt-1">{emptySubMessage}</p>}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modern Professional Pagination */}
      {(pageCount > 1 || (data && data.length > 10)) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 pt-2 pb-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground font-medium">
              Halaman <span className="text-foreground">{pageIndex}</span> dari {pageCount}
            </div>
            {onPageSizeChange && (
              <div className="flex items-center gap-2 border-l pl-4">
                <p className="text-sm font-medium text-muted-foreground hidden sm:block">Tampilkan</p>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    onPageSizeChange(Number(e.target.value))
                    if (onPageChange) onPageChange(1)
                  }}
                  className="h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                >
                  {[10, 20, 30, 40, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => onPageChange?.(1)}
              disabled={pageIndex === 1 || isLoading}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => onPageChange?.(pageIndex - 1)}
              disabled={pageIndex === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => onPageChange?.(pageIndex + 1)}
              disabled={pageIndex === pageCount || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => onPageChange?.(pageCount)}
              disabled={pageIndex === pageCount || isLoading}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
