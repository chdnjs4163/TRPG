// 내 프로필 페이지 - 계정/음성/이미지/캐릭터/템플릿 관리
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import {
  Camera,
  Save,
  Trash2,
  Star,
  Volume2,
  ImageIcon,
  UserCircle,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type SectionType = "account" | "voice" | "images" | "characters" | "templates";

export default function ProfilePage() {
  const [email, setEmail] = useState("user@example.com");
  const [username, setUsername] = useState("플레이어1");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [expandedSections, setExpandedSections] = useState<SectionType[]>([
    "account",
  ]);

  // 섹션 토글 함수
  const toggleSection = (section: SectionType) => {
    if (expandedSections.includes(section)) {
      setExpandedSections(expandedSections.filter((s) => s !== section));
    } else {
      setExpandedSections([...expandedSections, section]);
    }
  };

  // 섹션이 확장되었는지 확인하는 함수
  const isSectionExpanded = (section: SectionType) => {
    return expandedSections.includes(section);
  };

  // 샘플 데이터
  const voiceModels = [
    { id: 1, name: "판타지 내레이터", status: "완료", favorite: true },
    { id: 2, name: "우주 함선 AI", status: "완료", favorite: false },
    { id: 3, name: "호러 게임 마스터", status: "처리중", favorite: false },
  ];

  const generatedImages = [
    {
      id: 1,
      name: "용 일러스트",
      url: "https://images.unsplash.com/photo-1577493340887-b7bfff550145?q=80&w=320&h=200&fit=crop",
      favorite: true,
    },
    {
      id: 2,
      name: "우주 배경",
      url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=320&h=200&fit=crop",
      favorite: true,
    },
    {
      id: 3,
      name: "던전 입구",
      url: "https://images.unsplash.com/photo-1604537529428-15bcbeecfe4d?q=80&w=320&h=200&fit=crop",
      favorite: false,
    },
    {
      id: 4,
      name: "마법사 캐릭터",
      url: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=320&h=200&fit=crop",
      favorite: false,
    },
  ];

  const characterProfiles = [
    {
      id: 1,
      name: "엘프 마법사",
      race: "엘프",
      class: "마법사",
      level: 5,
      favorite: true,
      avatar: "imgages/",
    },
    {
      id: 2,
      name: "드워프 전사",
      race: "드워프",
      class: "전사",
      level: 7,
      favorite: false,
      avatar: "images/dwarf.png",
    },
    {
      id: 3,
      name: "인간 도적",
      race: "인간",
      class: "도적",
      level: 4,
      favorite: false,
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=40&h=40&fit=crop",
    },
  ];

  const storyTemplates = [
    {
      id: 1,
      title: "잃어버린 보물 찾기",
      genre: "판타지",
      players: "3-5명",
      favorite: true,
    },
    {
      id: 2,
      title: "우주 정거장의 비밀",
      genre: "SF",
      players: "2-4명",
      favorite: false,
    },
    {
      id: 3,
      title: "저주받은 마을",
      genre: "호러",
      players: "3-6명",
      favorite: false,
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <MainNavigation />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">내 프로필</h1>
          <UserNav />
        </div>
        
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 계정 정보 섹션 */}
          <Card>
            <CardHeader
              className="cursor-pointer flex flex-row items-center justify-between"
              onClick={() => toggleSection("account")}
            >
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>계정 정보</CardTitle>
              </div>
              {isSectionExpanded("account") ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CardHeader>

            {isSectionExpanded("account") && (
              <>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="w-32 h-32">
                        <AvatarImage
                          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=128&h=128&fit=crop"
                          alt="프로필 이미지"
                        />
                        <AvatarFallback>P1</AvatarFallback>
                      </Avatar>
                      <Button
                        size="icon"
                        className="absolute bottom-0 right-0 rounded-full"
                        variant="secondary"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <h3 className="text-xl font-medium">{username}</h3>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="username">닉네임</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="bio">자기소개</Label>
                      <Input id="bio" placeholder="자기소개를 입력하세요" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">이메일 주소</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="current-password">현재 비밀번호</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="new-password">새 비밀번호</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">비밀번호 확인</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">회원 탈퇴</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          정말 탈퇴하시겠습니까?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
                          이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          탈퇴하기
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    저장하기
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>

          {/* 음성 모델 섹션 */}
          <Card>
            <CardHeader
              className="cursor-pointer flex flex-row items-center justify-between"
              onClick={() => toggleSection("voice")}
            >
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                <CardTitle>음성 모델 관리</CardTitle>
              </div>
              {isSectionExpanded("voice") ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CardHeader>

            {isSectionExpanded("voice") && (
              <>
                <CardContent>
                  <CardDescription className="mb-4">
                    생성한 음성 모델을 관리하고 테스트할 수 있습니다.
                  </CardDescription>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {voiceModels.map((model) => (
                        <div
                          key={model.id}
                          className="flex items-center justify-between border p-4 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback
                                className={cn(
                                  model.id === 1
                                    ? "bg-blue-100 text-blue-600"
                                    : model.id === 2
                                    ? "bg-green-100 text-green-600"
                                    : "bg-red-100 text-red-600"
                                )}
                              >
                                <Volume2 className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{model.name}</p>
                              <Badge
                                variant={
                                  model.status === "완료"
                                    ? "outline"
                                    : "secondary"
                                }
                              >
                                {model.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              테스트
                            </Button>
                            <Button
                              size="icon"
                              variant={model.favorite ? "default" : "outline"}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter>
                  <Button className="ml-auto">새 음성 모델 생성</Button>
                </CardFooter>
              </>
            )}
          </Card>

          {/* 이미지 섹션 */}
          <Card>
            <CardHeader
              className="cursor-pointer flex flex-row items-center justify-between"
              onClick={() => toggleSection("images")}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                <CardTitle>이미지 관리</CardTitle>
              </div>
              {isSectionExpanded("images") ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CardHeader>

            {isSectionExpanded("images") && (
              <>
                <CardContent>
                  <CardDescription className="mb-4">
                    생성한 이미지를 관리하고 즐겨찾기에 추가할 수 있습니다.
                  </CardDescription>
                  <ScrollArea className="h-[500px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {generatedImages.map((image) => (
                        <div
                          key={image.id}
                          className="border rounded-lg overflow-hidden"
                        >
                          <div className="relative">
                            <img
                              src={image.url || "/placeholder.svg"}
                              alt={image.name}
                              className="w-full h-40 object-cover"
                            />
                            <Button
                              size="icon"
                              variant={image.favorite ? "default" : "outline"}
                              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="p-3 flex justify-between items-center">
                            <p className="font-medium text-sm">{image.name}</p>
                            <Button size="icon" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter>
                  <Button className="ml-auto">새 이미지 생성</Button>
                </CardFooter>
              </>
            )}
          </Card>

          {/* 캐릭터 프로필 섹션 */}
          <Card>
            <CardHeader
              className="cursor-pointer flex flex-row items-center justify-between"
              onClick={() => toggleSection("characters")}
            >
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                <CardTitle>캐릭터 프로필 관리</CardTitle>
              </div>
              {isSectionExpanded("characters") ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CardHeader>

            {isSectionExpanded("characters") && (
              <>
                <CardContent>
                  <CardDescription className="mb-4">
                    생성한 캐릭터 프로필을 관리하고 수정할 수 있습니다.
                  </CardDescription>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {characterProfiles.map((character) => (
                        <div
                          key={character.id}
                          className="flex items-center justify-between border p-4 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={character.avatar || "/placeholder.svg"}
                                alt={character.name}
                              />
                              <AvatarFallback>
                                {character.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{character.name}</p>
                              <div className="flex gap-2 text-sm text-muted-foreground">
                                <span>{character.race}</span>
                                <span>•</span>
                                <span>{character.class}</span>
                                <span>•</span>
                                <span>레벨 {character.level}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  수정
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>캐릭터 수정</DialogTitle>
                                  <DialogDescription>
                                    캐릭터 정보를 수정합니다.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
                                    <Label htmlFor="edit-name">이름</Label>
                                    <Input
                                      id="edit-name"
                                      defaultValue={character.name}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-race">종족</Label>
                                      <Input
                                        id="edit-race"
                                        defaultValue={character.race}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-class">직업</Label>
                                      <Input
                                        id="edit-class"
                                        defaultValue={character.class}
                                      />
                                    </div>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="edit-level">레벨</Label>
                                    <Input
                                      id="edit-level"
                                      type="number"
                                      defaultValue={character.level}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">취소</Button>
                                  </DialogClose>
                                  <Button>저장</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="icon"
                              variant={
                                character.favorite ? "default" : "outline"
                              }
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter>
                  <Button className="ml-auto">새 캐릭터 생성</Button>
                </CardFooter>
              </>
            )}
          </Card>

          {/* 스토리 템플릿 섹션 */}
          <Card>
            <CardHeader
              className="cursor-pointer flex flex-row items-center justify-between"
              onClick={() => toggleSection("templates")}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>스토리 템플릿 관리</CardTitle>
              </div>
              {isSectionExpanded("templates") ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CardHeader>

            {isSectionExpanded("templates") && (
              <>
                <CardContent>
                  <CardDescription className="mb-4">
                    생성한 스토리 템플릿을 관리하고 수정할 수 있습니다.
                  </CardDescription>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {storyTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="flex items-center justify-between border p-4 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{template.title}</p>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                              <span>{template.genre}</span>
                              <span>•</span>
                              <span>{template.players}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  수정
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>템플릿 수정</DialogTitle>
                                  <DialogDescription>
                                    스토리 템플릿 정보를 수정합니다.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
                                    <Label htmlFor="edit-title">제목</Label>
                                    <Input
                                      id="edit-title"
                                      defaultValue={template.title}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-genre">장르</Label>
                                      <Input
                                        id="edit-genre"
                                        defaultValue={template.genre}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-players">
                                        플레이어
                                      </Label>
                                      <Input
                                        id="edit-players"
                                        defaultValue={template.players}
                                      />
                                    </div>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="edit-description">
                                      설명
                                    </Label>
                                    <Input
                                      id="edit-description"
                                      placeholder="템플릿 설명을 입력하세요"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">취소</Button>
                                  </DialogClose>
                                  <Button>저장</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="icon"
                              variant={
                                template.favorite ? "default" : "outline"
                              }
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter>
                  <Button className="ml-auto">새 템플릿 생성</Button>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

