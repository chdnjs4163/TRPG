"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function ResetPasswordPage() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [message, setMessage] = useState("");
    const [tempPassword, setTempPassword] = useState("");

    const sendCode = async () => {
        setMessage("");
        try {
            const res = await fetch(process.env.NEXT_PUBLIC_API_BASE + "/api/auth/send-email-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                setStep(2);
            } else setMessage(data.error || "실패");
        } catch {
            setMessage("서버 오류 발생");
        }
    };

    const verifyCode = async () => {
        setMessage("");
        try {
            const res = await fetch(process.env.NEXT_PUBLIC_API_BASE + "/api/auth/verify-email-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage("인증 성공! 임시 비밀번호를 발급합니다.");
                const pwRes = await fetch(process.env.NEXT_PUBLIC_API_BASE + "/api/auth/reset-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });
                const pwData = await pwRes.json();
                if (pwRes.ok) {
                    setTempPassword(pwData.tempPassword);
                    setStep(3);
                } else setMessage(pwData.error || "임시 비밀번호 발급 실패");
            } else setMessage(data.error || "인증 실패");
        } catch {
            setMessage("서버 오류 발생");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">비밀번호 찾기</CardTitle>
                    <CardDescription>이메일 인증 후 임시 비밀번호를 발급받습니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 1 && (
                        <>
                            <Label htmlFor="email">이메일</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <Button onClick={sendCode} className="w-full">인증코드 보내기</Button>
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <Label htmlFor="code">인증코드</Label>
                            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} />
                            <Button onClick={verifyCode} className="w-full">인증 확인</Button>
                        </>
                    )}
                    {step === 3 && (
                        <div className="text-center">
                            <p className="font-semibold">임시 비밀번호</p>
                            <p className="text-lg">{tempPassword}</p>
                            <p className="text-sm mt-2">
                                로그인 후 마이페이지에서 비밀번호를 변경하세요.
                            </p>
                            <div className="mt-4">
                                <Link href="/login" className="underline text-blue-600">로그인으로 이동</Link>
                            </div>
                        </div>
                    )}
                    {message && <p className="text-center text-sm">{message}</p>}
                </CardContent>
            </Card>
        </div>
    );
}
