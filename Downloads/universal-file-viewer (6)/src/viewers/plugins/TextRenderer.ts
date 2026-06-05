export const TextRenderer = {
  render: async (file: any) => {
    console.log('Text Renderer parsing', file);
    return { success: true, type: 'text' };
  }
};
