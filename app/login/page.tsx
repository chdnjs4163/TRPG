// 로그인 페이지
"use client";
import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_BASE + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {

        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId); // 👈 반드시 저장
        window.location.href = "/";
      } else {
        setMessage(data.error || "로그인 실패");
      }
    } catch (err) {
      setMessage("서버 오류 발생");
    }
  };

  return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold">TRPG 플랫폼 로그인</CardTitle>
            <CardDescription>계정에 로그인하여 모험을 계속하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full text-lg py-3">로그인</Button>
              {message && <p className="text-center text-sm text-red-500">{message}</p>}
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm">
              계정이 없으신가요? <Link href="/register" className="text-blue-600 underline">회원가입</Link>
            </div>
            <div className="text-center text-sm">
              <Link href="/reset-password" className="text-blue-600 underline">비밀번호를 잊으셨나요?</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
  );
}
