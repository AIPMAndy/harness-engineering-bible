/**
 * Hello World Agent - 一个简单的 AI 智能体示例
 * 
 * 这个示例展示了一个基础的 AI 智能体如何：
 * 1. 接收用户输入
 * 2. 调用 LLM API 生成回复
 * 3. 返回结构化的响应
 * 
 * 使用说明：
 * - 设置环境变量 LLM_API_KEY 和 LLM_API_URL
 * - 运行 `npm run dev` 或 `npm start`
 */

interface AgentConfig {
  apiKey: string;
  apiUrl: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface AgentResponse {
  success: boolean;
  reply: string;
  metadata?: {
    tokens_used?: number;
    model?: string;
    timestamp?: string;
  };
}

/**
 * Hello World Agent 类
 * 实现一个简单的 AI 智能体
 */
export class HelloWorldAgent {
  private config: AgentConfig;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      apiKey: process.env.LLM_API_KEY || '',
      apiUrl: process.env.LLM_API_URL || 'https://api.example.com/v1/chat/completions',
      model: config.model || 'gpt-4',
      maxTokens: config.maxTokens || 1024,
      temperature: config.temperature || 0.7,
    };
  }

  /**
   * 处理用户消息并生成回复
   */
  async process(message: string): Promise<AgentResponse> {
    try {
      // 验证配置
      if (!this.config.apiKey) {
        return {
          success: false,
          reply: '错误：未配置 LLM API Key，请设置环境变量 LLM_API_KEY',
        };
      }

      // 构建系统提示
      const systemPrompt = `你是一个 helpful 的 AI 助手。请用简洁、友好的中文回答用户问题。`;

      // 调用 LLM API
      const response = await this.callLLM(message, systemPrompt);

      return {
        success: true,
        reply: response,
        metadata: {
          model: this.config.model,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        reply: `处理失败：${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 调用 LLM API
   */
  private async callLLM(userMessage: string, systemPrompt: string): Promise<string> {
    const fetch = await import('node-fetch');
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    const requestBody = {
      model: this.config.model,
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };

    const response = await fetch.default(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 请求失败：${response.status} - ${errorText}`);
    }

    const data: any = await response.json();
    return data.choices?.[0]?.message?.content || '没有收到回复';
  }

  /**
   * 获取智能体信息
   */
  getInfo(): string {
    return `Hello World Agent v1.0
- 模型：${this.config.model}
- API 端点：${this.config.apiUrl}
- 状态：${this.config.apiKey ? '已配置' : '未配置 API Key'}
`;
  }
}

/**
 * 命令行入口点
 */
async function main() {
  const agent = new HelloWorldAgent();

  console.log('🤖 Hello World Agent 已启动');
  console.log(agent.getInfo());
  console.log('\n输入消息进行测试（输入 "quit" 退出）:\n');

  // 简单的交互式命令行
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question('> ', async (input) => {
      if (input.toLowerCase() === 'quit') {
        console.log('再见！');
        rl.close();
        return;
      }

      if (input.trim()) {
        console.log('\n🤖 思考中...\n');
        const result = await agent.process(input);
        
        if (result.success) {
          console.log(`✨ ${result.reply}`);
        } else {
          console.log(`❌ ${result.reply}`);
        }
        
        if (result.metadata) {
          console.log(`\n📊 模型：${result.metadata.model}`);
        }
        console.log('');
      }
      
      prompt();
    });
  };

  prompt();
}

// 如果是直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}
