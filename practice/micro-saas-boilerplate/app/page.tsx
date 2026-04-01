import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Micro-SaaS Boilerplate
            <span className="text-primary-600"> ⚡</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            一个生产级的 Micro-SaaS 启动模板，包含 Next.js + Tailwind + Supabase 全栈配置
          </p>
          
          <div className="flex gap-4 justify-center mb-12">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              进入仪表盘
            </Link>
            <Link
              href="https://github.com/AIPMAndy/harness-engineering-bible"
              target="_blank"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              查看文档
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-lg font-semibold mb-2">快速启动</h3>
              <p className="text-gray-600">
                5 分钟完成配置，立即开始开发
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold mb-2">用户认证</h3>
              <p className="text-gray-600">
                内置 Supabase Auth，开箱即用
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">数据管理</h3>
              <p className="text-gray-600">
                完整的数据库和 API 路由支持
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            Built with Next.js + Tailwind + Supabase
          </p>
        </div>
      </footer>
    </main>
  );
}
