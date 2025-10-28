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
import { GameInfo } from "@/components/game-info";
import CharacterCreation from "@/components/character-creation";
import CreatingCharacters from "@/components/creating_characters";
import { type CharacterProfile } from "@/lib/data";
import { API_BASE_URL } from "@/app/config";

const parseScenario = (raw: unknown): Record<string, unknown> | undefined => {
  if (!raw) return undefined;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const normalizeTemplate = (template: any) => {
  if (!template || typeof template !== "object") return template;
  const scenario =
    template.scenario ??
    parseScenario(template.scenario_json) ??
    parseScenario(template.scenarioJson);
  return {
    ...template,
    scenario,
  };
};

export default function TemplatesPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [flowStep, setFlowStep] = useState<"list" | "info" | "selection" | "creation">("list");
  const [existingCharacters, setExistingCharacters] = useState<CharacterProfile[]>([]);

  // 🚩 삭제 확인용 상태
  const [dialogState, setDialogState] = useState<{ isOpen: boolean; characterId: CharacterProfile["id"] | null }>({
    isOpen: false,
    characterId: null,
  });

  const ITEMS_PER_PAGE = 8;

  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetch(`${API_BASE_URL}/api/game_titles?limit=100`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((result) => {
        const raw = result?.data || result || [];
        const normalized = Array.isArray(raw) ? raw.map(normalizeTemplate) : [];
        setTemplates(normalized);
      })
      .catch((e) => console.error('템플릿 불러오기 실패:', e));
  }, []);

  const genres = ["all", "판타지", "SF", "호러", "모험"];

  // 캐릭터 불러오기
  useEffect(() => {
    const savedCharacters = localStorage.getItem("characters");
    if (savedCharacters) {
      setExistingCharacters(JSON.parse(savedCharacters));
    }
  }, []);

  // 삭제 버튼 → 다이얼로그 열기
  const confirmDeleteCharacter = (characterId: CharacterProfile["id"]) => {
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
      (template.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === "all" || (template.theme || template.genre) === selectedGenre;
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
