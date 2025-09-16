// 게임 템플릿 목록' 페이지
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import { GameInfo } from "@/components/game-info";
import CharacterCreation from "@/components/character-creation";
import CreatingCharacters from "@/components/creating_characters";
import { type CharacterProfile } from "@/lib/data";

export default function TemplatesPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [flowStep, setFlowStep] = useState<"list" | "info" | "selection" | "creation">("list");
  const [existingCharacters, setExistingCharacters] = useState<CharacterProfile[]>([]);

  // 🚩 삭제 확인용 상태
  const [dialogState, setDialogState] = useState<{ isOpen: boolean; characterId: number | null }>({
    isOpen: false,
    characterId: null,
  });

  const ITEMS_PER_PAGE = 8;

  // 전체 템플릿 데이터
  const templates = [
    // 판타지 (4개)
    {
      id: 1,
      title: "마법의 숲",
      description: "신비로운 마법의 숲에서 펼쳐지는 모험",
      image: "/images/magical_forest.png",
      genre: "판타지",
      scenario: {
        hook: "고요하던 고대의 숲 중심부에서, 수 세기 동안 잠들어 있던 '세계수'가 희미한 빛을 발하기 시작했습니다.",
        role: "당신은 숲의 기운을 감지할 수 있는 드루이드의 후예로, 이 현상의 의미를 파악해야 합니다.",
        mission: "세계수의 중심으로 여정을 떠나, 숲이 당신에게 무엇을 원하는지 알아내세요.",
      },
      tags: ["#판타지", "#신비", "#탐험", "#정령"],
    },
    {
      id: 2,
      title: "드래곤 퀘스트",
      description: "전설의 드래곤을 찾아 떠나는 위대한 모험",
      image: "/images/dragon-quest.png",
      genre: "판타지",
      scenario: {
        hook: "마을에 나타난 현명한 고룡(古龍)이 예언의 일부를 잃어버렸다며 당신에게 도움을 요청합니다.",
        role: "당신은 용과 대화할 수 있는 순수한 마음을 가진 젊은이로, 용의 잃어버린 기억을 찾아줘야 합니다.",
        mission: "고룡과 함께 단서를 찾아 여행하며, 그가 잊어버린 중요한 예언을 되찾도록 도와주세요.",
      },
      tags: ["#판타지", "#드래곤", "#동화", "#협력"],
    },
    {
      id: 3,
      title: "던전 입구",
      description: "모험의 시작점, 위험한 던전으로 향하는 관문",
      image: "/images/entrance_to_dungeon.png",
      genre: "판타지",
      scenario: {
        hook: "모험가 길드 게시판에 '새롭게 발견된 고대 유적'의 탐사 의뢰가 붙었습니다. 선착순 한 파티.",
        role: "당신은 이제 막 길드에 가입한 신참 모험가로, 명성을 얻기 위해 이 의뢰에 지원했습니다.",
        mission: "유적의 입구 주변을 정찰하고, 내부로 진입하기 위한 안전한 경로를 확보하여 보고하세요.",
      },
      tags: ["#판타지", "#던전", "#초보자용", "#탐험"],
    },
    {
      id: 4,
      title: "판타지 왕국",
      description: "정치와 음모, 모험이 교차하는 왕국의 이야기",
      image: "/images/fantasy-kingdom.png",
      genre: "판타지",
      scenario: {
        hook: "선왕이 후계자를 정하지 못한 채 급서하면서, 왕국은 세 개의 파벌로 나뉘어 내전 직전의 위기에 처했습니다.",
        role: "당신은 어느 파벌에도 속하지 않은 중립 귀족 가문의 자제로, 왕국의 미래를 걱정하고 있습니다.",
        mission: "각 파벌의 지도자들을 만나 협상하고, 암살 위협을 막아내며 왕국이 분열되는 것을 막으세요.",
      },
      tags: ["#판타지", "#정치", "#음모", "#스토리중심"],
    },
    // SF (4개)
    {
      id: 5,
      title: "우주 정거장",
      description: "우주 정거장에서 벌어지는 사건을 해결하는 모험",
      image: "/images/space_adventure.png",
      genre: "SF",
      scenario: {
        hook: "탐사선 '오디세이'호가 미지의 성운에서 조난 신호를 발견했습니다. 하지만 신호는 구조 요청이 아닌, 지적인 패턴을 가진 '초대장'이었습니다.",
        role: "당신은 외계 생물학자이자 통신 전문가로, 이 역사적인 첫 접촉을 담당하게 되었습니다.",
        mission: "신호의 발신지인 고대 정거장에 도킹하여, 그곳에서 당신을 기다리는 존재와 소통하고 그들의 의도를 파악하세요.",
      },
      tags: ["#SF", "#첫접촉", "#탐사", "#외계인"],
    },
    {
      id: 6,
      title: "외계 행성",
      description: "미지의 외계 행성을 탐험하며 새로운 문명과 생명체를 발견",
      image: "/images/planet.png",
      genre: "SF",
      scenario: {
        hook: "수십 년의 항해 끝에, 인류가 정착 가능한 첫 외계 행성 '프로메테우스'에 도착했습니다.",
        role: "당신은 행성 개척팀의 선발대로, 미지의 땅에 첫발을 내딛는 임무를 맡았습니다.",
        mission: "행성의 대기와 자원을 분석하고, 위험한 토착 생물로부터 살아남아 인류를 위한 안전한 정착지를 확보하세요.",
      },
      tags: ["#SF", "#탐사", "#생존", "#개척"],
    },
    {
      id: 7,
      title: "사이버 도시",
      description: "네온이 빛나는 사이버 도시에서 벌어지는 잠입과 수사",
      image: "/images/cyber-city.png",
      genre: "SF",
      scenario: {
        hook: "거대 기업 '옴니코프'의 데이터 서버에서 극비 정보가 도난당했습니다. 범인의 흔적은 사이버 슬럼가에서 끊겼습니다.",
        role: "당신은 의뢰를 받은 해결사(Fixer)로, 어둠 속에서 정보를 추적해야 합니다.",
        mission: "정보 거래상, 해커, 암시장 상인들을 상대로 단서를 모아 도난당한 데이터를 회수하세요.",
      },
      tags: ["#사이버펑크", "#수사", "#잠입", "#도시"],
    },
    {
      id: 8,
      title: "외계인 침공",
      description: "외계 생명체와의 조우 및 전쟁을 다루는 긴장감 넘치는 시나리오",
      image: "/images/alien_invasion.png",
      genre: "SF",
      scenario: {
        hook: "대기권 상공에서 미확인 비행체가 다수 포착되었습니다. 전 세계 통신망이 교란되기 시작합니다.",
        role: "당신은 국제 연합 대응팀의 정예 요원으로, 초기 교전과 대피 작전을 지휘해야 합니다.",
        mission: "핵심 시설을 방어하고 민간인을 대피시키며, 침공 세력의 약점을 찾아 반격의 발판을 만드세요.",
      },
      tags: ["#SF", "#전쟁", "#전술", "#서바이벌"],
    },
  ]

  const genres = ["all", "판타지", "SF", "호러", "모험"];

  // 캐릭터 불러오기
  useEffect(() => {
    const savedCharacters = localStorage.getItem("characters");
    if (savedCharacters) {
      setExistingCharacters(JSON.parse(savedCharacters));
    }
  }, []);

  // 삭제 버튼 → 다이얼로그 열기
  const confirmDeleteCharacter = (characterId: number) => {
    setDialogState({ isOpen: true, characterId });
  };

  // 다이얼로그에서 삭제 확정
  const handleDeleteCharacter = () => {
    if (dialogState.characterId === null) return;
    const updatedCharacters = existingCharacters.filter((c) => c.id !== dialogState.characterId);
    setExistingCharacters(updatedCharacters);
    localStorage.setItem("characters", JSON.stringify(updatedCharacters));
    setDialogState({ isOpen: false, characterId: null });
  };

  // 필터링
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === "all" || template.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  // 페이지 이동
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

  return (
    <>
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

          {/* 검색/장르 필터 */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="템플릿 검색..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {genres.map((genre) => (
                  <Button
                    key={genre}
                    variant={selectedGenre === genre ? "default" : "outline"}
                    onClick={() => {
                      setSelectedGenre(genre);
                      setCurrentPage(0);
                    }}
                    className="capitalize"
                  >
                    {genre === "all" ? "전체" : genre}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* 목록 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">
                {selectedGenre === "all" ? "전체" : selectedGenre} 템플릿 ({filteredTemplates.length}개)
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => changePage("prev")} disabled={currentPage === 0}>
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
                  onClick={() => {
                    setSelectedTemplate(template);
                    setFlowStep("info");
                  }}
                >
                  <CardHeader className="p-0">
                    <div className="relative w-full h-48">
                      <Image src={template.image || "/placeholder.svg"} alt={template.title} fill className="object-cover rounded-t-lg" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2">{template.title}</CardTitle>
                    <CardDescription className="mb-3">{template.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 상세 → 캐릭터 선택 → 캐릭터 생성 플로우 */}
      {flowStep === "info" && selectedTemplate && (
        <GameInfo gameInfo={selectedTemplate} onStartGame={() => setFlowStep("selection")} onBack={() => setFlowStep("list")} />
      )}
      {flowStep === "selection" && (
        <CreatingCharacters
          existingCharacters={existingCharacters}
          onSelectCharacter={(char) => {
            if (!selectedTemplate) return;
            const url = `/game/${selectedTemplate.id}?character=${encodeURIComponent(JSON.stringify(char))}&title=${encodeURIComponent(
              selectedTemplate.title
            )}`;
            router.push(url);
          }}
          onCreateNew={() => setFlowStep("creation")}
          onCancel={() => setFlowStep("info")}
          onDeleteCharacter={confirmDeleteCharacter}
        />
      )}
      {flowStep === "creation" && selectedTemplate && (
        <CharacterCreation
          gameInfo={selectedTemplate}
          onCharacterCreated={(char) => {
            const updated = [...existingCharacters, char];
            setExistingCharacters(updated);
            localStorage.setItem("characters", JSON.stringify(updated));
            const url = `/game/${selectedTemplate.id}?character=${encodeURIComponent(JSON.stringify(char))}&title=${encodeURIComponent(
              selectedTemplate.title
            )}`;
            router.push(url);
          }}
          onCancel={() => setFlowStep("selection")}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={dialogState.isOpen}
        onOpenChange={(isOpen) => setDialogState({ isOpen, characterId: isOpen ? dialogState.characterId : null })}
      >
        <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              이 작업은 되돌릴 수 없습니다. 캐릭터가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600">취소</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={handleDeleteCharacter}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
