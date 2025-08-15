"use client"

import type React from "react"

import { useState } from "react"
import { LeftSidebar } from "./left-sidebar"
import { RightChatSidebar } from "./right-chat-sidebar"
import { cn } from "@/lib/utils"
import { is } from "date-fns/locale"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: number
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  lastUpdated: number
}

interface MainLayoutProps {
  children: React.ReactNode
  currentView: "welcome" | "recipe" | "cart"
  messages: ChatMessage[]
  chatHistory: ChatSession[]
  isLoading: boolean
  rightSidebarCollapsed: boolean
  onChatSubmit: (message: string) => void
  onViewChange: (view: "welcome" | "recipe" | "cart") => void
  onRightSidebarToggle: () => void
}

export function MainLayout({
  children,
  currentView,
  chatHistory,
  messages,
  rightSidebarCollapsed,
  isLoading,
  onChatSubmit,
  onViewChange,
  onRightSidebarToggle,

}: MainLayoutProps) {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar */}
      <LeftSidebar
        collapsed={leftSidebarCollapsed}
        onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className={cn("flex-1 flex transition-all duration-300", leftSidebarCollapsed ? "ml-16" : "ml-64")}>
        <div className={cn("flex-1 transition-all duration-300", rightSidebarCollapsed ? "mr-12" : "mr-80")}>
          {children}
        </div>

        {/* Right Chat Sidebar */}
        <RightChatSidebar
          collapsed={rightSidebarCollapsed}
          onToggle={onRightSidebarToggle}
          currentView={currentView}
          messages={messages}
          chatHistory={chatHistory}
          onChatSubmit={onChatSubmit}
          onViewChange={onViewChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
