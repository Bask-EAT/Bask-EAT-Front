"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquarePlus, ChefHat, Menu, Bookmark, Moon, Sun, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface ChatSession {
  id: string
  title: string
  messages: any[]
  lastUpdated: number
}

interface LeftSidebarProps {
  collapsed: boolean
  onToggle: () => void
  chatHistory: ChatSession[]
  currentChatId: string | null
  onNewChat: () => void
  onChatSelect: (chatId: string) => void
}

export function LeftSidebar({
  collapsed,
  onToggle,
}: LeftSidebarProps) {


  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full bg-background border-r border-border transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-lg text-foreground">Bask:EAT</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={onToggle} className="p-2">
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <Button className="w-full justify-start gap-2 bg-transparent" variant="outline">
            <MessageSquarePlus className="w-4 h-4" />
            {!collapsed && "New Chat"}
          </Button>
        </div>

        
        {/* Chat History */}
        <div className="flex-1 px-4">
          {!collapsed && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">채팅 기록</h3>
              <ScrollArea className="h-48">
                <div className="flex flex-col gap-2">
                  {/* Example chat items */}
                  <Button variant="ghost" className="justify-start text-left h-auto py-2 px-3">
                    <span className="text-sm">채팅 기록 1</span>
                  </Button>
                  <Button variant="ghost" className="justify-start text-left h-auto py-2 px-3">
                    <span className="text-sm">채팅 기록 2</span>
                  </Button>
                </div>
              </ScrollArea>
            </div>
          )}


        {/* Bookmarks */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Recipe Bookmarks</h3>
              <ScrollArea className="h-32">
                <Button
                      variant="ghost"
                      className="w-full justify-start mb-1 text-left truncate"
                      size="sm"
                    >
                      <Bookmark className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">북마크 1</span>
                    </Button>
              </ScrollArea>
            </div>


            
      </div>
    </div>
    </div>
  )
}
