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

export interface StructuredIngredient {
  item: string
  amount: string
  unit: string
}

export interface UnifiedRecipe {
  source: 'text' | 'video'
  food_name: string
  ingredients: StructuredIngredient[]
  recipe: string[]
}

export interface UnifiedAgentPayload {
  answer: string
  recipes: UnifiedRecipe[]
}

// export interface AgentResponse {
//   response: UnifiedAgentPayload;
// }

// 최종 응답 타입을 정의합니다. AgentResponse는 기존에 사용하시던 타입입니다.
interface AgentResponse {
  answer: string;
  recipes: any[]; // 실제 레시피 타입에 맞게 수정하세요
}

// 작업 상태 응답 타입을 정의합니다.
interface StatusResponse {
  status: 'processing' | 'completed' | 'failed';
  result?: AgentResponse; // 'completed'일 때만 존재
  error?: string;       // 'failed'일 때만 존재
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



// export async function sendMessageToAgent(message: string): Promise<AgentResponse> {
//   try {
//     const response = await fetch(`${AGENT_SERVICE_URL}/chat`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         message: message,
//       }),
//       // 복잡한 요청(특히 영상 처리)은 시간이 걸릴 수 있으므로 타임아웃을 넉넉하게 설정합니다.
//       signal: AbortSignal.timeout(300000) // 5분
//     });

//     if (!response.ok) {
//       // const errorData = await response.json();
//       // throw new Error(errorData.detail || `Agent service error: ${response.status}`);
//       const errorText = await response.text(); // JSON이 아닐 수 있음
//       throw new Error(`Agent service error: ${errorText}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error('Agent service error:', error);
//     throw error;
//   }
// }


/**
 * 에이전트에게 메시지를 보내고, 작업이 완료될 때까지 주기적으로 상태를 확인(Polling)합니다.
 * @param message 사용자 입력 메시지
 * @returns 작업이 성공적으로 완료되면 AgentResponse를 담은 Promise를 반환합니다.
 */
export async function sendMessageAndPoll(message: string): Promise<AgentResponse> {
  
  // 1. (주문) 백엔드에 작업을 요청하고 'job_id'(진동벨)를 받습니다.
  // 이 요청은 즉시(1초 내) 응답이 옵니다.
  const startResponse = await fetch(`${AGENT_SERVICE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (startResponse.status !== 202) { // 202 Accepted 상태가 아니면 에러
    const errorText = await startResponse.text();
    throw new Error(`Agent job을 시작하지 못했습니다: ${errorText}`);
  }

  const { job_id } = await startResponse.json();

  // 2. (진동벨 확인) 작업이 완료될 때까지 3초마다 상태를 물어봅니다.
  return new Promise<AgentResponse>((resolve, reject) => {
    const intervalId = setInterval(async () => {
      try {
        const statusResponse = await fetch(`${AGENT_SERVICE_URL}/status/${job_id}`);
        
        if (!statusResponse.ok) { // 상태 확인 실패 시 Polling 중단 및 에러 처리
          clearInterval(intervalId);
          reject(new Error(`작업 상태 확인 실패: ${statusResponse.statusText}`));
          return;
        }

        const data: StatusResponse = await statusResponse.json();

        // 3. (음료 수령) 작업이 완료되었는지 확인합니다.
        if (data.status === 'completed') {
          clearInterval(intervalId); // Polling 중단
          resolve(data.result!);   // 성공 결과 반환
        } else if (data.status === 'failed') {
          clearInterval(intervalId); // Polling 중단
          reject(new Error(data.error || '백엔드 작업 처리 중 에러 발생')); // 실패 결과 반환
        }
        // 'processing' 상태라면 아무것도 하지 않고 다음 확인을 기다립니다.

      } catch (error) {
        clearInterval(intervalId);
        reject(error);
      }
    }, 3000); // 3초 간격으로 확인
  });
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