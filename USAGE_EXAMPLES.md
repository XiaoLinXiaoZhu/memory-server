# Zettelkasten Memory Server 使用示例

## 快速开始

### 1. 构建和启动服务器

```bash
cd memory-server
npm install
npm run build
npm start
```

### 2. MCP 客户端配置

将以下配置添加到你的 MCP 客户端配置文件中：

```json
{
  "mcpServers": {
    "zettelkasten-memory": {
      "command": "node",
      "args": ["路径/到/memory-server/build/index.js"],
      "env": {
        "ZETTELKASTEN_STORAGE_DIR": "路径/到/你的卡片存储目录"
      }
    }
  }
}
```

## 使用示例

### 创建知识卡片

```markdown
工具: setContent
参数:
- cardName: "深度学习基础"
- content: "深度学习是机器学习的一个分支，使用多层神经网络来学习数据表示。

## 核心概念
- [[神经网络]]
- [[反向传播]]
- [[梯度下降]]

## 应用领域
- [[计算机视觉]]
- [[自然语言处理]]
- [[语音识别]]

## 参考资料
- [[深度学习教材]]"
```

### 建立卡片网络

```markdown
工具: setContent
参数:
- cardName: "神经网络"
- content: "神经网络是深度学习的基础结构，模拟生物神经元的工作方式。

## 基本组成
- 输入层
- 隐藏层
- 输出层

## 相关概念
- [[激活函数]]
- [[权重和偏置]]
- [[前向传播]]

参见: [[深度学习基础]]"
```

### 获取智能提示

```markdown
工具: getHints
参数:
- fileCount: 5

返回按权重排序的重要卡片，帮助你了解当前知识网络的核心内容。
```

### 展开引用内容

```markdown
工具: getContent
参数:
- cardName: "深度学习基础"
- expandDepth: 1

这将返回"深度学习基础"卡片的内容，并展开其中引用的卡片内容。
```

### 优化建议

```markdown
工具: getSuggestions
参数:
- optimizationThreshold: 0.1
- maxFileCount: 10

返回价值较低的卡片，建议进行合并、重写或删除。
```

## 最佳实践

### 1. 卡片命名
- 使用简洁明确的名称
- 避免特殊字符和路径符号
- 使用中文或英文，保持一致性

### 2. 内容组织
- 每个卡片专注一个核心概念
- 大量使用 `[[链接]]` 建立卡片间的关系
- 使用 Markdown 格式增强可读性

### 3. 链接策略
- 创建枢纽卡片连接相关主题
- 建立层次结构：概念 -> 具体实现 -> 应用示例
- 定期使用 `getHints` 发现重要卡片

### 4. 维护优化
- 定期使用 `getSuggestions` 清理低价值卡片
- 合并重复或相似内容的卡片
- 使用 `renameContent` 重组卡片结构

## 高级用法

### 创建知识地图

```markdown
工具: setContent
参数:
- cardName: "AI学习路径"
- content: "人工智能学习的完整路径规划

## 基础阶段
1. [[数学基础]]
   - [[线性代数]]
   - [[微积分]]
   - [[概率统计]]

2. [[编程基础]]
   - [[Python编程]]
   - [[数据结构算法]]

## 进阶阶段
1. [[机器学习]]
   - [[监督学习]]
   - [[无监督学习]]
   - [[强化学习]]

2. [[深度学习基础]]
   - [[神经网络]]
   - [[卷积神经网络]]
   - [[循环神经网络]]

## 应用阶段
- [[计算机视觉项目]]
- [[NLP项目实战]]
- [[推荐系统开发]]"
```

### 主题收集卡片

```markdown
工具: setContent
参数:
- cardName: "学习资源收集"
- content: "收集各种学习资源和参考材料

## 在线课程
- [[Coursera AI课程]]
- [[edX机器学习课程]]

## 技术博客
- [[Distill.pub文章]]
- [[OpenAI博客]]

## 实用工具
- [[Jupyter Notebook]]
- [[Google Colab]]
- [[Kaggle平台]]

## 数据集
- [[ImageNet数据集]]
- [[MNIST数据集]]"
```

这样，你就可以构建一个强大而灵活的知识管理系统！
