"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ArrowUp, ChefHat, BookOpen, ShoppingCart, Play, Search, MessageSquare, Loader2, ExternalLink } from "lucide-react"
import { sendMessageAndPoll, checkServiceHealth } from "@/lib/api"
import { MainLayout } from "@/components/main/main-layout"
import { WelcomeScreen } from "@/components/main/welcome-screen"
import { RecipeExplorationScreen } from "@/components/main/recipe-exploration-screen"
import { ShoppingListScreen } from "@/components/main/shopping-list-screen"

interface ChatMessage {
  type: "user" | "bot"
  content: string
  recipes?: Recipe[]
  timestamp: Date
  chatType?: 'chat' | 'cart'
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

export default function CookingAgent() {
  const [message, setMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth>({
    intent: false,
    shopping: false,
    video: false,
    agent : false
  })
  const [isAgentHealthy, setIsAgentHealthy] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [currentView, setCurrentView] = useState<"welcome" | "recipe" | "cart">("welcome")
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)


  // 서비스 상태 확인
  useEffect(() => {
    handleRefreshHealth();
  }, [])


  // 에이전트 상태 확인
  const handleRefreshHealth = async () => {
    try {
      const health = await checkServiceHealth();
      setIsAgentHealthy(health.agent);
    } catch (error) {
      console.error('Service health check failed:', error)
      setServiceHealth({ intent: false, shopping: false, video: false, agent: false });
    }
  }


  // 메시지 전송 및 응답 처리
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

        const botResponse = result;
        console.log('----에이전트에게 보낸 메시지 응답 결과 ----- Bot response:', botResponse)

        // 백엔드에서 온 데이터를 프론트엔드 형식에 맞게 변환(정제)합니다.
        // const cleanedRecipes = (botResponse.recipes || []).map((rawRecipe: any) => {
        //   // 1. 불필요한 포장 풀기 (Unwrapping)
        //   // 'text_based_...' 또는 'extract_recipe_...' 키가 있으면 그 안의 값을 사용합니다.
        //   const recipeData = rawRecipe.text_based_cooking_assistant_response || rawRecipe.extract_recipe_from_youtube_response || rawRecipe;

        //   // 2. 재료 데이터 형식 맞추기 (string[] -> Ingredient[])
        //   const ingredients = (recipeData.ingredients || []).map((ing: any) => {
        //     if (typeof ing === 'string') {
        //       // 문자열이면 객체로 변환
        //       return { item: ing, amount: '', unit: '' };
        //     }
        //     // 이미 객체 형식이면 그대로 반환
        //     return ing;
        //   });
        const cleanedRecipes = (botResponse.recipes || [])
          .map((rawRecipe: any) => {
            // 0) 문자열이면 JSON 파싱 시도
            const tryParse = (val: any) => {
              if (typeof val === 'string') {
                const s = val.trim();
                if (s.startsWith('{') || s.startsWith('[')) {
                  try { return JSON.parse(s); } catch { /* ignore */ }
                }
                return val; // 순수 텍스트로 유지
              }
              return val;
            };

            // 1) 불필요한 포장 풀기
            let recipeData = rawRecipe.text_based_cooking_assistant_response || rawRecipe.extract_recipe_from_youtube_response || rawRecipe;
            recipeData = tryParse(recipeData);

            // 2) steps -> recipe 정규화
            const recipeSteps: string[] = Array.isArray((recipeData as any)?.recipe)
              ? recipeData.recipe
              : (Array.isArray((recipeData as any)?.steps) ? (recipeData as any).steps : []);

            // 3) 재료 정규화 (string[] -> Ingredient[])
            const normalizedIngredients: Ingredient[] = Array.isArray((recipeData as any)?.ingredients)
              ? (recipeData as any).ingredients.map((ing: any) => (
                  typeof ing === 'string' ? { item: ing, amount: '', unit: '' } : ing
                ))
              : [];

        //   return {
        //     ...recipeData,
        //     ingredients: ingredients,
        //     source: recipeData.source || 'text' // source가 없을 경우 기본값 설정
        //   };
        // }).filter(Boolean); // 혹시 모를 null/undefined 값 제거

            return {
              source: (recipeData as any).source || 'text',
              food_name: (recipeData as any).food_name || (recipeData as any).title || '',
              ingredients: normalizedIngredients,
              recipe: recipeSteps,
            } as Recipe;
          })
          // 레시피 카드 조건: 단계가 1개 이상 있어야 함
          .filter((r: Recipe) => Array.isArray(r.recipe) && r.recipe.length > 0);


        // 답변 텍스트 구성: 상위 answer + 레시피 아닌 하위 answer들을 결합
        const nestedAnswers: string[] = (botResponse.recipes || [])
          .map((rawRecipe: any) => {
            const unwrap = rawRecipe.text_based_cooking_assistant_response || rawRecipe.extract_recipe_from_youtube_response || rawRecipe;
            if (typeof unwrap === 'string') {
              const s = unwrap.trim();
              if (s.startsWith('{') || s.startsWith('[')) {
                try { const obj = JSON.parse(s); return obj?.answer; } catch { return undefined; }
              }
              return s; // 순수 텍스트 응답
            }
            return unwrap?.answer;
          })
          .filter((a: any) => typeof a === 'string' && a.trim().length > 0);

        // 상위 answer + 하위 answer를 모두 결합하되, 중복은 제거
        const topAnswer = typeof botResponse.answer === 'string' ? botResponse.answer.trim() : '';
        const allAnswers = [topAnswer, ...nestedAnswers]
          .map((s) => (typeof s === 'string' ? s.trim() : ''))
          .filter((s) => s.length > 0);
        const uniqueAnswers = allAnswers.filter((s, idx, arr) => arr.findIndex(t => t === s) === idx);
        const combinedAnswer = uniqueAnswers.join('\n\n');

        // 봇 응답 추가
        const botChatMessage: ChatMessage = {
          type: "bot",
          content: botResponse.answer || "레시피 정보를 확인해주세요.",
          recipes: botResponse.recipes || [],
          timestamp: new Date(),
          chatType: botResponse.chatType || 'chat'
        }
        setChatHistory(prev => [...prev, botChatMessage])
        setRecipes(botResponse.recipes || []);

      } catch (error : any) {
        let displayMessage = "죄송합니다. 서버에서 응답을 처리하지 못했습니다.";

        if (error && error.message) {
          // 에러 메시지에서 JSON 부분을 직접 파싱
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

    setRecipes([])
  }

  const handleViewChange = (view: "welcome" | "recipe" | "cart") => {
    setCurrentView(view)
  }


  // --- 렌더링 함수 분리 ---
  // 1. 요리 레시피 렌더링 컴포넌트
  const renderCookingRecipe = (recipe: Recipe, recipeIndex: number) => (
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
              {`${(ingredient as Ingredient).item} ${(ingredient as Ingredient).amount}${(ingredient as Ingredient).unit ? ' ' + (ingredient as Ingredient).unit : ''}`.trim()}
            </div>
          ))}
        </div>
      </div>
      {recipe.recipe && recipe.recipe.length > 0 && (
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
    <div className="relative">
      <MainLayout
        currentView={currentView}
        chatHistory={chatHistory}
        isLoading={isLoading}
        rightSidebarCollapsed={rightSidebarCollapsed}
        onViewChange={handleViewChange}
        onChatSubmit={handleSendMessage}
        onRightSidebarToggle={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}

      >
        
      {/* Main Content with Smooth Transitions */}
        <div className="transition-all duration-300 ease-in-out">
          {currentView === "welcome" && <WelcomeScreen onChatSubmit={handleSendMessage} />}
          {currentView === "recipe" && (
            <RecipeExplorationScreen
              recipes={recipes}
              isRightSidebarOpen={!rightSidebarCollapsed}
            />
          )}
          {currentView === "cart" && (
            <ShoppingListScreen
              isRightSidebarOpen={!rightSidebarCollapsed}
            />
          )}
        </div>
        
      </MainLayout>



      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 h-[calc(100vh-3rem)]">

        {/* 중앙 메인 영역 */}
        <div className="col-span-7 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-orange-100 flex flex-col">
          <div className="flex-1 p-4">
            <ScrollArea className="h-full">
              {chatHistory?.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-orange-400">
                    <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">요리 전문 AI와 대화를 시작해보세요!</p>
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
                  {isLoading && (
                    <div className="bg-gradient-to-r from-gray-50 to-orange-50 border border-gray-200 mr-auto max-w-[80%] p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI가 답변을 생각하고 있습니다...</span>
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

      </div>
    </div>
  )
}
