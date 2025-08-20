"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, ChevronRight, ChevronLeft, ShoppingCart, ChefHat, Loader2, Search, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessage {
  type: "user" | "bot"
  content: string
  recipes?: Recipe[]
  timestamp: Date
  chatType?: 'chat' | 'cart'
}

interface RightChatSidebarProps {
  collapsed: boolean
  onToggle: () => void
  currentView: "welcome" | "recipe" | "cart"
  messages: ChatMessage[]
  chatHistory: []
  isLoading: boolean
  onChatSubmit: (message: string) => void
  onViewChange: (view: "welcome" | "recipe" | "cart") => void
}

interface Ingredient {
  item: string
  amount: string
  unit: string
}

interface Product {
  product_name: string
  price: number
  image_url: string
  product_address: string
}

interface Recipe {
  source: 'text' | 'video' | 'ingredient_search'
  food_name: string
  ingredients: (Ingredient | Product)[]
  recipe: string[]
}







export function RightChatSidebar({
  collapsed,
  onToggle,
  currentView,
  messages,
  chatHistory,
  isLoading,
  onChatSubmit,
  onViewChange,
}: RightChatSidebarProps) {
  const [message, setMessage] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onChatSubmit(message)
      setMessage("")
    }
    }
  

// --- 렌더링 함수 분리 ---
  // 1. 요리 레시피 렌더링 컴포넌트
  const renderCookingRecipe = (recipe: Recipe, recipeIndex: number) => (
    <div key={recipeIndex} className="border-t border-orange-200/50 pt-3 space-y-3">
      <h4 className="font-bold text-orange-800 flex items-center text-lg">
        {recipe.food_name}
      </h4>
      <div>
        <h5 className="font-semibold text-md mb-2 text-orange-700 flex items-center">
          <ShoppingCart className="w-4 h-4 mr-2" />재료 목록
        </h5>
        <div className="space-y-1 text-sm">
          {recipe.ingredients.map((ingredient, i) => (
            <div key={i} className="bg-orange-50/50 p-2 rounded-md border border-orange-100/80">
              {`${(ingredient as Ingredient).item} ${(ingredient as Ingredient).amount}${(ingredient as Ingredient).unit ? ' ' + (ingredient as Ingredient).unit : ''}`.trim()}
            </div>
          ))}
        </div>
      </div>
      {recipe.recipe && recipe.recipe.length > 0 && (
        <div>
          <h5 className="font-semibold text-md mb-2 text-orange-700 flex items-center">
            <span>조리법</span>
          </h5>
          <div className="space-y-2 text-sm">
            {recipe.recipe.map((step, i) => (
              <div key={i} className="p-2 rounded-md border border-red-100/80 bg-red-50/50 leading-relaxed">
                <span className="font-bold text-orange-700">{i + 1}. </span>
                {step.replace(/^\d+\.\s*/, '')}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // 2. 상품 검색 결과 렌더링 컴포넌트
  const renderProductResults = (recipe: Recipe, recipeIndex: number) => (
    <div key={recipeIndex} className="border-t border-blue-200/50 pt-3 space-y-3">
      <h4 className="font-bold text-blue-800 flex items-center text-lg">
        <Search className="w-5 h-5 mr-2 flex-shrink-0" />
        '{recipe.food_name}' 검색 결과
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recipe.ingredients.map((product, i) => (
          <a key={i} href={(product as Product).product_address} target="_blank" rel="noopener noreferrer" className="block bg-blue-50/50 p-3 rounded-lg border border-blue-100/80 hover:bg-blue-100 hover:border-blue-200 transition-all duration-200">
            <div className="flex items-center gap-3">
              <img src={(product as Product).image_url} alt={(product as Product).product_name} className="w-16 h-16 rounded-md object-cover border border-blue-200" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-blue-900 leading-tight">{(product as Product).product_name}</p>
                <p className="text-blue-700 font-bold mt-1">{(product as Product).price.toLocaleString()}원</p>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-400" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );





  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transition-all duration-300 z-40",
        collapsed ? "w-12" : "w-80",
      )}
    >
      {collapsed ? (
        <div className="flex flex-col h-full items-center py-4 gap-3">
          <Button variant="ghost" size="sm" onClick={onToggle} className="p-2">
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {(currentView === "recipe" || currentView === "cart") && (
            <div className="flex flex-col gap-2">
              <Button
                variant={currentView === "recipe" ? "default" : "outline"}
                size="sm"
                onClick={() => onViewChange("recipe")}
                className="p-2 w-10 h-10"
                title="Recipes"
              >
                <ChefHat className="w-4 h-4" />
              </Button>
              <Button
                variant={currentView === "cart" ? "default" : "outline"}
                size="sm"
                onClick={() => onViewChange("cart")}
                className="p-2 w-10 h-10"
                title="Shopping Cart"
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">Chat</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onToggle} className="p-2">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* 토글 버튼 보기 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex gap-2">
              <Button
                variant={currentView === "recipe" ? "default" : "outline"}
                size="sm"
                onClick={() => onViewChange("recipe")}
                className="flex-1"
              >
                <ChefHat className="w-4 h-4 mr-1" />
                Recipe
              </Button>
              <Button
                variant={currentView === "cart" ? "default" : "outline"}
                size="sm"
                onClick={() => onViewChange("cart")}
                className="flex-1"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Cart
              </Button>
            </div>
          </div>

          {/* 메시지 */}
          <div className="flex-1 min-h-0 relative">
            <ScrollArea className="absolute inset-0 p-4" ref={scrollAreaRef}>
              {chatHistory?.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>대화 입력 ㅇㄹㄴㅇㄻㄴㅇㄹㄴㅁㅇㄹ</p>
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {chatHistory?.map((chat, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-3 rounded-lg max-w-[90%]",
                        chat.type === "user" 
                        ? "bg-blue-600 text-white ml-auto" 
                        : "bg-gray-100 dark:bg-gray-700",
                      )}
                    >
                      <div className="whitespace-pre-wrap">{chat.content}</div>
                      {chat.type === 'bot' && chat.recipes && chat.recipes.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {chat.recipes.map((recipe, recipeIndex) => {
                            // --- 핵심! ---
                            // source 값에 따라 다른 렌더링 함수를 호출합니다.
                            if (recipe.source === 'ingredient_search') {
                              return renderProductResults(recipe, recipeIndex);
                            } else {
                              return renderCookingRecipe(recipe, recipeIndex);
                            }
                          })}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2 text-right">
                        {chat.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* 채팅 입력 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask for recipes or ingredients..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button onClick={onChatSubmit} size="sm" disabled={isLoading || !message.trim()}>
                 {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                 ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </div>


      )}
    </div>
  )
}
