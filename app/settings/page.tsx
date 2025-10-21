// 설정 페이지 - 알림/디스플레이/언어/개인정보/계정 관리
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import { API_BASE_URL } from "@/app/config";
import { Separator } from "@/components/ui/separator";
import { Lock } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);


  const handlePasswordSave = async () => {
    setPasswordStatus(null);
    setPasswordError(null);

    if (!token) {
      setPasswordError("로그인 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("모든 비밀번호 필드를 입력해주세요.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: currentPassword,
          newPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "비밀번호 변경에 실패했습니다.");
      }
      setPasswordStatus("비밀번호가 성공적으로 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setPasswordError(error.message || "비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };


  return (
    <div className="flex min-h-screen bg-background">
      <MainNavigation />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">설정</h1>
          <UserNav />
        </div>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 계정 관리 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                계정 관리
              </CardTitle>
              <CardDescription>
                계정 보안 및 관리 옵션입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">현재 비밀번호</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setPasswordStatus(null); setPasswordError(null); }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">새 비밀번호</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordStatus(null); setPasswordError(null); }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">비밀번호 확인</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordStatus(null); setPasswordError(null); }}
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
                {passwordStatus && !passwordError && (
                  <p className="text-sm text-emerald-600">{passwordStatus}</p>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handlePasswordSave}
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? "변경 중..." : "비밀번호 변경"}
                </Button>
              </div>
              <Separator />
              <Button variant="destructive" className="w-full">
                계정 삭제
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
