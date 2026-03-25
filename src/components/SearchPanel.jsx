import { useState } from 'react'
import DatePicker from './DatePicker'

function SearchPanel({ onSearch, isLoading, statusMessage, searchHistory }) {
  const today = new Date()
  const defaultFrom = new Date(today)
  defaultFrom.setDate(today.getDate() - 60)
  
  const [topic, setTopic] = useState('')
  const [fromDate, setFromDate] = useState(defaultFrom.toISOString().split('T')[0])
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0])
  const [scope, setScope] = useState('all')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (topic.trim() && !isLoading) {
      onSearch({ topic, fromDate, toDate, scope })
    }
  }

  const handleHistoryClick = (entry) => {
    setTopic(entry.topic)
    setFromDate(entry.fromDate)
    setToDate(entry.toDate)
    setScope(entry.scope)
    if (!isLoading) {
      onSearch(entry)
    }
  }

  return (
    <div className="search-panel">
      <form onSubmit={handleSubmit}>
        <div className="search-input-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search your feed..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="date-filters">
          <DatePicker
            label="From"
            value={fromDate}
            onChange={setFromDate}
            disabled={isLoading}
          />
          <DatePicker
            label="To"
            value={toDate}
            onChange={setToDate}
            disabled={isLoading}
          />
          <div className="date-group" style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading || !topic.trim()}
            >
              {isLoading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                  Searching...
                </>
              ) : (
                'Generate Report'
              )}
            </button>
          </div>
        </div>

        <div className="scope-toggle">
          <button
            type="button"
            className={`scope-btn${scope === 'all' ? ' active' : ''}`}
            onClick={() => setScope('all')}
            disabled={isLoading}
          >
            All YouTube
          </button>
          <button
            type="button"
            className={`scope-btn${scope === 'subscriptions' ? ' active' : ''}`}
            onClick={() => setScope('subscriptions')}
            disabled={isLoading}
          >
            My Subscriptions
          </button>
        </div>
      </form>

      {searchHistory && searchHistory.length > 0 && (
        <div className="search-history">
          <span className="search-history-label">Recent:</span>
          {searchHistory.slice(0, 5).map((entry, i) => (
            <button
              key={i}
              className="history-chip"
              onClick={() => handleHistoryClick(entry)}
              disabled={isLoading}
            >
              {entry.topic}
            </button>
          ))}
        </div>
      )}

      {statusMessage && (
        <div className="status-bar">
          <span className="status-dot"></span>
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  )
}

export default SearchPanel
