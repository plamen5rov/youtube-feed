import { formatDuration, formatDate } from '../utils'

function VideoCard({ video }) {
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
