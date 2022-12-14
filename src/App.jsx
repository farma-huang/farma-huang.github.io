import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import MardownContent from '../static/202212141400/markdown.md'

function App() {
  console.log(MardownContent)

  return (
    <MardownContent />
  )
}

export default App