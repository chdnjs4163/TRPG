// 템플릿 페이지 - 장르별 게임 템플릿 탐색/검색/상세 이동
"use client";

import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { GameInfo } from "@/components/game-info";
import { CharacterCreation } from "@/components/character-creation";

export default function TemplatesPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const ITEMS_PER_PAGE = 8;

  const templates = [
    {
      id: 1,
      title: "던전 마스터",
      description: "던전 탐험을 위한 템플릿",
      genre: "모험",
      players: "3-5명",
      duration: "2-4시간",
      image: "/images/dungeon_master.png",
      rating: 4.8,
      difficulty: "medium",
      estimatedTime: "2-4시간",
      maxPlayers: 5,
      setting: "고대 던전",
      recommendedLevel: "중급자",
      features: ["던전 탐험", "보물 수집", "몬스터 전투", "퍼즐 해결"],
      scenario: {
        hook: "침묵하던 고대 던전의 문이 스스로 열렸습니다. 깊은 곳에서 낯선 진동이 느껴집니다.",
        role: "당신은 왕국에 의해 파견된 모험단의 일원으로, 봉인이 풀린 이유를 조사해야 합니다.",
        mission: "던전 심층으로 진입해 봉인의 붕괴 원인을 밝혀내고, 다시 봉인하거나 위협을 제거하세요."
      },
      tags: ["#판타지", "#탐험", "#퍼즐", "#중급자용", "#스토리중심"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "캐릭터 관리", "맵 시스템"]
    },
    {
      id: 2,
      title: "우주 정거장",
      description: "우주 정거장에서 벌어지는 사건을 해결하는 모험",
      genre: "SF",
      players: "2-4명",
      duration: "3-5시간",
      image: "/images/space_adventure.png",
      rating: 4.6,
      difficulty: "hard",
      estimatedTime: "3-5시간",
      maxPlayers: 4,
      setting: "우주 공간",
      recommendedLevel: "고급자",
      features: ["우주 정거장", "외계 생명체", "우주선 관리", "미지의 행성"],
      scenario: {
        hook: "정거장 주변 항로에서 구조 신호가 반복 송출됩니다. 발신지는 등록되지 않은 소행성대.",
        role: "당신은 탐사선의 임무 장교로, 신호의 근원을 찾아 조사해야 합니다.",
        mission: "신호의 발원지에 착륙하여 생존자를 구조하거나, 잠재적 위협을 식별하고 보고하세요."
      },
      tags: ["#SF", "#탐사", "#서바이벌", "#고급자용", "#스토리중심"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "인벤토리", "맵 시스템"]
    },
    {
      id: 13,
      title: "외계 행성",
      description: "미지의 외계 행성을 탐험하며 새로운 문명과 생명체를 발견",
      genre: "SF",
      players: "2-4명",
      duration: "3-4시간",
      image: "/images/planet.png",
      rating: 4.7,
      difficulty: "hard",
      estimatedTime: "3-4시간",
      maxPlayers: 5,
      setting: "외계 행성",
      recommendedLevel: "고급자",
      features: ["탐사", "생존", "분석", "의사소통"],
      scenario: {
        hook: "탐사 드론이 전송한 데이터에 지성체 흔적이 감지됩니다.",
        role: "당신은 과학 탐사대의 일원으로, 첫 접촉을 준비합니다.",
        mission: "행성의 위험 요소를 파악하고 생존하며, 문명과의 첫 교섭을 성공시키세요."
      },
      tags: ["#SF", "#탐사", "#생존", "#고급자용"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "맵 시스템"]
    },
    {
      id: 14,
      title: "사이버 도시",
      description: "네온이 빛나는 사이버 도시에서 벌어지는 잠입과 수사",
      genre: "SF",
      players: "2-4명",
      duration: "2-4시간",
      image: "/images/cyber-city.png",
      rating: 4.6,
      difficulty: "medium",
      estimatedTime: "2-4시간",
      maxPlayers: 4,
      setting: "사이버 도시",
      recommendedLevel: "중급자",
      features: ["사이버네틱스", "AI 시스템", "네온 도시", "침투"],
      scenario: {
        hook: "메가코프 데이터 센터에서 대규모 블랙아웃이 발생했습니다.",
        role: "프리랜서 넷러너 팀의 일원으로 의뢰를 수행합니다.",
        mission: "보안망을 회피하고 증거를 확보해 배후 세력을 폭로하세요."
      },
      tags: ["#SF", "#사이버펑크", "#침투", "#중급자용"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "인벤토리", "맵 시스템"]
    },
    {
      id: 15,
      title: "핑크 시티",
      description: "네온사인이 가득한 미래 도시에서의 모험",
      genre: "SF",
      players: "2-3명",
      duration: "1-2시간",
      image: "/images/Pink_City.png",
      rating: 4.4,
      difficulty: "easy",
      estimatedTime: "1-2시간",
      maxPlayers: 3,
      setting: "핑크 시티",
      recommendedLevel: "초급자",
      features: ["도시 모험", "추적", "스텔스"],
      scenario: {
        hook: "도시 전광판이 한 인물을 지목하며 수배령을 내립니다.",
        role: "당신은 수배된 인물을 보호/추적하기 위한 의뢰를 받았습니다.",
        mission: "혼잡한 도심을 누비며 단서를 모으고 목표를 달성하세요."
      },
      tags: ["#SF", "#도시", "#추적", "#초급자용"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "맵 시스템"]
    },
    {
      id: 16,
      title: "마법의 숲",
      description: "신비로운 마법의 숲에서 펼쳐지는 모험",
      genre: "판타지",
      players: "3-5명",
      duration: "2-3시간",
      image: "/images/magical_forest.png",
      rating: 4.6,
      difficulty: "medium",
      estimatedTime: "2-3시간",
      maxPlayers: 4,
      setting: "마법의 숲",
      recommendedLevel: "중급자",
      features: ["탐험", "정령", "의식"],
      scenario: {
        hook: "고요하던 숲에 불길한 그림자가 드리웁니다.",
        role: "숲의 수호자로서 재앙의 근원을 추적합니다.",
        mission: "숲의 심장부를 정화하고 평화를 되찾으세요."
      },
      tags: ["#판타지", "#탐험", "#중급자용"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "맵 시스템"]
    },
    {
      id: 17,
      title: "드래곤 퀘스트",
      description: "전설의 드래곤을 찾아 떠나는 위대한 모험",
      genre: "판타지",
      players: "3-6명",
      duration: "3-4시간",
      image: "/images/dragon-quest.png",
      rating: 4.8,
      difficulty: "hard",
      estimatedTime: "3-4시간",
      maxPlayers: 6,
      setting: "드래곤의 땅",
      recommendedLevel: "고급자",
      features: ["보스전", "원정", "보물"],
      scenario: {
        hook: "하늘을 가르는 검은 그림자, 전설의 드래곤이 다시 날아올랐습니다.",
        role: "왕국의 사절로서 드래곤을 추적합니다.",
        mission: "고대의 단서를 모아 둥지를 찾아내고 위협을 종식하세요."
      },
      tags: ["#판타지", "#보스전", "#고급자용"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러"]
    },
    {
      id: 18,
      title: "마법사의 탑",
      description: "고대 마법사의 탑을 탐험하며 비밀을 밝혀내는 모험",
      genre: "판타지",
      players: "3-5명",
      duration: "2-3시간",
      image: "/images/Tower_of_Wizards.png",
      rating: 4.5,
      difficulty: "medium",
      estimatedTime: "2-3시간",
      maxPlayers: 4,
      setting: "마법사의 탑",
      recommendedLevel: "중급자",
      features: ["퍼즐", "비밀", "마법 장치"],
      scenario: {
        hook: "봉인된 탑에서 미약한 빛과 주문의 메아리가 들립니다.",
        role: "탑의 비밀을 해제하라는 의뢰를 받았습니다.",
        mission: "층층이 숨겨진 장치를 작동시켜 최상층의 진실을 마주하세요."
      },
      tags: ["#판타지", "#퍼즐", "#탐험"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러"]
    },
    {
      id: 19,
      title: "판타지 왕국",
      description: "정치와 음모, 모험이 교차하는 왕국의 이야기",
      genre: "판타지",
      players: "3-6명",
      duration: "2-4시간",
      image: "/images/fantasy-kingdom.png",
      rating: 4.5,
      difficulty: "medium",
      estimatedTime: "2-4시간",
      maxPlayers: 6,
      setting: "판타지 왕국",
      recommendedLevel: "중급자",
      features: ["정치", "음모", "외교"],
      scenario: {
        hook: "왕위 계승을 둘러싼 갈등이 고조됩니다.",
        role: "특명받은 사절로서 균형을 잡아야 합니다.",
        mission: "동맹을 모으고 음모를 분쇄하여 평화를 정착시키세요."
      },
      tags: ["#판타지", "#정치", "#스토리중심"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러"]
    },
    {
      id: 20,
      title: "던전 입구",
      description: "모험의 시작점, 위험한 던전으로 향하는 관문",
      genre: "모험",
      players: "3-4명",
      duration: "1-2시간",
      image: "/images/entrance_to_dungeon.png",
      rating: 4.4,
      difficulty: "medium",
      estimatedTime: "1-2시간",
      maxPlayers: 4,
      setting: "고대 던전",
      recommendedLevel: "중급자",
      features: ["탐험", "함정", "자원 관리"],
      scenario: {
        hook: "막 열려버린 던전의 문틈으로 차가운 바람이 불어옵니다.",
        role: "개척대의 선발대로 진입합니다.",
        mission: "입구 구역을 정리하고 안전한 전초기지를 확보하세요."
      },
      tags: ["#모험", "#탐험"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러"]
    },
    {
      id: 21,
      title: "잃어버린 보물",
      description: "전설의 보물을 찾아 떠나는 항해",
      genre: "모험",
      players: "3-5명",
      duration: "2-3시간",
      image: "/images/Pirate_Ship_Adventure.png",
      rating: 4.6,
      difficulty: "medium",
      estimatedTime: "2-3시간",
      maxPlayers: 5,
      setting: "맹골수도",
      recommendedLevel: "중급자",
      features: ["항해", "보물 지도", "경쟁"],
      scenario: {
        hook: "전설의 해도가 조각난 채로 경매에 등장했습니다.",
        role: "신참 항해사로서 조각들을 모아야 합니다.",
        mission: "섬들을 탐방해 정보와 조각을 모아 보물에 도달하세요."
      },
      tags: ["#모험", "#항해", "#보물사냥"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러"]
    },
    {
      id: 22,
      title: "해적선",
      description: "해적선의 선원이 되어 바다를 누비는 모험",
      genre: "모험",
      players: "3-6명",
      duration: "1-2시간",
      image: "/images/pirate_Ship.png",
      rating: 4.3,
      difficulty: "easy",
      estimatedTime: "1-2시간",
      maxPlayers: 6,
      setting: "해적선",
      recommendedLevel: "초급자",
      features: ["전투", "약탈", "선박 관리"],
      scenario: {
        hook: "수평선 너머 상선이 보입니다. 기회입니다!",
        role: "포술수/갑판원으로 급히 배치됩니다.",
        mission: "선박을 추격해 승선전을 승리로 이끌고 전리품을 확보하세요."
      },
      tags: ["#모험", "#해적", "#전투"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러"]
    },
    {
      id: 23,
      title: "던전 탐험",
      description: "고대 던전을 누비며 몬스터와 보물을 마주하는 클래식 모험",
      genre: "모험",
      players: "3-4명",
      duration: "2-3시간",
      image: "/images/DungeonExploration.png",
      rating: 4.5,
      difficulty: "medium",
      estimatedTime: "2-3시간",
      maxPlayers: 4,
      setting: "고대 던전",
      recommendedLevel: "중급자",
      features: ["전투", "퍼즐", "루팅"],
      scenario: {
        hook: "모험가 길드에 새로 발견된 던전 의뢰가 올라왔습니다.",
        role: "길드 팀을 구성해 탐사를 진행합니다.",
        mission: "층을 정복하며 보스를 격파하고 보물을 획득하세요."
      },
      tags: ["#모험", "#던전", "#탐험"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러"]
    },
    {
      id: 3,
      title: "판타지 세계",
      description: "판타지 세계를 위한 템플릿",
      genre: "판타지",
      players: "4-6명",
      duration: "4-6시간",
      image: "/images/the_fantasy_world.png",
      rating: 4.9,
      difficulty: "medium",
      estimatedTime: "4-6시간",
      maxPlayers: 6,
      setting: "판타지 대륙",
      recommendedLevel: "중급자",
      features: ["마법 시스템", "종족 다양성", "퀘스트 시스템", "왕국 정치"],
      scenario: {
        hook: "대륙의 마나 흐름이 요동칩니다. 곳곳에서 봉인된 유적이 깨어나기 시작했습니다.",
        role: "당신은 각 왕국 연합이 선발한 조사단으로, 균열의 원인과 해법을 찾아야 합니다.",
        mission: "균열 지대를 조사하여 고대 장치의 작동을 멈추거나 안정화하여 대륙의 균형을 회복하세요."
      },
      tags: ["#판타지", "#모험", "#탐험", "#중급자용", "#스토리중심"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "캐릭터 관리", "퀘스트 노트"]
    },
    {
      id: 4,
      title: "유령의 저택",
      description: "저주받은 저택에서 벌어지는 공포의 이야기.",
      genre: "호러",
      players: "3-5명",
      duration: "2-3시간",
      image: "/images/ghost_mansion.png",
      rating: 4.7,
      difficulty: "hard",
      estimatedTime: "2-3시간",
      maxPlayers: 5,
      setting: "저주받은 저택",
      recommendedLevel: "고급자",
      features: ["공포 분위기", "생존 요소", "심리적 긴장", "미스터리 해결"],
      scenario: {
        hook: "수십 년 전 사라진 저택에서 다시 불빛이 보입니다. 밤마다 창문 너머 그림자가 움직입니다.",
        role: "당신은 실종 사건을 추적하는 조사관으로, 저택의 진실을 파헤쳐야 합니다.",
        mission: "저택을 탐색하고 단서를 수집하여 저주의 기원을 밝혀내고 살아서 빠져나오세요."
      },
      tags: ["#호러", "#수사", "#서바이벌", "#고급자용", "#심리호러"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "단서 보드", "맵 시스템"]
    },
    {
      id: 9,
      title: "유령의성",
      description: "고대 성의 그림자 속에서 벌어지는 공포의 모험.",
      genre: "호러",
      players: "3-5명",
      duration: "3-4시간",
      image: "/images/got.png",
      rating: 4.6,
      difficulty: "hard",
      estimatedTime: "3-4시간",
      maxPlayers: 5,
      setting: "고대 성",
      recommendedLevel: "고급자",
      features: ["미스터리", "잠입", "생존", "심리 공포"],
      scenario: {
        hook: "폐성에서 종소리가 울립니다. 누구도 보지 못한 종이 스스로 흔들리고 있습니다.",
        role: "당신은 의뢰를 받은 탐사대의 일원으로, 성의 저주에 얽힌 진실을 밝혀야 합니다.",
        mission: "성 내부의 구역을 정복하며 핵심 단서를 모으고, 원혼의 사슬을 끊으세요."
      },
      tags: ["#호러", "#미스터리", "#잠입", "#고급자용", "#스토리중심"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "단서 보드", "맵 시스템"]
    },
    {
      id: 10,
      title: "유령의 숲",
      description: "어둠이 깃든 숲에서 벌어지는 생존과 수사의 여정.",
      genre: "호러",
      players: "2-4명",
      duration: "2-3시간",
      image: "/images/forestghost.png",
      rating: 4.5,
      difficulty: "medium",
      estimatedTime: "2-3시간",
      maxPlayers: 4,
      setting: "어두운 숲",
      recommendedLevel: "중급자",
      features: ["서바이벌", "탐사", "추적", "자연 공포"],
      scenario: {
        hook: "숲 가장자리 마을에서 매일밤 비명 소리가 들립니다. 아침이면 흔적만 남습니다.",
        role: "당신은 마을의 의뢰를 받은 추적자로, 숲의 깊은 곳까지 발자취를 쫓아야 합니다.",
        mission: "숲의 의식 장소를 찾아 유령의 근원을 밝혀내고 마을을 구하세요."
      },
      tags: ["#호러", "#서바이벌", "#탐사", "#중급자용", "#스토리중심"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "맵 시스템", "인벤토리"]
    },
    {
      id: 11,
      title: "유령늑대와 전투",
      description: "유령의 기운을 두른 괴이한 늑대 무리와의 사투.",
      genre: "호러",
      players: "2-3명",
      duration: "1-2시간",
      image: "/images/wefl.png",
      rating: 4.4,
      difficulty: "medium",
      estimatedTime: "1-2시간",
      maxPlayers: 3,
      setting: "야생의 땅",
      recommendedLevel: "중급자",
      features: ["전투 중심", "추적", "생존"],
      scenario: {
        hook: "달이 붉게 물든 밤, 유령빛을 내는 늑대들이 목초지를 습격합니다.",
        role: "당신은 사냥감과 마을을 지키기 위해 고용된 헌터입니다.",
        mission: "무리의 흔적을 분석하고 서식지를 급습하여 군락을 격파하세요."
      },
      tags: ["#호러", "#전투", "#추적", "#중급자용", "#액션"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "전투 추적", "맵 시스템"]
    },
    {
      id: 12,
      title: "심해속에서 유령과 전투",
      description: "칠흑 같은 심해에서 마주치는 유령과의 생존.",
      genre: "호러",
      players: "2-4명",
      duration: "2-4시간",
      image: "/images/deep-seaghost.png",
      rating: 4.7,
      difficulty: "hard",
      estimatedTime: "2-4시간",
      maxPlayers: 4,
      setting: "심해 기지",
      recommendedLevel: "고급자",
      features: ["산소 관리", "제한 시야", "장비 의존", "심해 공포"],
      scenario: {
        hook: "연구 기지의 통신이 끊겼습니다. 주위 바다는 비정상적인 냉기를 띱니다.",
        role: "당신은 구조팀 일원으로, 고장난 설비를 복구하고 실종자를 찾아야 합니다.",
        mission: "기지 구역을 복구하여 탈출 경로를 확보하고, 심해 유령의 발현 원인을 차단하세요."
      },
      tags: ["#호러", "#심해", "#서바이벌", "#고급자용", "#스토리중심"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "장비 관리", "맵 시스템"]
    },
    {
      id: 5,
      title: "해적 모험",
      description: "바다 모험을 위한 템플릿",
      genre: "모험",
      players: "3-6명",
      duration: "3-4시간",
      image: "/images/pirate_Ship.png",
      rating: 4.5,
      difficulty: "medium",
      estimatedTime: "3-4시간",
      maxPlayers: 6,
      setting: "해적의 바다",
      recommendedLevel: "중급자",
      features: ["해적 생활", "보물 찾기", "바다 전투", "섬 탐험"],
      scenario: {
        hook: "전설의 해도가 경매에 나왔습니다. 그러나 지도 조각은 여러 세력의 손에 흩어졌습니다.",
        role: "당신은 신참 항해사로, 선장과 함께 조각을 모아 보물의 좌표를 완성해야 합니다.",
        mission: "섬들을 순항하며 정보와 조각을 모으고, 경쟁자보다 먼저 보물에 도달하세요."
      },
      tags: ["#모험", "#해양", "#보물사냥", "#중급자용", "#탐험"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "항해 지도", "인벤토리"]
    },
    {
      id: 6,
      title: "사이버펑크",
      description: "미래 도시를 배경으로 한 템플릿",
      genre: "SF",
      players: "2-4명",
      duration: "2-4시간",
      image: "/images/Pink_City.png",
      rating: 4.4,
      difficulty: "medium",
      estimatedTime: "2-4시간",
      maxPlayers: 4,
      setting: "사이버 도시",
      recommendedLevel: "중급자",
      features: ["사이버네틱스", "AI 시스템", "네온 도시", "사이버 전투"],
      scenario: {
        hook: "메가코프의 데이터 센터에서 정체불명의 블랙아웃이 발생했습니다. 도시가 불안정해집니다.",
        role: "당신은 프리랜서 넷러너 팀의 일원으로, 사고의 진상을 파헤치기 위한 의뢰를 받았습니다.",
        mission: "보안망을 회피하고 증거를 확보하여 배후를 밝히고, 의뢰인의 목표를 달성하세요."
      },
      tags: ["#SF", "#사이버펑크", "#침투", "#중급자용", "#스토리중심"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "인벤토리", "맵 시스템"]
    },
    {
      id: 7,
      title: "마법 학교",
      description: "마법을 배우는 학교 템플릿",
      genre: "판타지",
      players: "4-8명",
      duration: "5-8시간",
      image: "/images/mag.png",
      rating: 4.8,
      difficulty: "easy",
      estimatedTime: "5-8시간",
      maxPlayers: 8,
      setting: "마법 학교",
      recommendedLevel: "초급자",
      features: ["마법 학습", "학교 생활", "우정과 경쟁", "마법 실험"],
      scenario: {
        hook: "신입생 환영식 날, 학교의 상징인 '별빛 수정'이 예고 없이 어두워졌습니다.",
        role: "당신은 신입생 혹은 상급생으로, 교장으로부터 비밀 조사를 의뢰받습니다.",
        mission: "교내 곳곳의 단서를 모아 사건의 배후를 밝혀내고, 수정의 빛을 되돌리세요."
      },
      tags: ["#판타지", "#학교", "#성장", "#초급자용", "#스토리중심"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "노트", "맵 시스템"]
    },
    {
      id: 8,
      title: "외계인 침공",
      description: "외계 생명체와의 조우 템플릿",
      genre: "SF",
      players: "3-5명",
      duration: "2-3시간",
      image: "/images/alien_invasion.png",
      rating: 4.6,
      difficulty: "hard",
      estimatedTime: "2-3시간",
      maxPlayers: 5,
      setting: "지구",
      recommendedLevel: "고급자",
      features: ["외계인 침공", "지구 방어", "과학 기술", "인류 생존"],
      scenario: {
        hook: "대기권 상공에서 미확인 비행체가 다수 포착되었습니다. 전 세계 통신망이 교란됩니다.",
        role: "당신은 국제 연합 대응팀의 요원으로, 초기 교전과 대피 작전을 지휘해야 합니다.",
        mission: "핵심 시설을 방어하고 민간인을 대피시키며, 침공의 약점을 찾아 반격의 발판을 만드세요."
      },
      tags: ["#SF", "#전쟁", "#전술", "#고급자용", "#서바이벌"],
      platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "작전 지도", "인벤토리"]
    },
  ];

  const genres = ["all", "판타지", "SF", "호러", "모험"];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === "all" || template.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });
  
  const selectByTitleOrFallback = (title: string, image: string, description: string, genre: string) => {
    const matched = templates.find(t => t.title === title) || templates.find(t => t.title.includes(title) || title.includes(t.title));
    if (matched) {
      setSelectedTemplate(matched);
    } else {
      setSelectedTemplate({
        id: Date.now(),
        title,
        description: description || `${genre} 장르의 시나리오입니다.`,
        image,
        genre,
        difficulty: "medium",
        estimatedTime: "2-3시간",
        maxPlayers: 4,
        rating: 4.5,
        setting: title,
        recommendedLevel: "중급자",
        tags: [`#${genre}`, "#모험", "#중급자용", "#스토리중심"],
        platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "맵 시스템"],
      });
    }
  };

  const changePage = (direction: "prev" | "next") => {
    const maxPage = Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE) - 1;
    if (direction === "prev" && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getCurrentPageItems = () => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return filteredTemplates.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    setCurrentPage(0);
  };

  // URL 파라미터 처리
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const titleParam = urlParams.get('title');
    const gameId = urlParams.get('gameId');
    if (titleParam) {
      const templateByTitle = templates.find(t => t.title === titleParam);
      if (templateByTitle) {
        setSelectedTemplate(templateByTitle);
        return;
      }
    }
    if (gameId) {
      const templateById = templates.find(t => t.id === parseInt(gameId));
      if (templateById) {
        setSelectedTemplate(templateById);
      }
    }
  }, []);

  const handleTemplateClick = (template: any) => {
    setSelectedTemplate(template);
  };

  const handleStartGame = () => {
    setShowCharacterCreation(true);
  };

  const handleCharacterCreated = (character: any) => {
    // 캐릭터 생성 완료 후 게임 페이지로 이동
    window.location.href = `/game/${selectedTemplate.id}?character=${encodeURIComponent(JSON.stringify(character))}&title=${encodeURIComponent(selectedTemplate.title)}`;
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setShowCharacterCreation(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <MainNavigation />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">게임 템플릿</h1>
            <p className="text-muted-foreground mt-2">다양한 장르의 TRPG 게임 템플릿을 찾아보세요</p>
          </div>
          <UserNav />
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="템플릿 검색..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {genres.map((genre) => (
                <Button
                  key={genre}
                  variant={selectedGenre === genre ? "default" : "outline"}
                  onClick={() => handleGenreChange(genre)}
                  className="capitalize"
                >
                  {genre === "all" ? "전체" : genre}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 템플릿 목록 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              {selectedGenre === "all" ? "전체" : selectedGenre} 템플릿 
              ({filteredTemplates.length}개)
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changePage("prev")}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changePage("next")}
                disabled={currentPage >= Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE) - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {getCurrentPageItems().map((template) => (
              <Card 
                key={template.id} 
                className="h-full hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handleTemplateClick(template)}
              >
                  <CardHeader className="p-0">
                    <div className="relative w-full h-48">
                      <Image
                        src={template.image || "/placeholder.svg"}
                        alt={template.title}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-sm font-medium">
                        ⭐ {template.rating}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2">{template.title}</CardTitle>
                    <CardDescription className="mb-3">{template.description}</CardDescription>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">장르:</span>
                        <span className="font-medium">{template.genre}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">플레이어:</span>
                        <span className="font-medium">{template.players}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">소요시간:</span>
                        <span className="font-medium">{template.duration}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

            ))}
          </div>

          {filteredTemplates.length > 0 && (
            <div className="flex justify-center mt-4">
              <p className="text-sm text-muted-foreground">
                페이지 {currentPage + 1} / {Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE)}
              </p>
            </div>
          )}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">검색 조건에 맞는 템플릿이 없습니다.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedGenre("all");
                }}
                className="mt-4"
              >
                필터 초기화
              </Button>
            </div>
          )}
        </div>
        
        {/* 템플릿 사용 가이드 */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">템플릿 사용법</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>템플릿 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <p>게임 장르와 플레이어 수, 소요시간을 고려하여 적합한 템플릿을 선택하세요.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>커스터마이징</CardTitle>
              </CardHeader>
              <CardContent>
                <p>선택한 템플릿을 기반으로 자신만의 스토리와 설정을 추가하여 게임을 진행하세요.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 게임 정보 모달 */}
      {selectedTemplate && !showCharacterCreation && (
        <GameInfo
          gameInfo={selectedTemplate}
          onStartGame={handleStartGame}
          onBack={handleBack}
        />
      )}

      {/* 캐릭터 생성 모달 */}
      {showCharacterCreation && selectedTemplate && (
        <CharacterCreation
          gameInfo={selectedTemplate}
          onCharacterCreated={handleCharacterCreated}
          onCancel={handleBack}
        />
      )}
    </div>
  );
} 