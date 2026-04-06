import { useState, useMemo } from 'react';
import { Search, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import './DataTable.css';

export default function DataTable({
  columns,
  data,
  searchPlaceholder = 'Cari...',
  toolbarActions,
  pageSize = 10,
  emptyIcon = <Inbox size={32} color="var(--color-text-muted)" />,
  emptyText = 'Belum ada data',
}) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered data
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.accessor ? row[col.accessor] : '';
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const paginatedData = filtered.slice(startIdx, startIdx + pageSize);

  // Reset page on search
  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="data-table-wrapper">
      <div className="data-table-toolbar">
        <div className="data-table-search">
          <span className="data-table-search-icon"><Search size={16} /></span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        {toolbarActions && <div className="data-table-actions">{toolbarActions}</div>}
      </div>

      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>No</th>
              {columns.map((col) => (
                <th key={col.header} style={col.width ? { width: col.width } : {}}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1}>
                  <div className="table-empty">
                    <div className="table-empty-icon">{emptyIcon}</div>
                    <div className="table-empty-text">{emptyText}</div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td>{startIdx + idx + 1}</td>
                  {columns.map((col) => (
                    <td key={col.header}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="data-table-footer">
          <div className="data-table-info">
            Menampilkan {startIdx + 1}–{Math.min(startIdx + pageSize, filtered.length)} dari {filtered.length} data
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
