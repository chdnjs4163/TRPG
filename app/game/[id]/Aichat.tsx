// 파일 경로: app/game/[id]/AiChat.tsx , 테스트용 (대화기록만 주고받고 단순히 채팅)
'use client';

import React, { useState } from 'react';
import axios from 'axios';

// API 서버 주소
const SPRING_BOOT_BASE_URL = 'http://localhost:8080';
const FLASK_AI_SERVICE_URL = 'http://localhost:5000';

// 채팅 메시지 타입 정의
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiChat() {
  // --- 상태 정의 ---
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState('AI의 응답을 기다리고 있습니다...');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // --- 입력 변경 핸들러 ---
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
  };

  // --- 전송 함수 ---
  const sendToAi = async () => {
    if (!userInput.trim()) {
      setError('메시지를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setAiResponse('');
    setAudioUrl(null);

    // 사용자 메시지를 대화 기록에 추가
    const newUserMessage: ChatMessage = { role: 'user', content: userInput };
    const updatedHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedHistory);
    setUserInput('');

    try {
      // Spring Boot → Flask AI 서비스 호출
      const response = await axios.post(`${SPRING_BOOT_BASE_URL}/api/ai/dialogue`, {
        history: updatedHistory
      });

      const aiResponseMessage = response.data.aiResponse;
      const aiResponseAudioUrl = response.data.audioUrl;

      setAiResponse(aiResponseMessage);
      setAudioUrl(aiResponseAudioUrl);

      // ✅ 버튼 클릭 이벤트 안에서 음성 실행
      if (aiResponseAudioUrl) {
        try {
          const audio = new Audio(`${FLASK_AI_SERVICE_URL}${aiResponseAudioUrl}`);
          await audio.play().catch(e => console.error("오디오 재생 오류:", e));
        } catch (e) {
          console.error("오디오 객체 생성 오류:", e);
        }
      }

      // AI 응답도 대화 기록에 추가
      const newAiMessage: ChatMessage = { role: 'assistant', content: aiResponseMessage };
      setChatHistory(prev => [...prev, newAiMessage]);

    } catch (err) {
      console.error("AI 서비스 호출 중 오류 발생:", err);
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(`오류: ${err.response.data.error || '서버 응답 오류'}`);
        } else if (err.request) {
          setError('네트워크 오류: 서버에 연결할 수 없습니다. Spring Boot가 실행 중인지 확인하세요.');
        } else {
          setError('요청 설정 중 오류가 발생했습니다.');
        }
      } else {
        setError('예상치 못한 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- 렌더링 ---
  console.log("현재 audioUrl 상태:", audioUrl); // 디버깅용
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '20px auto', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '2px 2px 8px rgba(0,0,0,0.1)' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>TRPG AI 대화 시스템</h1>

      {/* AI 응답 영역 */}
      <div style={{ marginBottom: '20px', minHeight: '100px', padding: '15px', border: '1px solid #eee', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
        <p style={{ margin: '0', fontSize: '1.1em', lineHeight: '1.5' }}>
          <strong style={{ color: '#007bff' }}>AI:</strong> {aiResponse}
        </p>
        {loading && <p style={{ color: '#555', fontStyle: 'italic' }}>AI가 생각 중...</p>}
        {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
        {audioUrl && (
          <div style={{ marginTop: '10px' }}>
            <audio controls src={`${FLASK_AI_SERVICE_URL}${audioUrl}`}>
              브라우저가 audio 태그를 지원하지 않습니다.
            </audio>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          placeholder="AI에게 던질 질문이나 대사를 입력하세요..."
          disabled={loading}
          style={{ flexGrow: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1em' }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              sendToAi();
            }
          }}
        />
        <button
          onClick={sendToAi}
          disabled={loading}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1em' }}
        >
          {loading ? '전송 중...' : '전송'}
        </button>
      </div>
    </div>
  );
}
