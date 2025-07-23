/**
 * MCP 服务器相关的类型定义
 */

// MCP 相关类型
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolHandler {
  (args: Record<string, any>): Promise<{
    content: Array<{
      type: "text";
      text: string;
    }>;
  }>;
}

export interface ToolRegistry {
  [toolName: string]: {
    definition: ToolDefinition;
    handler: ToolHandler;
  };
}
