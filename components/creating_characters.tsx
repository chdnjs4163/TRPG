// 캐릭터 선택' 컴포넌트
// 사용자가 기존 캐릭터를 선택하거나 새 캐릭터를 생성할 수 있는 UI 화면

"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, XCircle } from "lucide-react"; // Import the 'X' icon
import { type CharacterProfile } from "@/lib/data";

// 1. Add 'onDeleteCharacter' to the props interface
interface CreatingCharactersProps {
  existingCharacters: CharacterProfile[];
  onSelectCharacter: (character: CharacterProfile) => void;
  onCreateNew: () => void;
  onCancel: () => void;
  onDeleteCharacter: (characterId: number) => void; 
}

export default function CreatingCharacters({
  existingCharacters,
  onSelectCharacter,
  onCreateNew,
  onCancel,
  onDeleteCharacter, // 2. Accept the new prop
}: CreatingCharactersProps) {
  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">캐릭터 선택</DialogTitle>
          <DialogDescription>
            모험에 참여할 캐릭터를 선택하거나, 새로운 캐릭터를 생성하세요.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-96 my-4 pr-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Character Card */}
            <Card
              className="flex items-center justify-center h-full p-6 cursor-pointer border-dashed border-2 hover:border-primary hover:text-primary transition-colors"
              onClick={onCreateNew}
            >
              <div className="text-center">
                <PlusCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 font-semibold">새 캐릭터 생성</p>
              </div>
            </Card>

            {/* Existing Characters List */}
            {existingCharacters.map((character) => (
              <Card
                key={character.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors relative group"
                onClick={() => onSelectCharacter(character)}
              >
                {/* 3. Add the delete button UI */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents the whole card from being clicked
                    onDeleteCharacter(character.id); // Call the delete function
                  }}
                >
                  <XCircle className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                </Button>

                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={character.avatar} alt={character.name} />
                    <AvatarFallback>{character.name.charAt(0)}</AvatarFallback>
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
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}