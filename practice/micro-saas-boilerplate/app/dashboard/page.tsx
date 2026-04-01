'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    setUser(user);
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">仪表盘</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            退出登录
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-4">欢迎回来，{user?.email}</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-primary-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">项目数</h3>
              <p className="text-3xl font-bold text-primary-600">0</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">活跃用户</h3>
              <p className="text-3xl font-bold text-green-600">0</p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">收入</h3>
              <p className="text-3xl font-bold text-purple-600">¥0</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">快速开始</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                创建新项目
              </button>
              <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                查看文档
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
