export type GameSummary = {
  title: string;
  image: string;
  description: string;
  genre: "판타지" | "모험" | "SF" | "호러";
  date?: string;
};

export type TemplateInfo = {
  id: number;
  title: string;
  description: string;
  genre: "판타지" | "모험" | "SF" | "호러";
  players?: string;
  duration?: string;
  image: string;
  rating: number;
  difficulty?: "easy" | "medium" | "hard";
  estimatedTime?: string;
  maxPlayers?: number;
  setting?: string;
  recommendedLevel?: string;
  features?: string[];
  scenario?: { hook?: string; role?: string; mission?: string };
  tags?: string[];
  platformFeatures?: string[];
};

export const gamesByGenre: Record<"판타지" | "모험" | "SF" | "호러", GameSummary[]> = {
  판타지: [
    { title: "마법의 숲", image: "/images/magical_forest.png", description: "신비로운 마법의 숲에서 펼쳐지는 모험.", genre: "판타지" },
    { title: "드래곤 퀘스트", image: "/images/dragon-quest.png", description: "전설의 드래곤을 찾아 떠나는 위대한 모험.", genre: "판타지" },
    { title: "던전 입구", image: "/images/entrance_to_dungeon.png", description: "고대 던전으로 향하는 위험한 첫걸음.", genre: "판타지" },
    { title: "판타지 왕국", image: "/images/fantasy-kingdom.png", description: "왕국의 음모와 모험.", genre: "판타지" },
  ],
  모험: [
    { title: "잃어버린 보물", image: "/images/Pirate_Ship_Adventure.png", description: "전설의 보물을 찾아 바다로.", genre: "모험" },
    { title: "해적선", image: "/images/pirate_Ship.png", description: "해적선의 선원이 되어 바다를 누벼라.", genre: "모험" },
    { title: "던전 탐험", image: "/images/DungeonExploration.png", description: "고대 던전을 누비며 몬스터와 보물을 마주하는 클래식 모험.", genre: "모험" },
    { title: "던전 마스터", image: "/images/dungeon_master.png", description: "던전을 설계하고 공략하라.", genre: "모험" },
  ],
  SF: [
    { title: "우주 정거장", image: "/images/space_adventure.png", description: "우주 정거장에서 벌어지는 사건.", genre: "SF" },
    { title: "외계 행성", image: "/images/spae.png", description: "미지의 행성 탐사.", genre: "SF" },
    { title: "사이버 도시", image: "/images/cyber-city.png", description: "사이버펑크 미래 도시.", genre: "SF" },
    { title: "외계인 침공", image: "/images/alien_invasion.png", description: "지구 방어 작전.", genre: "SF" },
    
  ],
  호러: [
    { title: "유령의 저택", image: "/images/ghost_mansion.png", description: "저주받은 저택의 공포.", genre: "호러" },
    { title: "유령의 숲", image: "/images/forestghost.png", description: "어둠 깃든 숲의 생존.", genre: "호러" },
    { title: "유령늑대와 전투", image: "/images/wefl.png", description: "유령빛 늑대 무리와의 사투.", genre: "호러" },
    { title: "심해속에서 유령과 전투", image: "/images/deep-seaghost.png", description: "칠흑 같은 심해의 공포.", genre: "호러" },
  ],
};

// 템플릿 정의 (기존 templates/page.tsx 의 데이터 동일)
export const templates: TemplateInfo[] = [
  {
    id: 1,
    title: "던전 마스터",
    description: "던전 탐험을 위한 템플릿",
    genre: "판타지",
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
      mission: "던전 심층으로 진입해 봉인의 붕괴 원인을 밝혀내고, 다시 봉인하거나 위협을 제거하세요.",
    },
    tags: ["#판타지", "#탐험", "#퍼즐", "#중급자용", "#스토리중심"],
    platformFeatures: ["AI 게임마스터", "실시간 채팅", "다이스 롤러", "캐릭터 관리", "맵 시스템"],
  },
  // ... (나머지 템플릿들은 기존 templates/page.tsx 와 동일하게 옮김)
];


