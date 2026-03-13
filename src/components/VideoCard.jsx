function VideoCard({ video }) {
  const formatDuration = (isoDuration) => {
    if (!isoDuration) return null
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return null
    const hours = parseInt(match[1]) || 0
    const minutes = parseInt(match[2]) || 0
    const seconds = parseInt(match[3]) || 0
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const duration = formatDuration(video.duration)
  const date = formatDate(video.publishedAt)

  return (
    <div className="video-card">
      <a href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="thumbnail-container">
          <img 
            className="thumbnail" 
            src={video.thumbnail} 
            alt={video.title} 
            loading="lazy"
          />
          {duration && <span className="duration">{duration}</span>}
        </div>
        <div className="card-content">
          <h3 className="video-title">{video.title}</h3>
          <p className="channel-name">{video.channelTitle}</p>
          <p className="video-description">{video.description || 'No description available'}</p>
          <p className="video-date">{date}</p>
        </div>
      </a>
    </div>
  )
}

export default VideoCard
