export const HtmlRenderer = {
  render: async (file: any) => {
    console.log('HTML Renderer parsing', file);
    return { success: true, type: 'html' };
  }
};
