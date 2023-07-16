interface QueueItem<T> {
  item: T;
  priority: number;
}

export class PriorityQueue<T> {
  private items: QueueItem<T>[] = [];
  private focusedItem: QueueItem<T> | undefined;

  constructor() {
    this.items = [];
  }

  public enqueue(item: T, priority: number): void {
    this.items.push({ priority, item });
    this.onEnqueue();
  }

  public dequeue(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    this.items.sort((a, b) => a.priority - b.priority);
    this.focusedItem = this.items.shift();

    return this.focusedItem?.item;
  }

  public isEmpty(): boolean {
    return this.items.length === 0;
  }

  public peek(): QueueItem<T> | undefined {
    return this.items[0];
  }

  public onEnqueue(): void {
    const currentItem = this.focusedItem;
    const peekItem = this.peek();

    if (!currentItem?.item || !peekItem?.item) {
      return;
    }

    if (currentItem.priority < peekItem.priority) {
      // if the current item is a lower priority than the newly added item
      this.items.push(currentItem); // add it back to the queue
      this.focusedItem = undefined; // reset the current item
      this.dequeue(); // and run dequeue again to make sure we're looking at the highest priority item
    }
  }
}
