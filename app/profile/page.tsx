// "내 프로필" 페이지 - 사용자가 자신의 계정 정보를 확인하고 수정할 수 있는 화면
"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MainNavigation } from "@/components/main-navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserNav } from "@/components/user-nav";
import { Camera, Save, Trash2, Settings, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
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
import { API_BASE_URL } from "@/app/config";

type SectionType = "account";

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [originalNickname, setOriginalNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [expandedSections, setExpandedSections] = useState<SectionType[]>(["account"]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nicknameStatus, setNicknameStatus] = useState<"idle" | "available" | "duplicate">(
    "idle"
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error("사용자 정보를 불러오지 못했습니다.");
        }
        const data = await response.json();
        setEmail(data.email ?? "");
        if (typeof window !== "undefined") {
          if (data.email) {
            localStorage.setItem("email", data.email);
          } else {
            localStorage.removeItem("email");
          }
        }
        setUsername(data.username ?? "");
        const initialNickname = data.nickname ?? data.username ?? "";
        setNickname(initialNickname);
        setOriginalNickname(initialNickname);
        const initialAvatar = data.avatarUrl ?? "";
        setAvatarUrl(initialAvatar);
        if (typeof window !== "undefined") {
          const trimmedAvatar = initialAvatar?.trim() ?? "";
          if (trimmedAvatar.length > 0) {
            localStorage.setItem("avatarUrl", trimmedAvatar);
          } else {
            localStorage.removeItem("avatarUrl");
          }
          window.dispatchEvent(new CustomEvent("trpg-avatar-updated", { detail: trimmedAvatar }));
        }
        setBio(data.bio ?? "");
      } catch (err) {
        console.error(err);
        setErrorMessage("프로필 정보를 불러오는 데 실패했습니다.");
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const toggleSection = (section: SectionType) => {
    if (expandedSections.includes(section)) {
      setExpandedSections(expandedSections.filter((s) => s !== section));
    } else {
      setExpandedSections([...expandedSections, section]);
    }
  };

  const handleNicknameCheck = async () => {
    if (!nickname.trim()) {
      setErrorMessage("닉네임을 입력해주세요.");
      setNicknameStatus("idle");
      return;
    }

    if (!token) return;

    try {
      setIsCheckingNickname(true);
      setStatusMessage(null);
      setErrorMessage(null);
      const response = await fetch(`${API_BASE_URL}/api/auth/check-nickname`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "닉네임 확인 실패");
      }
      setNicknameStatus(result.available ? "available" : "duplicate");
    } catch (error: any) {
      setErrorMessage(error.message || "닉네임 확인 중 오류가 발생했습니다.");
      setNicknameStatus("idle");
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!token) {
      setErrorMessage("로그인이 필요합니다.");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setStatusMessage(null);
    setErrorMessage(null);
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(`${API_BASE_URL}/api/auth/profile/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "프로필 이미지 업로드에 실패했습니다.");
      }

      const uploadedUrl = typeof result?.avatarUrl === "string" ? result.avatarUrl : "";
      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl);
      }
      if (typeof window !== "undefined") {
        const trimmed = uploadedUrl.trim();
        if (trimmed.length > 0) {
          localStorage.setItem("avatarUrl", trimmed);
        } else {
          localStorage.removeItem("avatarUrl");
        }
        window.dispatchEvent(new CustomEvent("trpg-avatar-updated", { detail: trimmed }));
      }
      setStatusMessage("프로필 이미지가 업로드되었습니다. 저장을 완료해주세요.");
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "프로필 이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingAvatar(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const triggerAvatarFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleProfileSave = async () => {
    if (!token) return;
    setStatusMessage(null);
    setErrorMessage(null);

    if (!nickname.trim()) {
      setErrorMessage("닉네임을 입력해주세요.");
      return;
    }

    try {
      setIsSavingProfile(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nickname: nickname.trim(),
          avatarUrl: avatarUrl.trim() || null,
          bio: bio.trim() || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "프로필 저장에 실패했습니다.");
      }
      setStatusMessage("프로필이 저장되었습니다.");
      setNicknameStatus("idle");
      const trimmedNickname = nickname.trim();
      setOriginalNickname(trimmedNickname);
      if (typeof window !== "undefined") {
        const trimmedAvatar = avatarUrl.trim();
        if (trimmedAvatar.length > 0) {
          localStorage.setItem("avatarUrl", trimmedAvatar);
        } else {
          localStorage.removeItem("avatarUrl");
        }
        window.dispatchEvent(new CustomEvent("trpg-avatar-updated", { detail: trimmedAvatar }));
      }
    } catch (error: any) {
      setErrorMessage(error.message || "프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const isNicknameChanged = nickname.trim().length > 0 && nickname.trim() !== originalNickname.trim();

  return (
    <div className="flex min-h-screen bg-background">
      <MainNavigation />
      <div className="flex-1 p-8">
        <div className="flex justify-center items-center mb-6 relative">
          <h1 className="text-3xl font-bold">프로필</h1>
          <div className="absolute right-0">
            <UserNav userAvatar={avatarUrl} />
          </div>
        </div>
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
          <CardHeader
            className="cursor-pointer flex flex-row items-center justify-between"
            onClick={() => toggleSection("account")}
          >
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>계정 정보</CardTitle>
            </div>
            {expandedSections.includes("account") ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </CardHeader>

          {expandedSections.includes("account") && (
            <>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                    <Avatar className="w-32 h-32">
                      <AvatarImage
                        src={
                          avatarUrl ||
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=128&h=128&fit=crop"
                        }
                        alt="프로필 이미지"
                      />
                      <AvatarFallback>{nickname?.[0] || username?.[0] || "P"}</AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 rounded-full"
                      variant="secondary"
                      onClick={triggerAvatarFileDialog}
                      disabled={isUploadingAvatar}
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      <span className="sr-only">프로필 이미지 업로드</span>
                    </Button>
                  </div>
                  <h3 className="text-xl font-medium">{nickname || username}</h3>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">사용자 이름</Label>
                    <Input id="username" value={username} disabled />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">이메일 주소</Label>
                    <Input id="email" type="email" value={email} disabled />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="nickname">닉네임</Label>
                    <div className="flex gap-2">
                      <Input
                        id="nickname"
                        value={nickname}
                        onChange={(e) => {
                          setNickname(e.target.value);
                          setNicknameStatus("idle");
                          setStatusMessage(null);
                          setErrorMessage(null);
                        }}
                        placeholder="닉네임을 입력하세요"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleNicknameCheck}
                        disabled={isCheckingNickname || !isNicknameChanged}
                      >
                        {isCheckingNickname ? "확인 중" : "중복 확인"}
                      </Button>
                    </div>
                    {nicknameStatus === "available" && (
                      <p className="text-xs text-emerald-600">사용 가능한 닉네임입니다.</p>
                    )}
                    {nicknameStatus === "duplicate" && (
                      <p className="text-xs text-destructive">이미 사용 중인 닉네임입니다.</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="avatar-url">프로필 이미지 URL (선택)</Label>
                    <Input
                      id="avatar-url"
                      value={avatarUrl}
                      onChange={(e) => { setAvatarUrl(e.target.value); setStatusMessage(null); setErrorMessage(null); }}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bio">자기소개</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => { setBio(e.target.value); setStatusMessage(null); setErrorMessage(null); }}
                      placeholder="자기소개를 입력하세요"
                      rows={4}
                    />
                  </div>
                </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        회원 탈퇴
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
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

                  <div className="flex flex-col items-end gap-2">
                    {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
                    {statusMessage && !errorMessage && (
                      <p className="text-sm text-emerald-600">{statusMessage}</p>
                    )}
                    <Button onClick={handleProfileSave} disabled={isSavingProfile}>
                      <Save className="mr-2 h-4 w-4" />
                      {isSavingProfile ? "저장 중..." : "저장하기"}
                    </Button>
                  </div>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
