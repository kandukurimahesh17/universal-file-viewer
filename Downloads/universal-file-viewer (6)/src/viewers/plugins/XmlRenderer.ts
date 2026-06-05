export const XmlRenderer = {
  render: async (file: any) => {
    console.log('XML Renderer parsing', file);
    return { success: true, type: 'xml' };
  }
};
