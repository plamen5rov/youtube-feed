import { useState, useEffect } from 'react'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'
import Header from './components/Header'
import SearchPanel from './components/SearchPanel'
import VideoGrid from './components/VideoGrid'
import ExportButtons from './components/ExportButtons'
import html2pdf from 'html2pdf.js'
import './App.css'

const CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID
const API_BASE = 'https://www.googleapis.com/youtube/v3'
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly'

function AppContent() {
  const [accessToken, setAccessToken] = useState(null)
  const [subscriptions, setSubscriptions] = useState(new Set())
  const [videoResults, setVideoResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const storedToken = sessionStorage.getItem('yt_access_token')
    if (storedToken) {
      setAccessToken(storedToken)
      setIsAuthenticated(true)
      loadSubscriptions(storedToken)
    }
  }, [])

  const loadSubscriptions = async (token) => {
    setStatusMessage('Loading subscriptions...')
    let pageToken = null
    let subs = new Set()
    let count = 0

    do {
      try {
        const url = new URL(`${API_BASE}/subscriptions`)
        url.searchParams.set('mine', 'true')
        url.searchParams.set('part', 'snippet')
        url.searchParams.set('maxResults', '50')
        if (pageToken) url.searchParams.set('pageToken', pageToken)

        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })

        if (!response.ok) {
          if (response.status === 401) {
            handleLogout()
            return
          }
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.items) {
          data.items.forEach(item => {
            if (item.snippet?.resourceId?.channelId) {
              subs.add(item.snippet.resourceId.channelId)
              count++
            }
          })
        }

        pageToken = data.nextPageToken
        setStatusMessage(`Loading subscriptions... ${count} loaded`)
      } catch (error) {
        console.error('Error loading subscriptions:', error)
        setStatusMessage('Error loading subscriptions')
        return
      }
    } while (pageToken)

    setSubscriptions(subs)
    setStatusMessage(`${subs.size} subscription channels loaded`)
  }

  const handleLogin = useGoogleLogin({
    client_id: CLIENT_ID,
    scope: SCOPES,
    onSuccess: (response) => {
      const token = response.access_token
      setAccessToken(token)
      setIsAuthenticated(true)
      sessionStorage.setItem('yt_access_token', token)
      loadSubscriptions(token)
    },
    onError: () => {
      setStatusMessage('Authentication failed')
    }
  })

  const handleLogout = () => {
    setAccessToken(null)
    setSubscriptions(new Set())
    setVideoResults([])
    setIsAuthenticated(false)
    sessionStorage.removeItem('yt_access_token')
  }

  const handleSearch = async ({ topic, fromDate, toDate }) => {
    if (!topic.trim()) return

    sessionStorage.setItem('lastTopic', topic)
    setIsLoading(true)
    setStatusMessage('Searching videos...')
    setVideoResults([])

    let allResults = []
    let pageToken = null
    const maxResults = 50
    const maxTotal = 200
    let totalFetched = 0

    const from = fromDate ? new Date(fromDate) : new Date('2025-01-01')
    const to = toDate ? new Date(toDate + 'T23:59:59') : new Date()

    try {
      while (totalFetched < maxTotal) {
        const url = new URL(`${API_BASE}/search`)
        url.searchParams.set('part', 'snippet')
        url.searchParams.set('type', 'video')
        url.searchParams.set('q', topic)
        url.searchParams.set('maxResults', maxResults.toString())
        url.searchParams.set('order', 'date')
        url.searchParams.set('publishedAfter', from.toISOString())
        url.searchParams.set('publishedBefore', to.toISOString())
        if (pageToken) url.searchParams.set('pageToken', pageToken)

        const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })

        if (!response.ok) throw new Error(`Search error: ${response.status}`)

        const data = await response.json()
        if (!data.items?.length) break

        const filtered = data.items.filter(item => 
          item.snippet?.channelId && subscriptions.has(item.snippet.channelId)
        )

        allResults = allResults.concat(filtered)
        totalFetched += data.items.length

        pageToken = data.nextPageToken
        if (!pageToken) break

        setStatusMessage(`Found ${allResults.length} videos...`)
      }

      if (allResults.length === 0) {
        setStatusMessage(`No videos found for "${topic}" from your subscriptions`)
        setIsLoading(false)
        return
      }

      const detailedItems = await getVideoDetails(allResults.map(i => i.id.videoId))
      
      const results = detailedItems.map(item => ({
        id: item.id,
        title: item.snippet.title,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        publishedAt: item.snippet.publishedAt,
        duration: item.contentDetails?.duration
      }))

      setVideoResults(results)
      setStatusMessage(`Found ${results.length} videos from your subscriptions`)
    } catch (error) {
      console.error('Search error:', error)
      setStatusMessage('Error searching videos')
    } finally {
      setIsLoading(false)
    }
  }

  const getVideoDetails = async (videoIds) => {
    try {
      const url = new URL(`${API_BASE}/videos`)
      url.searchParams.set('part', 'snippet,contentDetails')
      url.searchParams.set('id', videoIds.join(','))

      const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!response.ok) return []

      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error('Error fetching video details:', error)
      return []
    }
  }

  const handleCopyMarkdown = () => {
    if (videoResults.length === 0) return

    const topic = sessionStorage.getItem('lastTopic') || 'Videos'
    let markdown = `# YouTube Feed: ${topic}\n\n`
    markdown += `Found ${videoResults.length} videos from your subscriptions.\n\n`
    markdown += `| Video | Channel | Date | Description |\n`
    markdown += `|-------|---------|------|-------------|\n`

    videoResults.forEach(video => {
      const title = video.title.replace(/\|/g, '\\|')
      const desc = (video.description || '').substring(0, 50).replace(/\|/g, '\\|')
      const date = new Date(video.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      markdown += `| [${title}](https://youtube.com/watch?v=${video.id}) | ${video.channelTitle} | ${date} | ${desc}... |\n`
    })

    navigator.clipboard.writeText(markdown).then(() => {
      setStatusMessage('Copied to clipboard!')
    }).catch(() => {
      setStatusMessage('Failed to copy')
    })
  }

  const handleExportPDF = () => {
    if (videoResults.length === 0) return

    const topic = sessionStorage.getItem('lastTopic') || 'Videos'
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    
    const pdfContent = document.createElement('div')
    pdfContent.style.padding = '40px'
    pdfContent.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif'
    pdfContent.style.color = '#1a1a1a'
    pdfContent.style.backgroundColor = '#ffffff'
    pdfContent.style.minHeight = '297mm'
    
    let html = `
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #ff0000;">
        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
        <div>
          <h1 style="font-size: 28px; font-weight: 700; margin: 0; color: #1a1a1a; letter-spacing: -0.5px;">YouTube Feed</h1>
          <p style="font-size: 12px; color: #86868b; margin: 4px 0 0;">Generated on ${date}</p>
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, #fff5f5 0%, #fff0f0 100%); padding: 24px; border-radius: 16px; margin-bottom: 32px; border-left: 4px solid #ff0000;">
        <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 8px; color: #1a1a1a;">Topic: ${topic}</h2>
        <p style="font-size: 14px; color: #666; margin: 0;">Found <strong style="color: #ff0000;">${videoResults.length} videos</strong> from your subscriptions</p>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px;">
        <div style="background: #f8f8f8; padding: 16px; border-radius: 12px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #ff0000;">${videoResults.length}</div>
          <div style="font-size: 12px; color: #86868b; text-transform: uppercase; letter-spacing: 1px;">Videos</div>
        </div>
        <div style="background: #f8f8f8; padding: 16px; border-radius: 12px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #ff0000;">${new Set(videoResults.map(v => v.channelTitle)).size}</div>
          <div style="font-size: 12px; color: #86868b; text-transform: uppercase; letter-spacing: 1px;">Channels</div>
        </div>
      </div>
      
      <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 16px; color: #1a1a1a; padding-bottom: 12px; border-bottom: 2px solid #eee;">Video Results</h3>
    `

    videoResults.forEach((video, index) => {
      const title = video.title.length > 60 ? video.title.substring(0, 60) + '...' : video.title
      const duration = formatDuration(video.duration) || '-'
      const videoDate = new Date(video.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      const desc = video.description ? video.description.substring(0, 80).replace(/<[^>]*>/g, '') + '...' : 'No description'
      
      html += `
        <div style="display: flex; gap: 16px; padding: 16px; background: ${index % 2 === 0 ? '#fff' : '#fafafa'}; border-radius: 12px; margin-bottom: 12px; border: 1px solid #eee;">
          <div style="width: 120px; height: 68px; background: #f0f0f0; border-radius: 8px; overflow: hidden; flex-shrink: 0;">
            <img src="${video.thumbnail}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <div style="flex: 1; min-width: 0;">
            <a href="https://youtube.com/watch?v=${video.id}" style="font-size: 14px; font-weight: 600; color: #1a1a1a; text-decoration: none; display: block; margin-bottom: 6px; line-height: 1.3;">${title}</a>
            <div style="font-size: 12px; color: #ff0000; font-weight: 500; margin-bottom: 4px;">${video.channelTitle}</div>
            <div style="font-size: 11px; color: #888;">
              <span style="margin-right: 12px;">📅 ${videoDate}</span>
              <span>⏱ ${duration}</span>
            </div>
          </div>
        </div>
      `
    })

    html += `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="font-size: 11px; color: #aaa; margin: 0;">Generated by YouTube Feed • youtube-feed.github.io</p>
      </div>
    `
    
    pdfContent.innerHTML = html

    const opt = {
      margin: [5, 5, 5, 5],
      filename: `youtube-feed-${topic.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    setStatusMessage('Generating PDF...')
    html2pdf().set(opt).from(pdfContent).save().then(() => {
      setStatusMessage('PDF exported!')
    })
  }

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

  return (
    <div className="app">
      <Header 
        isAuthenticated={isAuthenticated} 
        onLogout={handleLogout}
        onLogin={handleLogin}
      />
      
      {isAuthenticated && (
        <>
          <SearchPanel 
            onSearch={handleSearch}
            isLoading={isLoading}
            statusMessage={statusMessage}
          />
          
          {videoResults.length > 0 && (
            <ExportButtons 
              onCopyMarkdown={handleCopyMarkdown}
              onExportPDF={handleExportPDF}
              count={videoResults.length}
            />
          )}
          
          <VideoGrid videos={videoResults} />
        </>
      )}
      
      {!isAuthenticated && (
        <div className="auth-section">
          <div className="auth-content">
            <div className="auth-icon">
              <svg viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <h2>YouTube Feed</h2>
            <p>Find videos in your feed on any topic. Connect your account to get started.</p>
            <button className="google-btn" onClick={handleLogin}>
              <svg viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <AppContent />
    </GoogleOAuthProvider>
  )
}

export default App
