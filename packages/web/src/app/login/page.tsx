"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// 登录页面（客户端组件）
export default function LoginPage() {
  // 表单状态（避免使用 any）
  // 允许输入邮箱（当前 Supabase 登录仅支持邮箱+密码）
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const router = useRouter();
  const search = useSearchParams();
  const from = search.get("from") || "/stock-analysis";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin", // 确保接收与发送同源 Cookie
        body: JSON.stringify({ identifier, password }),
      });
      const data: { success: boolean; error?: string } = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `登录失败（${res.status}）`);
      }
      // 登录成功，使用完整跳转以确保会话 Cookie 立即对所有组件生效
      window.location.href = from;
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">登录</h1>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">邮箱</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="输入邮箱"
            required
          />
        </div>
        <div>
          <label className="block mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          {loading ? "登录中..." : "登录"}
        </button>
        <p className="text-sm text-gray-600 mt-2">
          还没有账号？<a href="/register" className="underline">去注册</a>
        </p>
        <p className="text-xs text-gray-500">当前使用 Supabase 认证，暂仅支持邮箱+密码登录</p>
      </form>
    </div>
  );
}
