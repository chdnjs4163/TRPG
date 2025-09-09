// 캐릭터 관리 페이지 

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronUp,
  UserCircle,
  Trash2,
  Star,
} from "lucide-react";

// 캐릭터 데이터 타입을 정의합니다.
interface CharacterProfile {
  id: number;
  name: string;
  race: string;
  class: string;
  level: number;
  avatar: string;
  favorite: boolean;
}

// 샘플 캐릭터 데이터
const sampleCharacterProfiles: CharacterProfile[] = [
  {
    id: 1,
    name: "아라곤",
    race: "인간",
    class: "레인저",
    level: 5,
    avatar: "/avatars/aragon.png",
    favorite: true,
  },
  {
    id: 2,
    name: "레골라스",
    race: "엘프",
    class: "궁수",
    level: 5,
    avatar: "/avatars/legolas.png",
    favorite: false,
  },
];

// [수정] 함수 이름을 'Character'로 변경
export function Character() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [characters, setCharacters] = useState(sampleCharacterProfiles);

  // 캐릭터 삭제 함수
  const handleDeleteCharacter = (id: number) => {
    setCharacters(characters.filter((char) => char.id !== id));
  };

  // 즐겨찾기 토글 함수
  const handleToggleFavorite = (id: number) => {
    setCharacters(
      characters.map((char) =>
        char.id === id ? { ...char, favorite: !char.favorite } : char
      )
    );
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          {/* [수정] CardTitle을 '내 캐릭터 관리'로 명확하게 변경 */}
          <CardTitle>캐릭터 관리</CardTitle>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </CardHeader>
      {isExpanded && (
        <>
          <CardContent>
            <CardDescription className="mb-4">
              생성한 캐릭터 프로필을 관리하고 수정할 수 있습니다.
            </CardDescription>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {characters.map((character) => (
                  <div
                    key={character.id}
                    className="flex items-center justify-between border p-3 rounded-lg"
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
                          <Button size="sm" variant="outline">수정</Button>
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
                              <Input id="edit-name" defaultValue={character.name} />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-race">종족</Label>
                                  <Input id="edit-race" defaultValue={character.race} />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-class">직업</Label>
                                  <Input id="edit-class" defaultValue={character.class} />
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-level">레벨</Label>
                                <Input id="edit-level" type="number" defaultValue={character.level} />
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
                        variant={character.favorite ? "default" : "outline"}
                        onClick={() => handleToggleFavorite(character.id)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="icon" variant="outline">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
                                <AlertDialogDescription>이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCharacter(character.id)}>삭제</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
  );
}