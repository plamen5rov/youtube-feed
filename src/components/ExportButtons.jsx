import { formatDate } from '../utils'

function ExportButtons({
  onCopyMarkdown,
  onExportPDF,
  count,
  totalCount,
  lastSearch,
  sortBy,
  sortOrder,
  onSortChange,
}) {
  const sortIcon = sortOrder === 'desc' ? '↓' : '↑'
  const showCount = count !== totalCount

  return (
    <>
      {lastSearch && (
        <div className="search-summary">
          <span className="search-summary-topic">&ldquo;{lastSearch.topic}&rdquo;</span>
          {lastSearch.fromDate && (
            <span className="search-summary-date">
              {formatDate(lastSearch.fromDate)} &ndash; {formatDate(lastSearch.toDate)}
            </span>
          )}
          <span className="search-summary-scope">
            {lastSearch.scope === 'subscriptions' ? 'Subscriptions' : 'All YouTube'}
          </span>
        </div>
      )}

      <div className="export-bar">
        <div className="results-bar-left">
          <span className="results-count">
            {showCount ? `${count} of ${totalCount}` : count} videos
          </span>
          <div className="sort-controls">
            <button
              className={`sort-btn${sortBy === 'date' ? ' active' : ''}`}
              onClick={() => onSortChange('date')}
            >
              Date {sortBy === 'date' && sortIcon}
            </button>
            <button
              className={`sort-btn${sortBy === 'channel' ? ' active' : ''}`}
              onClick={() => onSortChange('channel')}
            >
              Channel {sortBy === 'channel' && sortIcon}
            </button>
            <button
              className={`sort-btn${sortBy === 'duration' ? ' active' : ''}`}
              onClick={() => onSortChange('duration')}
            >
              Duration {sortBy === 'duration' && sortIcon}
            </button>
          </div>
        </div>
        <div className="export-buttons">
          <button className="export-btn" onClick={onCopyMarkdown}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            Copy Markdown
          </button>
          <button className="export-btn" onClick={onExportPDF}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
            </svg>
            Export PDF
          </button>
        </div>
      </div>
    </>
  )
}

export default ExportButtons
