// 工具定义映射
export const TOOL_DEFINITIONS: Record<string, { description: string, inputSchema: any }> = {
  getContent: {
    description: "获取指定记忆片段的内容，支持递归展开引用的其他记忆片段。请不要重复调用同一记忆片段,除非该记忆片段内容在不之情况下发生变化（使用 setContent 属于在万千可控的情况下变更了内容），比如使用 extractContent 提取了内容,或者insetLinkAt 插入了链接，使用带有行号的模式可以忽略这一点。如果接下来希望使用 extractContent 提取内容，推荐使用 withLineNumber=true",
    inputSchema: {
      type: "object",
      properties: {
        cardName: { type: "string", description: "要获取内容的记忆片段名称" },
        expandDepth: { type: "number", description: "展开深度，0表示不展开引用，1表示展开一层引用，以此类推", default: 0, minimum: 0, maximum: 10 },
        withLineNumber: { type: "boolean", description: "是否输出带行号的内容，默认false", default: false }
      },
      required: ["cardName"]
    }
  },
  setContent: {
    description: "创建或更新记忆片段的内容。支持使用 [[记忆片段名]] 语法引用其他记忆片段",
    inputSchema: {
      type: "object",
      properties: {
        cardName: { type: "string", description: "要设置内容的记忆片段名称" },
        content: { type: "string", description: "记忆片段的内容，支持 Markdown 格式和 [[记忆片段名]] 引用语法" }
      },
      required: ["cardName", "content"]
    }
  },
  deleteContent: {
    description: "删除指定的记忆片段",
    inputSchema: {
      type: "object",
      properties: {
        cardName: { type: "string", description: "要删除的记忆片段名称" }
      },
      required: ["cardName"]
    }
  },
  renameContent: {
    description: "重命名记忆片段或将两个记忆片段合并。如果目标记忆片段已存在，会将内容合并。同时更新所有引用了旧记忆片段的地方",
    inputSchema: {
      type: "object",
      properties: {
        oldCardName: { type: "string", description: "原记忆片段名称" },
        newCardName: { type: "string", description: "新记忆片段名称" }
      },
      required: ["oldCardName", "newCardName"]
    }
  },
  getHints: {
    description: "获取按权重排序的重要记忆片段提示。权重通过递归计算记忆片段引用关系得出。用于发现知识网络的核心节点。如需优化整体结构，建议配合 getSuggestions 使用",
    inputSchema: {
      type: "object",
      properties: {
        fileCount: { type: "number", description: "返回的记忆片段数量", default: 10, minimum: 1, maximum: 100 }
      }
    }
  },
  getSuggestions: {
    description: "获取优化建议，识别价值较低的记忆片段进行优化。价值 = 权重 / 字符数。提供详细的优化策略，包括拆分、聚类等方法。当记忆片段数量较多或想要改善知识网络质量时使用",
    inputSchema: {
      type: "object",
      properties: {
        optimizationThreshold: { type: "number", description: "优化阈值，价值低于此值的记忆片段会被标记为需要优化", default: 0.1, minimum: 0, maximum: 1 },
        maxFileCount: { type: "number", description: "返回的低价值记忆片段最大数量", default: 10, minimum: 1, maximum: 50 }
      }
    }
  },
  extractContent: {
    description: "内容提取功能 - 支持精确范围定位。通过行号和正则表达式精确定位内容范围进行提取，解决AI需要完整复述内容的问题。这是 getSuggestions 推荐的主要优化方法",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "源记忆片段名称" },
        to: { type: "string", description: "目标记忆片段名称" },
        range: {
          type: "object",
          description: "提取范围定义",
          properties: {
            start: {
              type: "object",
              description: "开始位置",
              properties: {
                line: { type: "number", description: "起始行号（1-based），如果不提供则从文件开头开始", minimum: 1 },
                regex: { type: "string", description: "正则表达式匹配，从指定行号开始搜索匹配的内容" }
              }
            },
            end: {
              type: "object",
              description: "结束位置",
              properties: {
                line: { type: "number", description: "结束行号（1-based），如果不提供则从文件结尾开始", minimum: 1 },
                regex: { type: "string", description: "正则表达式匹配，从指定行号开始倒过来搜索匹配的内容" }
              }
            }
          }
        }
      },
      required: ["from", "to", "range"]
    }
  },
  insertLinkAt: {
    description: "在指定位置插入记忆片段链接。解决了需要完整输出文件内容才能添加链接的问题，可以精确指定插入位置",
    inputSchema: {
      type: "object",
      properties: {
        sourceCardName: { type: "string", description: "源记忆片段名称（要在其中插入链接的记忆片段）" },
        targetCardName: { type: "string", description: "目标记忆片段名称（要链接到的记忆片段）" },
        linePosition: { type: "number", description: "行号位置。正数表示从文件开头计数（1-based），负数表示从文件末尾计数，0或不提供则默认添加到文件末尾" },
        anchorText: { type: "string", description: "链接的锚文本，可选。如果提供，链接格式为 '锚文本 [[目标记忆片段]]'，否则为 '[[目标记忆片段]]'" }
      },
      required: ["sourceCardName", "targetCardName"]
    }
  },
  getBacklinks: {
    description: "获取指定记忆片段的所有反向链接。返回引用指定记忆片段的其他记忆片段名称列表，有助于了解知识网络中的连接关系",
    inputSchema: {
      type: "object",
      properties: {
        cardName: { type: "string", description: "要查询反向链接的记忆片段名称" }
      },
      required: ["cardName"]
    }
  }
};