//내 프로필" 페이지 - 사용자가 자신의 계정 정보를 보고, 편집하고, 관리할 수 있는 기능 제공
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Character } from "@/components/Character";
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

  return (

      <div className="flex-1 p-8">
  <div className="flex justify-center items-center mb-6 relative">
    <h1 className="text-3xl font-bold">프로필</h1>
    <div className="absolute right-0">
      <UserNav />
    </div>
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
          <Character/>
        </div>
    </div>
  );
}
         
             
         
         
         
         
         
         
         
         
         
         
         
         
         
         
         
         
         
         
         
         

    
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          

          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          

          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          

          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
     
     


