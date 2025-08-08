"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ArrowUp, ChefHat, BookOpen, ShoppingCart, Play, Search, MessageSquare, Loader2, AlertCircle } from "lucide-react"
import { sendMessageToAgent, checkServiceHealth } from "@/lib/api"

    
interface ChatMessage {
  type: "user" | "bot"
  content: string
  timestamp: Date
}

interface ServiceHealth {
  intent: boolean
  shopping: boolean
  video: boolean
}

export default function CookingAgent() {
  const [message, setMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentIngredients, setCurrentIngredients] = useState<(string | Ingredient)[]>([])
  const [currentRecipe, setCurrentRecipe] = useState<string[]>([])
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth>({
    intent: false,
    shopping: false,
    video: false
  })
  const [isAgentHealthy, setIsAgentHealthy] = useState(false)
  const [currentRecipeName, setCurrentRecipeName] = useState<string>("")


  // 서비스 상태 확인
  useEffect(() => {
    handleRefreshHealth();
  }, [])

  const handleRefreshHealth = async () => {
    try {
      const health = await checkServiceHealth();
    setIsAgentHealthy(health.agent);
    } catch (error) {
      console.error('Service health check failed:', error)
    }
  }

  const handleSendMessage = async () => {
    if (message.trim() && !isLoading) {
      const userMessage = message.trim()
      setMessage("")
      setIsLoading(true)

      const userChatMessage: ChatMessage = {
        type: "user",
        content: userMessage,
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, userChatMessage])

      try {
        const result = await sendMessageToAgent(userMessage)
        console.log('----indent 결과 ----- Intent classification result:', result)

        const botResponse = result.response;
        console.log('----에이전트에게 보낸 메시지 응답 결과 ----- Bot response:', botResponse)

        // // 요리 이름 추출 (예: "네, 월남쌈 만드는 방법을 알려드릴게요!")
        // const nameMatch = botResponse.match(/(?:네,|알겠습니다,)?\s*([^\s]+)\s*만드는 방법/)
        // if (nameMatch) {
        //   setCurrentRecipeName(nameMatch[1])
        // } else {
        //   setCurrentRecipeName("")
        // }
        // console.log('----요리 이름 ----- Current recipe name:', currentRecipeName)

        // // [추가] 응답에서 재료와 만드는 법 파싱
        // // 재료 추출
        // const ingredientMatch = botResponse.match(/\*\*재료:\*\*\s*([\s\S]*?)\n\n\*\*/)
        // let ingredients: string[] = []
        // if (ingredientMatch) {
        //   ingredients = ingredientMatch[1]
        //     .split('\n')
        //     .map(line => line.replace(/^\* /, '').trim())
        //     .filter(line => line.length > 0)
        // }

        // // 만드는 법(조리법) 추출
        // const recipeMatch = botResponse.match(/\*\*만드는 법:\*\*\s*([\s\S]*?)(?:\n\n|$)/)
        // let recipe: string[] = []
        // if (recipeMatch) {
        //   recipe = recipeMatch[1]
        //     .split('\n')
        //     .map(line => line.replace(/^\d+\.\s*/, '').trim())
        //     .filter(line => line.length > 0)
        // }


          let extractedRecipeName = "";
          let ingredients: string[] = [];
          let recipe: string[] = [];

          // botResponse가 JSON 객체인지 확인
            if (typeof botResponse === 'object' && botResponse !== null) {
              // JSON 객체에 요리 정보가 있을 경우
              extractedRecipeName = botResponse.food_name || "";
              ingredients = Array.isArray(botResponse.ingredients) ? botResponse.ingredients : [];
              recipe = Array.isArray(botResponse.recipe) ? botResponse.recipe : [];
            } else {
              // JSON 객체지만 레시피 정보가 없을 경우 (다른 에러 등)
              // botResponse를 그대로 사용하거나 에러 처리
            }


        // 필요한 데이터를 문자열로 변환
        const botResponseString = `
          ${botResponse.answer || ""}
          📋 재료: ${botResponse.ingredients?.join(", ") || "없음"}
          👨‍🍳 조리 단계: ${botResponse.recipe?.join("\n") || "없음"}
        `;


        // 봇 응답 추가
        const botChatMessage: ChatMessage = {
          type: "bot",
          content: botResponseString.trim(),
          timestamp: new Date()
        }
        setChatHistory(prev => [...prev, botChatMessage])

        setCurrentRecipeName(extractedRecipeName);
        setCurrentIngredients(botResponse.ingredients)
        setCurrentRecipe(botResponse.recipe)

      } catch (error) {
        console.error('Error processing message:', error)
        const errorMessage: ChatMessage = {
          type: "bot",
          content: "죄송합니다. 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
          timestamp: new Date()
        }
        setChatHistory(prev => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleNewChat = () => {
    setChatHistory([])
    setCurrentIngredients([])
    setCurrentRecipe([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 h-[calc(100vh-3rem)]">
        {/* 왼쪽 사이드바 */}
        <div className="col-span-2 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-orange-100">
          <div className="space-y-6">
            {/* 서비스 상태 표시 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-orange-900">서비스 상태</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshHealth}
                  className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </div>
              <div className="space-y-2">
                {/* <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Intent Service</span>
                  <div className={`w-2 h-2 rounded-full ${serviceHealth.intent ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div> */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Shopping Service</span>
                  <div className={`w-2 h-2 rounded-full ${serviceHealth.shopping ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Video Service</span>
                  <div className={`w-2 h-2 rounded-full ${serviceHealth.video ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Planning Agent</span>
                  <div className={`w-2 h-2 rounded-full ${isAgentHealthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 새 카테고리 */}
            <div>
              <h3 className="font-semibold text-orange-900 mb-3">채팅</h3>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-3 h-auto text-orange-700 hover:bg-orange-50 hover:text-orange-800 rounded-lg transition-all duration-200"
                  onClick={handleNewChat}
                >
                  <ChefHat className="w-4 h-4 mr-2" />새 채팅
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left p-3 h-auto text-orange-700 hover:bg-orange-50 hover:text-orange-800 rounded-lg transition-all duration-200"
                >
                  <Search className="w-4 h-4 mr-2" />
                  이미지 검색
                </Button>
              </div>
            </div>

            <Separator />

            {/* 레시피 기록 */}
            <div>
              <h3 className="font-semibold text-orange-900 mb-3">레시피 기록</h3>
              <div className="space-y-2">
                {chatHistory?.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    대화 기록이 없습니다
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {chatHistory?.filter(msg => msg.type === "user").length}개의 질문
                  </div>
                )}
              </div>
            </div>

            {/* 채팅 기록 */}
            <div>
              <h3 className="font-semibold text-orange-900 mb-3">채팅 기록</h3>
              <div className="space-y-2">
                {chatHistory?.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    대화 기록이 없습니다
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {chatHistory?.length}개의 메시지
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 중앙 메인 영역 */}
        <div className="col-span-7 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-orange-100 flex flex-col">
          {/* 채팅 영역 */}
          <div className="flex-1 p-4">
            <ScrollArea className="h-full">
              {chatHistory?.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-orange-400">
                    <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">요리 전문 AI와 대화를 시작해보세요!</p>
                    <p className="text-sm mt-2 text-gray-500">
                      레시피, 재료, 조리법 등 무엇이든 물어보세요
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((chat, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${
                        chat.type === "user"
                          ? "bg-gradient-to-r from-orange-100 to-red-100 border border-orange-200 ml-auto max-w-[80%]"
                          : "bg-gradient-to-r from-gray-50 to-orange-50 border border-gray-200 mr-auto max-w-[80%]"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{chat.content}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {chat.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="bg-gradient-to-r from-gray-50 to-orange-50 border border-gray-200 mr-auto max-w-[80%] p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-gray-600">AI가 답변을 생각하고 있습니다...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* 확대된 채팅 입력 */}
          <div className="p-6 border-t border-orange-100 bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex gap-3">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="요리에 관해 무엇이든 물어보세요..."
                className="flex-1 h-12 text-base border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                size="lg"
                className="h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isLoading || !message.trim()}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowUp className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 오른쪽 사이드바 */}
        <div className="col-span-3 flex flex-col h-full">
          {/* 재료 목록 - 상단 절반 */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-orange-100 rounded-xl flex-1 mb-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">재료 목록</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              {/* 요리 이름 추가 */}
              {/* {currentIngredients.length > 0 ? (
                <div className="flex-1">
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {currentIngredients.map((ingredient, index) => (
                      <div
                      key={index}
                      className="bg-gradient-to-br from-orange-100 to-red-100 rounded-lg p-2 border border-orange-200 text-sm"
                      >
                        {typeof ingredient === 'string' 
                          ? ingredient 
                          : typeof ingredient === 'object' && ingredient !== null && 'name' in ingredient
                          ? `${(ingredient as Ingredient).name} ${(ingredient as Ingredient).amount} ${(ingredient as Ingredient).unit || ''}`.trim()
                          : String(ingredient)
                        }
                      </div>
                    ))}
                  </div>
                </div>
              ) : ( */}
                
                {currentRecipeName ? (
                  <div className="mb-2 text-lg font-bold text-orange-700 text-center">
                    {currentRecipeName}
                  </div>
                ) : (
                <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-lg p-4 mb-4 flex-1 flex items-center justify-center border border-orange-200">
                  <div className="flex items-center text-gray-600">
                    <ChefHat className="w-4 h-4 mr-2" />
                    재료 목록이 여기에 표시됩니다
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 flex-1 bg-transparent"
                  disabled={!Array.isArray(currentRecipe) || currentRecipe.length === 0}
                >
                  조리법 보러가기
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 flex-1 bg-transparent"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  장바구니 보러가기
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 조리법 - 하단 절반 */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-orange-100 rounded-xl flex-1 mt-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">조리법</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              {currentRecipe?.length > 0 ? (
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-2">
                    {currentRecipe.map((step, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-red-100 to-orange-100 rounded-lg p-3 border border-red-200 text-sm"
                      >
                        <span className="font-semibold text-orange-700">{index + 1}. </span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">조리법이 여기에 표시됩니다</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
