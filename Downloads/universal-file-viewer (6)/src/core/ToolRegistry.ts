export type ToolDef = {
  id: string;
  name: string;
  icon: any; // Lucide icon
  action: () => void;
  description?: string;
};

class ToolRegistryClass {
  private tools: ToolDef[] = [];

  register(tool: ToolDef) {
    this.tools.push(tool);
  }

  getTools(): ToolDef[] {
    return this.tools;
  }
  
  clear() {
    this.tools = [];
  }
}

export const ToolRegistry = new ToolRegistryClass();
