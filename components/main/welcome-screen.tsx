"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChefHat, Send } from "lucide-react"

interface WelcomeScreenProps {
  onChatSubmit: (message: string) => void
}

export function WelcomeScreen({ onChatSubmit }: WelcomeScreenProps) {
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onChatSubmit(message)
      setMessage("")
    }
  }


  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-8">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <ChefHat className="w-16 h-16 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4">요리 전문 AI와 대화를 시작해보세요!</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          장바구니에 자동으로 담아줌
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-lg mb-8">
        <div className="relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="질문 ㅇㅇㅇㅇㅇ"
            className="pr-12 py-6 text-lg"
          />
          <Button type="submit" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

    </div>
  )
}
