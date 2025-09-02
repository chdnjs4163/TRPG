// 설정 페이지 - 알림/디스플레이/언어/개인정보/계정 관리
"use client";

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Eye,
  Lock,
  Palette,
  Volume2,
  Globe,
  Shield,
} from "lucide-react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("ko");
  const [privacy, setPrivacy] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <MainNavigation />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">설정</h1>
          <UserNav />
        </div>
        
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 알림 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                알림 설정
              </CardTitle>
              <CardDescription>
                게임 관련 알림과 업데이트 알림을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>게임 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    새로운 게임 초대나 업데이트 알림을 받습니다.
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>소리 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    알림 시 소리를 재생합니다.
                  </p>
                </div>
                <Switch checked={sound} onCheckedChange={setSound} />
              </div>
            </CardContent>
          </Card>

          {/* 디스플레이 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                디스플레이 설정
              </CardTitle>
              <CardDescription>
                테마와 화면 표시 방식을 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>다크 모드</Label>
                  <p className="text-sm text-muted-foreground">
                    어두운 테마를 사용합니다.
                  </p>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
            </CardContent>
          </Card>

          {/* 언어 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                언어 설정
              </CardTitle>
              <CardDescription>
                플랫폼에서 사용할 언어를 선택합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="language">언어</Label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* 개인정보 보호 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                개인정보 보호
              </CardTitle>
              <CardDescription>
                개인정보 보호 및 보안 설정을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>프로필 공개</Label>
                  <p className="text-sm text-muted-foreground">
                    다른 사용자에게 프로필을 공개합니다.
                  </p>
                </div>
                <Switch checked={privacy} onCheckedChange={setPrivacy} />
              </div>
            </CardContent>
          </Card>

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
              <Button variant="outline" className="w-full">
                비밀번호 변경
              </Button>
              <Button variant="outline" className="w-full">
                이메일 변경
              </Button>
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