import React from 'react';

export type ViewerComponent = React.FC<any>;

class ViewerRegistryClass {
  private viewers: Record<string, ViewerComponent> = {};

  register(category: string, component: ViewerComponent) {
    this.viewers[category] = component;
  }

  getViewer(category: string): ViewerComponent | undefined {
    return this.viewers[category];
  }
  
  getAllViewers(): Record<string, ViewerComponent> {
    return this.viewers;
  }
}

export const ViewerRegistry = new ViewerRegistryClass();
