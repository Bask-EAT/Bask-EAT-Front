// API 서비스 URL들 (Next.js rewrite 사용)
// const INTENT_SERVICE_URL = "/api/intent"
// const SHOPPING_SERVICE_URL = "/api/shopping"
// const VIDEO_SERVICE_URL = "/api/video"
// API 서비스 URL을 메인 서버 하나로 통일합니다.
const AGENT_SERVICE_URL = "/api/agent";

// API 응답 타입 정의
export interface IntentResponse {
  intent: string
  confidence: number
  reason: string
  message: string
  video_result?: any
}

export interface Ingredient {
  name: string
  amount: string
  unit?: string
}

export interface ShoppingResponse {
  answer: string
  ingredients: (string | Ingredient)[]
  recipe: string[]
}

export interface VideoResponse {
  answer: string
  ingredients: (string | Ingredient)[]
  recipe: string[]
}

export interface AgentResponse {
  response: string;
}

// 의도 분류 API
// export async function classifyIntent(message: string): Promise<IntentResponse> {
//   try {
//     const response = await fetch(`${INTENT_SERVICE_URL}/classify`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         message: message,
//         youtube_url: message // 유튜브 링크인 경우를 위해
//       })
//     })

//     if (!response.ok) {
//       throw new Error(`Intent service error: ${response.status}`)
//     }

//     return await response.json()
//   } catch (error) {
//     console.error('Intent classification error:', error)
//     throw error
//   }
// }

// 쇼핑 에이전트 API
// export async function processShoppingMessage(message: string): Promise<ShoppingResponse> {
//   try {
//     const response = await fetch(`${SHOPPING_SERVICE_URL}/chat`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         message: message
//       })
//     })

//     if (!response.ok) {
//       throw new Error(`Shopping service error: ${response.status}`)
//     }

//     return await response.json()
//   } catch (error) {
//     console.error('Shopping service error:', error)
//     throw error
//   }
// }

// // 비디오 에이전트 API
// export async function processVideoMessage(youtubeUrl: string): Promise<VideoResponse> {
//   try {
//     const response = await fetch(`${VIDEO_SERVICE_URL}/process`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         youtube_url: youtubeUrl,
//         message: youtubeUrl
//       }),
//       // 유튜브 영상 처리는 시간이 오래 걸리므로 타임아웃을 5분으로 설정
//       signal: AbortSignal.timeout(300000) // 5분 = 300초
//     })

//     if (!response.ok) {
//       throw new Error(`Video service error: ${response.status}`)
//     }

//     return await response.json()
//   } catch (error) {
//     console.error('Video service error:', error)
//     throw error
//   }
// }



export async function sendMessageToAgent(message: string): Promise<AgentResponse> {
  try {
    const response = await fetch(`${AGENT_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
      }),
      // 복잡한 요청(특히 영상 처리)은 시간이 걸릴 수 있으므로 타임아웃을 넉넉하게 설정합니다.
      signal: AbortSignal.timeout(300000) // 5분
    });

    if (!response.ok) {
      // const errorData = await response.json();
      // throw new Error(errorData.detail || `Agent service error: ${response.status}`);
      const errorText = await response.text(); // JSON이 아닐 수 있음
      throw new Error(`Agent service error: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Agent service error:', error);
    throw error;
  }
}

// WebSocket을 사용한 실시간 서비스 상태 확인 (선택적)
export function createHealthWebSocket(onHealthUpdate: (health: {intent: boolean, shopping: boolean, video: boolean}) => void) {
  // WebSocket 연결 (실제 구현 시 서버에서 WebSocket 지원 필요)
  const ws = new WebSocket('ws://localhost:8001/ws/health')
  
  ws.onmessage = (event) => {
    try {
      const health = JSON.parse(event.data)
      onHealthUpdate(health)
    } catch (error) {
      console.error('WebSocket health data parse error:', error)
    }
  }
  
  ws.onerror = (error) => {
    console.error('WebSocket health check error:', error)
  }
  
  return ws
}


/**
 * 서비스 상태를 확인하는 함수도 메인 에이전트 서버 하나만 확인하도록 변경합니다.
 */
export async function checkServiceHealth(): Promise<{ agent: boolean }> {
  try {
    const response = await fetch(`${AGENT_SERVICE_URL}/health`);
    return { agent: response.ok };
  } catch (error) {
    console.error('Agent service health check failed:', error);
    return { agent: false };
  }
}