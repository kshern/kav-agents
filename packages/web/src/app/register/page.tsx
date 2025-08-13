"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
// 页面布局切换为 module.scss + classnames/bind
import classnames from 'classnames/bind';
import styles from './index.module.scss';
const cn = classnames.bind(styles);

// 注册页面（客户端组件）
export default function RegisterPage() {
  // 表单状态（避免使用 any）
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [info, setInfo] = useState<string>("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin", // 确保接收服务端设置的会话 Cookie
        body: JSON.stringify({ email, password, name }),
      });
      const data: { success: boolean; error?: string; pendingVerification?: boolean; message?: string } = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `注册失败（${res.status}）`);
      }
      if (data.pendingVerification) {
        // 若开启邮箱验证，提示用户去邮箱完成验证
        setInfo(data.message || "注册成功，请前往邮箱完成验证");
        return;
      }
      // 注册成功并已登录，使用完整跳转，确保 Cookie 立即生效
      window.location.href = "/stock-analysis";
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    // 页面级容器使用 SCSS 模块管理，保持内部表单的 Tailwind 不变
    <div className={cn('container')}>
      <h1 className="text-2xl font-semibold mb-4">注册</h1>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      {info && <p className="text-green-600 mb-3">{info}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">昵称（可选）</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="可设置昵称，将保存到 Supabase user_metadata"
          />
        </div>
        <div>
          <label className="block mb-1">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
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
          {loading ? "注册中..." : "注册"}
        </button>
        <p className="text-sm text-gray-600 mt-2">
          已有账号？<a href="/login" className="underline">去登录</a>
        </p>
        <p className="text-xs text-gray-500">当前使用 Supabase 认证，注册可能需要邮箱验证</p>
      </form>
    </div>
  );
}
