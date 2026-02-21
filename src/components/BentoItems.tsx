import React, { useEffect, useState } from 'react'

import { BentoItem } from './BentoGrid'
// Icons would ideally be from a library like lucide-react, but we can use simple SVGs or text for now to avoid extra deps if not needed.
// Using text/emoji for simplicity in this iteration, or SVG paths.

export const ProfileCard: React.FC = () => (
  <BentoItem colSpan={2} rowSpan={2} className="flex flex-col justify-between">
    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
      <div className="shrink-0 w-32 h-32 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700">
        <img
          src="/assets/images/avatar_3.jpg"
          alt="Farma Huang"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100">Farma Huang</h2>
          <p className="text-zinc-400 font-medium text-lg">
            Frontend Lead & Full Stack Engineer
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
            有經驗的軟體工程師，超過十年的軟體開發經驗，目前專注在 Web
            領域。擁有許多專案經歷，包含帶領前端團隊經驗，團隊溝通配合良好，能夠獨立從零到有建構專案架構與內容，也能與其他協作者分工良好。替團隊帶來正向價值，持續學習新的技術。
          </p>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
            Over 10 years of experience in software development. Specializing in
            React, TypeScript, and DX. Leading frontend teams to build scalable
            applications.
          </p>
        </div>
      </div>
    </div>
  </BentoItem>
)

export const TechStackCard: React.FC = () => {
  const stack = [
    'React',
    'TypeScript',
    'Astro',
    'Electron',
    'Node.js',
    'Tailwind',
    'Next.js',
    'Docker',
  ]

  return (
    <BentoItem colSpan={1} rowSpan={1} className="flex flex-col gap-3">
      <h3 className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
        Stack
      </h3>
      <div className="flex flex-wrap gap-2">
        {stack.map((tech) => (
          <span
            key={tech}
            className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded border border-zinc-700 font-mono">
            {tech}
          </span>
        ))}
      </div>
    </BentoItem>
  )
}

export const SocialCard: React.FC = () => (
  <BentoItem colSpan={1} rowSpan={1} className="flex flex-col gap-3">
    <h3 className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
      Connect
    </h3>
    <div className="flex flex-col gap-2">
      <a
        href="mailto:farmahuang@gmail.com"
        className="flex items-center gap-2 text-zinc-300 hover:text-blue-400 transition-colors text-sm">
        <span>📧</span> Email
      </a>
      <a
        href="https://github.com/farma-huang"
        target="_blank"
        className="flex items-center gap-2 text-zinc-300 hover:text-blue-400 transition-colors text-sm"
        rel="noopener">
        <span>🐙</span> GitHub
      </a>
    </div>
  </BentoItem>
)

export const LocationCard: React.FC = () => {
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Taipei',
        }),
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <BentoItem
      colSpan={1}
      className="flex flex-col justify-center items-center">
      <h3 className="text-zinc-500 text-xs uppercase tracking-wider font-semibold mb-1">
        Taipei, Taiwan
      </h3>
      <p className="text-2xl font-mono font-bold text-zinc-100">{time}</p>
      <div className="w-2 h-2 rounded-full bg-green-500 absolute top-4 right-4 animate-pulse"></div>
    </BentoItem>
  )
}

export const ProjectPreviewCard: React.FC = () => (
  <BentoItem colSpan={1} className="group relative min-h-[160px]">
    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent z-10" />
    <h3 className="relative z-20 text-zinc-100 font-bold text-lg mt-auto">
      PentiumAgent
    </h3>
    <p className="relative z-20 text-zinc-400 text-xs mt-1">
      AI Automated Operations
    </p>
    <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
        View
      </span>
    </div>
  </BentoItem>
)
