import { MainNavigation } from "@/components/main-navigation"
import { UserNav } from "@/components/user-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dice5, Users, BookOpen, MessageSquare } from "lucide-react"

export default function TRPGGuidePage() {
  return (
    <div className="flex min-h-screen bg-background">
      <MainNavigation />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">TRPG 가이드</h1>
          <UserNav />
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="basics">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basics" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                기본 개념
              </TabsTrigger>
              <TabsTrigger value="dice" className="flex items-center gap-2">
                <Dice5 className="h-4 w-4" />
                주사위 시스템
              </TabsTrigger>
              <TabsTrigger value="characters" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                캐릭터 생성
              </TabsTrigger>
              <TabsTrigger value="gameplay" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                게임 진행
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="basics" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>TRPG란 무엇인가요?</CardTitle>
                  <CardDescription>테이블탑 롤플레잉 게임의 기본 개념</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    테이블탑 롤플레잉 게임(TRPG)은 참가자들이 가상의 캐릭터를 연기하며 이야기를 만들어가는 협력적인 스토리텔링 게임입니다.
                    게임 마스터(GM)가 세계관과 상황을 설명하고, 플레이어들은 그 세계 속에서 자신의 캐릭터로 행동합니다.
                  </p>
                  <p>
                    TRPG의 핵심 요소:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>스토리텔링</strong> - GM과 플레이어들이 함께 이야기를 만들어갑니다.
                    </li>
                    <li>
                      <strong>롤플레잉</strong> - 플레이어들은 자신의 캐릭터가 되어 연기합니다.
                    </li>
                    <li>
                      <strong>주사위 시스템</strong> - 행동의 성공 여부를 결정하기 위해 주사위를 사용합니다.
                    </li>
                    <li>
                      <strong>규칙</strong> - 게임 진행을 위한 기본 규칙이 있습니다.
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>TRPG의 역사</CardTitle>
                  <CardDescription>테이블탑 롤플레잉 게임의 발전 과정</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    TRPG는 1974년 게리 가이각스(Gary Gygax)와 데이브 아네슨(Dave Arneson)이 만든 던전스 앤 드래곤스(Dungeons & Dragons)에서 시작되었습니다.
                    이후 다양한 장르와 규칙 시스템을 가진 TRPG가 개발되었으며, 오늘날에는 온라인 플랫폼을 통해 더 많은 사람들이 즐길 수 있게 되었습니다.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="dice" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>주사위 시스템</CardTitle>
                  <CardDescription>TRPG에서 사용되는 주사위와 판정 방식</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    TRPG에서는 다양한 면체의 주사위를 사용하여 행동의 성공 여부를 결정합니다.
                    일반적으로 D4, D6, D8, D10, D12, D20, D100 등의 주사위가 사용됩니다.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">주사위 표기법</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>D4: 4면체 주사위</li>
                        <li>D6: 6면체 주사위</li>
                        <li>D8: 8면체 주사위</li>
                        <li>D10: 10면체 주사위</li>
                        <li>D12: 12면체 주사위</li>
                        <li>D20: 20면체 주사위</li>
                        <li>D100: 백면체 주사위</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* 나머지 TabsContent (characters, gameplay 등)도 여기에 추가하면 됩니다. */}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
