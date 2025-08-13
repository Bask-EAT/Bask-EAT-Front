"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ArrowUp, ChefHat, BookOpen, ShoppingCart, Play, Search, MessageSquare, Loader2, AlertCircle } from "lucide-react"
import { sendMessageAndPoll, checkServiceHealth } from "@/lib/api"

interface ChatMessage {
  type: "user" | "bot"
  content: string
  recipes?: Recipe[]
  timestamp: Date
}

interface ServiceHealth {
  intent: boolean
  shopping: boolean
  video: boolean
  agent: boolean
}

interface Ingredient {
  item: string
  amount: string
  unit: string
}

interface Recipe {
  source: 'text' | 'video'
  food_name: string
  ingredients: Ingredient[]
  recipe: string[]
}

export default function CookingAgent() {
  const [message, setMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // const [currentIngredients, setCurrentIngredients] = useState<(string | Ingredient)[]>([])
  // const [currentRecipe, setCurrentRecipe] = useState<string[]>([])
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth>({
    intent: false,
    shopping: false,
    video: false,
    agent : false
  })
  const [isAgentHealthy, setIsAgentHealthy] = useState(false)
  // const [currentRecipeName, setCurrentRecipeName] = useState<string>("")
  const [recipes, setRecipes] = useState<Recipe[]>([])


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
      setServiceHealth({ intent: false, shopping: false, video: false, agent: false });
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
        const result = await sendMessageAndPoll(userMessage)
        // console.log('----indent 결과 ----- Intent classification result:', result)

        const botResponse = result;
        console.log('----에이전트에게 보낸 메시지 응답 결과 ----- Bot response:', botResponse)

        // 백엔드에서 온 데이터를 프론트엔드 형식에 맞게 변환(정제)합니다.
        const cleanedRecipes = (botResponse.recipes || []).map((rawRecipe: any) => {
          // 1. 불필요한 포장 풀기 (Unwrapping)
          // 'text_based_...' 또는 'extract_recipe_...' 키가 있으면 그 안의 값을 사용합니다.
          const recipeData = rawRecipe.text_based_cooking_assistant_response || rawRecipe.extract_recipe_from_youtube_response || rawRecipe;

          // 2. 재료 데이터 형식 맞추기 (string[] -> Ingredient[])
          const ingredients = (recipeData.ingredients || []).map((ing: any) => {
            if (typeof ing === 'string') {
              // 문자열이면 객체로 변환
              return { item: ing, amount: '', unit: '' };
            }
            // 이미 객체 형식이면 그대로 반환
            return ing;
          });

          return {
            ...recipeData,
            ingredients: ingredients,
            source: recipeData.source || 'text' // source가 없을 경우 기본값 설정
          };
        }).filter(Boolean); // 혹시 모를 null/undefined 값 제거


        // 봇 응답 추가
        const botChatMessage: ChatMessage = {
          type: "bot",
          content: botResponse.answer || "레시피 정보를 확인해주세요.",
          recipes: cleanedRecipes,
          timestamp: new Date()
        }
        setChatHistory(prev => [...prev, botChatMessage])
        setRecipes(cleanedRecipes);

      } catch (error : any) {
        let displayMessage = "죄송합니다. 서버에서 응답을 처리하지 못했습니다.";

      if (error && error.message) {
        // 정규표현식 대신, 에러 메시지에서 JSON 부분을 직접 파싱하는 더 안정적인 방법을 사용합니다.
        try {
          // 1. 에러 메시지에서 JSON 객체가 시작하는 '{' 문자를 찾습니다.
          const jsonStartIndex = error.message.indexOf('{');
          
          if (jsonStartIndex > -1) {
            // 2. '{' 부터 끝까지 문자열을 잘라내어 순수한 JSON 텍스트를 얻습니다.
            const jsonString = error.message.substring(jsonStartIndex);
            
            // 3. 추출한 문자열을 JSON 객체로 변환(파싱)합니다.
            const errorData = JSON.parse(jsonString);
            
            // 4. 파싱된 객체 안에 'detail' 키가 있으면 그 값을 최종 메시지로 사용합니다.
            if (errorData && errorData.detail) {
              displayMessage = errorData.detail;
            }
          }
        } catch (parseError) {
          // 에러 메시지에 JSON이 포함되지 않았거나 파싱에 실패한 경우,
          // 아무것도 하지 않고 기본 에러 메시지를 사용합니다.
          console.error("Could not parse error JSON from message:", parseError);
        }
      }
      
      console.error('Error processing message:', error.message || error);

      // 5. 최종적으로 결정된 메시지를 채팅창에 보여줍니다.
      setChatHistory(prev => [...prev, {
        type: "bot",
        content: displayMessage,
        timestamp: new Date()
      }]);
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
    // setCurrentIngredients([])
    // setCurrentRecipe([])
    setRecipes([])
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
                      {chat.type === 'bot' && chat.recipes && chat.recipes.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {chat.recipes.map((recipe, recipeIndex) => (
                            <div key={recipeIndex} className="border-t border-orange-200/50 pt-3 space-y-3">
                              <h4 className="font-bold text-orange-800 flex items-center text-lg">
                                <BookOpen className="w-5 h-5 mr-2 flex-shrink-0" />
                                {recipe.food_name}
                              </h4>
                              <div>
                                <h5 className="font-semibold text-md mb-2 text-orange-700 flex items-center">
                                  <ShoppingCart className="w-4 h-4 mr-2" />재료 목록
                                </h5>
                                <div className="space-y-1 text-sm">
                                  {recipe.ingredients.map((ingredient, i) => (
                                    <div key={i} className="bg-orange-50/50 p-2 rounded-md border border-orange-100/80">
                                      {`${ingredient.item} ${ingredient.amount}${ingredient.unit ? ' ' + ingredient.unit : ''}`.trim()}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h5 className="font-semibold text-md mb-2 text-orange-700 flex items-center">
                                  <BookOpen className="w-4 h-4 mr-2" />조리법
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
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2 text-right">
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

        {/* 오른쪽 사이드바 (수정됨) */}
        <div className="col-span-3 h-full">
            <ScrollArea className="h-full pr-4">
                <div className="flex flex-col gap-6">
                    {recipes.length > 0 ? (
                        recipes.map((recipe, index) => (
                            <Card key={index} className="bg-white/90 backdrop-blur-sm shadow-lg border border-orange-100 rounded-xl">
                                <CardHeader>
                                    <CardTitle className="text-xl text-orange-800">{recipe.food_name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-md mb-2 text-orange-700 flex items-center">
                                            <ShoppingCart className="w-4 h-4 mr-2" />재료 목록
                                        </h4>
                                        <div className="space-y-2">
                                            {recipe.ingredients.map((ingredient, i) => (
                                                <div key={i} className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-2 border border-orange-200 text-sm">
                                                    {`${ingredient.item} ${ingredient.amount}${ingredient.unit ? ' ' + ingredient.unit : ''}`.trim()}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h4 className="font-semibold text-md mb-2 text-orange-700 flex items-center">
                                            <BookOpen className="w-4 h-4 mr-2" />조리법
                                        </h4>
                                        <div className="space-y-2">
                                            {recipe.recipe.map((step, i) => (
                                                <div key={i} className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-3 border border-red-200 text-sm leading-relaxed">
                                                    <span className="font-bold text-orange-700">{i + 1}. </span>
                                                    {step.replace(/^\d+\.\s*/, '')}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <Card className="w-full bg-white/90 backdrop-blur-sm shadow-lg border border-orange-100 rounded-xl p-8">
                                <div className="text-center text-gray-500">
                                    <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-semibold">레시피 정보</p>
                                    <p className="text-sm mt-2">요리를 검색하면 재료와 조리법이 여기에 표시됩니다.</p>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
      </div>
    </div>
  )
}
