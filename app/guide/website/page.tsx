// 웹사이트 사용 가이드 페이지 - 플랫폼 기능과 사용법 안내
"use client";

import { MainNavigation } from "@/components/main-navigation";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Gamepad2, 
  Users, 
  BookOpen, 
  MessageSquare, 
  
  Settings,

  User,
  Palette
} from "lucide-react";

export default function WebsiteGuidePage() {
  return (
    <div className="flex min-h-screen bg-background">
      <MainNavigation />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">웹사이트 사용법</h1>
          <UserNav />
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                개요
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                주요 기능
              </TabsTrigger>
              <TabsTrigger value="navigation" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                네비게이션
              </TabsTrigger>
              <TabsTrigger value="tips" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                사용 팁
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>TRPG 플랫폼 소개</CardTitle>
                  <CardDescription>온라인 TRPG 게임을 위한 종합 플랫폼</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    TRPG 플랫폼은 테이블탑 롤플레잉 게임을 온라인에서 즐길 수 있는 서비스입니다. 
                    다양한 기능을 통해 게임 마스터와 플레이어들이 쉽게 게임을 진행할 수 있습니다.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">플랫폼의 장점</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>AI와 즐겁게 솔로플레이 가능</li>
                        <li>AI 게임 마스터 지원</li>
                        <li>다양한 게임 템플릿 제공</li>
                        <li>선택에 따라 실시간으로 변하는 스토리</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">지원하는 게임 장르</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>판타지</li>
                        <li>SF</li>
                        <li>호러</li>
                        <li>모험</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="features" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>주요 기능</CardTitle>
                  <CardDescription>플랫폼에서 제공하는 핵심 기능들</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Gamepad2 className="h-5 w-5 mt-1 text-blue-600" />
                        <div>
                          <h4 className="font-medium">게임 세션</h4>
                          <p className="text-sm text-muted-foreground">
                            실시간으로 게임을 진행할 수 있는 가상 테이블
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 mt-1 text-green-600" />
                        <div>
                          <h4 className="font-medium">캐릭터 관리</h4>
                          <p className="text-sm text-muted-foreground">
                            캐릭터 생성 및 관리 기능
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MessageSquare className="h-5 w-5 mt-1 text-purple-600" />
                        <div>
                          <h4 className="font-medium">AI 게임 마스터</h4>
                          <p className="text-sm text-muted-foreground">
                            AI를 활용한 게임 진행 지원
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        
                      </div>
                      <div className="flex items-start gap-3">
                        <Settings className="h-5 w-5 mt-1 text-orange-600" />
                        <div>
                          <h4 className="font-medium">설정 관리</h4>
                          <p className="text-sm text-muted-foreground">
                            개인 설정 및 환경 설정
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 mt-1 text-indigo-600" />
                        <div>
                          <h4 className="font-medium">프로필 관리</h4>
                          <p className="text-sm text-muted-foreground">
                            사용자 프로필 및 계정 관리
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="navigation" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>네비게이션 가이드</CardTitle>
                  <CardDescription>플랫폼 사용을 위한 네비게이션 방법</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">왼쪽 사이드바</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>홈</strong> - 메인 대시보드로 돌아가기</li>
                        <li><strong>최근 플레이</strong> - 최근 플레이한 게임 목록</li>
                        <li><strong>템플릿</strong> - 게임 템플릿 모음</li>
                        <li><strong>프롬프트</strong> - 게임 프롬프트 모음</li>
                        
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">카테고리</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>판타지</strong> - 판타지 장르 게임</li>
                        <li><strong>SF</strong> - 과학소설 장르 게임</li>
                        <li><strong>호러</strong> - 공포 장르 게임</li>
                        <li><strong>모험</strong> - 모험 장르 게임</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">가이드</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>TRPG 가이드</strong> - TRPG 기본 개념과 규칙</li>
                        <li><strong>웹사이트 사용법</strong> - 플랫폼 사용 가이드</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tips" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>사용 팁</CardTitle>
                  <CardDescription>플랫폼을 더 효율적으로 사용하는 방법</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">게임 시작 전</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>게임 템플릿을 미리 확인하세요</li>
                        <li>캐릭터를 미리 생성해두세요</li>
                        <li>게임 규칙을 숙지하세요</li>

                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">게임 진행 중</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>AI 게임 마스터를 적극 활용하세요</li>
                        <li>AI 게임 마스터와 적극적으로 소통하세요</li>
                        <li>규칙에 대해 질문이 있으면 언제든 물어보세요</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">💡 프로 팁</h4>
                    <p className="text-blue-800 text-sm">
                      AI 게임 마스터와 대화하여 게임 아이디어를 얻거나 규칙에 대해 질문해보세요. 
                      더욱 풍부하고 재미있는 게임 경험을 만들 수 있습니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 