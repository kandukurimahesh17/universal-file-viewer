export const JsonRenderer = {
  render: async (file: any) => {
    console.log('JSON Renderer parsing', file);
    return { success: true, type: 'json' };
  }
};
