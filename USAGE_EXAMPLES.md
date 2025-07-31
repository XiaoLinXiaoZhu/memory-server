# Zettelkasten Memory Server 使用示例

## 快速开始

### 1. 构建和启动服务器

```bash
cd memory-server
npm install
npm run build
npm start
```

### 2. 重复读取限制机制配置

```bash
# 启用重复读取限制（推荐）
MEMORY_REPEAT_ACCESS_RESTRICTION=true npm start

# 禁用重复读取限制
MEMORY_REPEAT_ACCESS_RESTRICTION=false npm start
```

### 3. MCP 客户端配置

将以下配置添加到你的 MCP 客户端配置文件中：

```json
{
  "mcpServers": {
    "zettelkasten-memory": {
      "command": "node",
      "args": ["路径/到/memory-server/build/index.js"],
      "env": {
        "ZETTELKASTEN_STORAGE_DIR": "路径/到/你的记忆片段存储目录",
        "MEMORY_REPEAT_ACCESS_RESTRICTION": "true"
      }
    }
  }
}
```

## 使用示例

### 创建知识记忆片段

```markdown
工具: setMemory
参数:
- fragmentName: "深度学习基础"
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

### 建立记忆片段网络

```markdown
工具: setMemory
参数:
- fragmentName: "神经网络"
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
工具: getMemoryHints
参数:
- fileCount: 5

返回按权重排序的重要记忆片段，帮助你了解当前知识网络的核心内容。
```

### 展开引用内容

```markdown
工具: getMemory
参数:
- fragmentName: "深度学习基础"
- expandDepth: 1
- withLineNumber: false

这将返回"深度学习基础"记忆片段的内容，并展开其中引用的记忆片段内容。
```

### 从现有片段提取内容

```markdown
工具: extractMemory
参数:
- sourceFragmentName: "深度学习基础"
- newFragmentName: "神经网络基础"
- startLine: 5
- endLine: 10

从"深度学习基础"片段的第5-10行提取内容，创建新的"神经网络基础"片段。
```

### 优化建议

```markdown
工具: getOptimizeSuggestions
参数:
- optimizationThreshold: 0.1
- maxFileCount: 10

返回价值较低的记忆片段，建议进行合并、重写或删除。
```

### 重复读取限制机制示例

```markdown
# 正确使用流程（启用限制时）

1. 首次获取内容：
   工具: getMemory
   参数:
   - fragmentName: "JavaScript基础"

2. 编辑内容前无需重复获取：
   工具: setMemory
   参数:
   - fragmentName: "JavaScript基础"
   - content: "更新后的内容..."

3. 编辑后如需再次查看，需要重新获取：
   工具: getMemory
   参数:
   - fragmentName: "JavaScript基础"

# 错误使用示例（启用限制时）

1. 连续重复获取相同内容会被拒绝：
   工具: getMemory
   参数:
   - fragmentName: "JavaScript基础"
   
   工具: getMemory  # 这次调用会被拒绝
   参数:
   - fragmentName: "JavaScript基础"
```

## 最佳实践

### 1. 记忆片段命名
- 使用简洁明确的名称
- 避免特殊字符和路径符号
- 使用中文或英文，保持一致性

### 2. 内容组织
- 每个记忆片段专注一个核心概念
- 大量使用 `[[链接]]` 建立记忆片段间的关系
- 使用 Markdown 格式增强可读性

### 3. 链接策略
- 创建枢纽记忆片段连接相关主题
- 建立层次结构：概念 -> 具体实现 -> 应用示例
- 定期使用 `getMemoryHints` 发现重要记忆片段

### 4. 维护优化
- 定期使用 `getOptimizeSuggestions` 清理低价值记忆片段
- 合并重复或相似内容的记忆片段
- 使用 `renameMemory` 重组记忆片段结构

### 5. 重复读取限制最佳实践
- **启用限制**：在生产环境中启用 `MEMORY_REPEAT_ACCESS_RESTRICTION=true`
- **获取后编辑**：获取内容后立即进行编辑操作，避免重复获取
- **编辑后重取**：完成编辑操作后，如需查看最新内容再重新获取
- **批量操作**：需要处理多个片段时，按顺序获取和编辑，避免交叉操作

## 高级用法

### 创建知识地图

```markdown
工具: setMemory
参数:
- fragmentName: "AI学习路径"
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

### 主题收集记忆片段

```markdown
工具: setMemory
参数:
- fragmentName: "学习资源收集"
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

### 使用重复读取限制优化工作流程

```markdown
# 高效工作流程示例

## 场景：整理学习笔记

1. 获取当前知识状态：
   工具: getMemoryHints
   参数:
   - fileCount: 10

2. 创建新的学习片段：
   工具: setMemory
   参数:
   - fragmentName: "今日React学习"
   - content: "今天学习了React的useState Hook..."

3. 更新相关片段链接：
   工具: getMemory
   参数:
   - fragmentName: "React"
   - expandDepth: 0

   工具: setMemory
   参数:
   - fragmentName: "React"
   - content: "更新后的React内容，包含新的useState Hook链接..."

4. 检查优化建议：
   工具: getOptimizeSuggestions
   参数:
   - optimizationThreshold: 0.1
   - maxFileCount: 5

5. 提取重要内容：
   工具: extractMemory
   参数:
   - sourceFragmentName: "今日React学习"
   - newFragmentName: "useState Hook详解"
   - startLine: 1
   - endLine: 20
```

这样，你就可以构建一个强大而灵活的知识管理系统！通过合理使用重复读取限制机制，可以显著提高操作效率并避免不必要的系统开销。
