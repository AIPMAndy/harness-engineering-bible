import { HelloWorldAgent } from '../src/index';

describe('HelloWorldAgent', () => {
  describe('构造函数', () => {
    it('应该使用默认配置初始化', () => {
      const agent = new HelloWorldAgent();
      expect(agent).toBeDefined();
    });

    it('应该接受自定义配置', () => {
      const agent = new HelloWorldAgent({
        model: 'custom-model',
        maxTokens: 2048,
        temperature: 0.5,
      });
      expect(agent).toBeDefined();
    });
  });

  describe('getInfo', () => {
    it('应该返回智能体信息', () => {
      const agent = new HelloWorldAgent();
      const info = agent.getInfo();
      expect(info).toContain('Hello World Agent');
      expect(info).toContain('模型');
    });
  });

  describe('process', () => {
    it('应该在没有 API Key 时返回错误', async () => {
      // 清除环境变量
      const originalApiKey = process.env.LLM_API_KEY;
      delete process.env.LLM_API_KEY;

      const agent = new HelloWorldAgent();
      const result = await agent.process('你好');

      expect(result.success).toBe(false);
      expect(result.reply).toContain('未配置 LLM API Key');

      // 恢复环境变量
      if (originalApiKey) {
        process.env.LLM_API_KEY = originalApiKey;
      }
    });

    it('应该处理空消息', async () => {
      const originalApiKey = process.env.LLM_API_KEY;
      delete process.env.LLM_API_KEY;

      const agent = new HelloWorldAgent();
      const result = await agent.process('');

      expect(result.success).toBe(false);

      if (originalApiKey) {
        process.env.LLM_API_KEY = originalApiKey;
      }
    });
  });
});
