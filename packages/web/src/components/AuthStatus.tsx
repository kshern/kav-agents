"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface PublicUser {
  id: string;
  email: string;
  name?: string;
}

// 全局登录状态组件：显示用户信息与登录/注册/退出操作
export default function AuthStatus() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  // 监听路由变化以刷新登录状态（布局持久化时组件不会卸载）
  const pathname = usePathname();

  const load = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data: { success: boolean; data: PublicUser | null } = await res.json();
      setUser(data.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // 路由变化时重新拉取一次用户信息，确保注册/登录后立刻更新导航显示
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      // 刷新当前页面状态
      window.location.reload();
    } catch {}
  };

  if (loading) return <div className="text-sm text-gray-600">加载中...</div>;

  if (!user)
    return (
      <div className="flex items-center gap-3 text-sm">
        <a href="/login" className="underline">
          登录
        </a>
        <a href="/register" className="underline">
          注册
        </a>
      </div>
    );

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-700">你好，{user.name || user.email}</span>
      <button onClick={logout} className="underline">
        退出
      </button>
    </div>
  );
}
