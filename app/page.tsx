// 루트 페이지 - 로그인 상태 확인 후 적절한 페이지로 리디렉션
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 로그인 상태 확인
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
      router.push("/login");
    } else {
      // 로그인된 경우 대시보드로 리다이렉트
      router.push("/dashboard");
    }
  }, [router]);

  return null;
}
