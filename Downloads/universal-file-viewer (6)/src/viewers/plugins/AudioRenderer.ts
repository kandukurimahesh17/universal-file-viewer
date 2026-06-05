export const AudioRenderer = {
  render: async (file: any) => {
    console.log('Audio Renderer parsing', file);
    return { success: true, type: 'audio' };
  }
};
