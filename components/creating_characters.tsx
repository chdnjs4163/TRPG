"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle } from "lucide-react";
import { type CharacterProfile } from "@/lib/data";

interface CreatingCharactersProps {
  existingCharacters: CharacterProfile[];
  onSelectCharacter: (character: CharacterProfile) => void;
  onCreateNew: () => void;
  onCancel: () => void;
}

export default function CreatingCharacters({
  existingCharacters,
  onSelectCharacter,
  onCreateNew,
  onCancel,
}: CreatingCharactersProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-3xl bg-card p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">캐릭터 선택</h2>
        <ScrollArea className="h-96">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="flex items-center justify-center h-40 cursor-pointer border-dashed border-2 hover:border-primary"
              onClick={onCreateNew}
            >
              <div className="text-center">
                <PlusCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 font-semibold">새 캐릭터 생성</p>
              </div>
            </Card>

            {existingCharacters.map((character) => (
              <Card
                key={character.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => onSelectCharacter(character)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={character.avatar} alt={character.name} />
                    <AvatarFallback>{character.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-lg">{character.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {character.race} {character.class} (Lv.{character.level})
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onCancel}>닫기</Button>
        </div>
      </div>
    </div>
  );
}
