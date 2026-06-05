export class SelectionManager {
  private selectedIds: Set<string> = new Set<string>();

  constructor(initialSelected?: string[]) {
    if (initialSelected) {
      initialSelected.forEach(id => this.selectedIds.add(id));
    }
  }

  select(id: string): void {
    this.selectedIds.add(id);
  }

  deselect(id: string): void {
    this.selectedIds.delete(id);
  }

  toggle(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  selectAll(ids: string[]): void {
    ids.forEach(id => this.selectedIds.add(id));
  }

  clear(): void {
    this.selectedIds.clear();
  }

  getSelectedIds(): string[] {
    return Array.from(this.selectedIds);
  }

  getSelectedCount(): number {
    return this.selectedIds.size;
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }
}
