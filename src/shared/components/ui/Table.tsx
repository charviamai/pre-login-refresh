import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
  // Mobile-specific options
  hideOnMobile?: boolean;  // Hide this column on mobile cards
  isPrimaryOnMobile?: boolean; // Show as main title on mobile card
  hideMobileLabel?: boolean; // Hide the blue label on mobile card (keep desktop header)
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  // Find the primary column for mobile card title (first column with render or 'name')
  const primaryColumn = columns.find(c => c.isPrimaryOnMobile) || columns[0];

  // Columns to show in mobile cards (exclude primary and actions)
  const mobileColumns = columns.filter(c =>
    c.key !== primaryColumn.key &&
    c.key !== 'actions' &&
    !c.hideOnMobile
  );

  // Actions column for mobile
  const actionsColumn = columns.find(c => c.key === 'actions');

  return (
    <>
      {/* Desktop Table - hidden on mobile */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-3 lg:px-5 py-3.5 text-left text-[10px] lg:text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap"
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`${onRowClick ? 'hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer' : ''} ${index % 2 === 1 ? 'bg-gray-50/50 dark:bg-slate-800/50' : ''} transition-colors`}
              >
                {columns.map((column) => {
                  const isEmailColumn = column.key === 'email';
                  return (
                    <td
                      key={column.key}
                      className={`px-3 lg:px-5 py-3.5 text-xs lg:text-sm text-slate-700 dark:text-slate-200 ${isEmailColumn ? 'break-all' : ''}`}
                    >
                      {column.render
                        ? column.render(item)
                        : String((item as any)[column.key] ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards - hidden on desktop */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow ${onRowClick ? 'cursor-pointer active:bg-gray-50 dark:active:bg-slate-700' : ''}`}
          >
            {/* Card Header: Primary content + Actions with slate background */}
            <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-slate-700">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm min-[350px]:text-base truncate">
                  {primaryColumn.render
                    ? primaryColumn.render(item)
                    : String((item as any)[primaryColumn.key] ?? '')}
                </div>
              </div>
              {actionsColumn && (
                <div className="flex-shrink-0 flex items-center gap-1 text-white">
                  {actionsColumn.render?.(item)}
                </div>
              )}
            </div>

            {/* Card Body: Layout depends on number of columns */}
            <div className="p-4 space-y-4">
              {/* For 3 or fewer columns: Row 1 = col0 | col1, Row 2 = col2 full width */}
              {mobileColumns.length <= 3 ? (
                <>
                  {/* Row 1: col0 | col1 (side by side) */}
                  <div className="flex gap-8">
                    {mobileColumns[0] && (
                      <div className="flex-1">
                        {!mobileColumns[0].hideMobileLabel && (
                          <span className="text-blue-600 text-[11px] min-[350px]:text-xs font-medium block mb-1">
                            {mobileColumns[0].header}
                          </span>
                        )}
                        <div className="text-slate-800 dark:text-slate-200 text-sm min-[350px]:text-base font-medium break-all leading-tight">
                          {mobileColumns[0].render
                            ? mobileColumns[0].render(item)
                            : String((item as any)[mobileColumns[0].key] ?? '-')}
                        </div>
                      </div>
                    )}
                    {mobileColumns[1] && (
                      <div className="flex-1">
                        {!mobileColumns[1].hideMobileLabel && (
                          <span className="text-blue-600 text-[11px] min-[350px]:text-xs font-medium block mb-1">
                            {mobileColumns[1].header}
                          </span>
                        )}
                        <div className="text-slate-800 dark:text-slate-200 text-sm min-[350px]:text-base font-medium break-all leading-tight">
                          {mobileColumns[1].render
                            ? mobileColumns[1].render(item)
                            : String((item as any)[mobileColumns[1].key] ?? '-')}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Row 2: col2 full width */}
                  {mobileColumns[2] && (
                    <div>
                      {!mobileColumns[2].hideMobileLabel && (
                        <span className="text-blue-600 text-[11px] min-[350px]:text-xs font-medium block mb-1">
                          {mobileColumns[2].header}
                        </span>
                      )}
                      <div className="text-slate-800 dark:text-slate-200 text-sm min-[350px]:text-base font-medium break-all leading-tight">
                        {mobileColumns[2].render
                          ? mobileColumns[2].render(item)
                          : String((item as any)[mobileColumns[2].key] ?? '-')}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* For 4+ columns: Email full width, then paired rows */
                <>
                  {/* Row 1: Email (full width) */}
                  {mobileColumns[0] && (
                    <div>
                      <span className="text-blue-600 text-[11px] min-[350px]:text-xs font-medium block mb-1">
                        {mobileColumns[0].header}
                      </span>
                      <div className="text-slate-800 dark:text-slate-200 text-sm min-[350px]:text-base font-medium break-all leading-tight">
                        {mobileColumns[0].render
                          ? mobileColumns[0].render(item)
                          : String((item as any)[mobileColumns[0].key] ?? '-')}
                      </div>
                    </div>
                  )}

                  {/* Row 2: col1 | col3 */}
                  <div className="flex gap-8">
                    {mobileColumns[1] && (
                      <div className="flex-1">
                        <span className="text-blue-600 text-[11px] min-[350px]:text-xs font-medium block mb-1">
                          {mobileColumns[1].header}
                        </span>
                        <div className="text-slate-800 dark:text-slate-200 text-sm min-[350px]:text-base font-medium break-all leading-tight">
                          {mobileColumns[1].render
                            ? mobileColumns[1].render(item)
                            : String((item as any)[mobileColumns[1].key] ?? '-')}
                        </div>
                      </div>
                    )}
                    {mobileColumns[3] && (
                      <div className="flex-1">
                        <span className="text-blue-600 text-[11px] min-[350px]:text-xs font-medium block mb-1">
                          {mobileColumns[3].header}
                        </span>
                        <div className="text-slate-800 dark:text-slate-200 text-sm min-[350px]:text-base font-medium break-all leading-tight">
                          {mobileColumns[3].render
                            ? mobileColumns[3].render(item)
                            : String((item as any)[mobileColumns[3].key] ?? '-')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Row 3: col2 | col4 */}
                  <div className="flex gap-8">
                    {mobileColumns[2] && (
                      <div className="flex-1">
                        <span className="text-blue-600 text-[11px] min-[350px]:text-xs font-medium block mb-1">
                          {mobileColumns[2].header}
                        </span>
                        <div className="text-slate-800 dark:text-slate-200 text-sm min-[350px]:text-base font-medium break-all leading-tight">
                          {mobileColumns[2].render
                            ? mobileColumns[2].render(item)
                            : String((item as any)[mobileColumns[2].key] ?? '-')}
                        </div>
                      </div>
                    )}
                    {mobileColumns[4] && (
                      <div className="flex-1">
                        <span className="text-blue-600 text-[11px] min-[350px]:text-xs font-medium block mb-1">
                          {mobileColumns[4].header}
                        </span>
                        <div className="text-slate-800 dark:text-slate-200 text-sm min-[350px]:text-base font-medium break-all leading-tight">
                          {mobileColumns[4].render
                            ? mobileColumns[4].render(item)
                            : String((item as any)[mobileColumns[4].key] ?? '-')}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
