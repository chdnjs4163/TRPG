// 주사위 롤러 - 다양한 면체 주사위 굴림 기능
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Dice5 } from "lucide-react"

export function DiceRoller() {
  const [result, setResult] = useState<number | null>(null)
  const [diceType, setDiceType] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)

  const rollDice = (sides: number) => {
    setDiceType(sides)
    setRolling(true)

    // 주사위 굴리는 애니메이션 효과
    const rollInterval = setInterval(() => {
      setResult(Math.floor(Math.random() * sides) + 1)
    }, 50)

    setTimeout(() => {
      clearInterval(rollInterval)
      setResult(Math.floor(Math.random() * sides) + 1)
      setRolling(false)
    }, 1000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Dice5 className="h-4 w-4 mr-2" />
          주사위
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>주사위 굴리기</DialogTitle>
          <DialogDescription>원하는 주사위를 선택하여 굴려보세요.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          <Button onClick={() => rollDice(4)} variant="outline" className="h-16">
            D4
          </Button>
          <Button onClick={() => rollDice(6)} variant="outline" className="h-16">
            D6
          </Button>
          <Button onClick={() => rollDice(8)} variant="outline" className="h-16">
            D8
          </Button>
          <Button onClick={() => rollDice(10)} variant="outline" className="h-16">
            D10
          </Button>
          <Button onClick={() => rollDice(12)} variant="outline" className="h-16">
            D12
          </Button>
          <Button onClick={() => rollDice(20)} variant="outline" className="h-16">
            D20
          </Button>
          <Button onClick={() => rollDice(100)} variant="outline" className="h-16 col-span-3">
            D100
          </Button>
        </div>

        {diceType && (
          <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">
              {rolling ? "주사위 굴리는 중..." : `D${diceType} 결과`}
            </div>
            <div className={`text-4xl font-bold ${rolling ? "animate-pulse" : ""}`}>{result}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
