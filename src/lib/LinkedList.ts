export class LinkedList<T> {
  public head: LinkedListNode<T>;
  public tail: LinkedListNode<T>;
  constructor(node: LinkedListNode<T>) {
    this.head = node;
    this.tail = node;
  }

  size() {
    let size = 0;
    let node = this.head;
    while (node) {
      size++;
      node = node.next;
    }
    return size;
  }

  append(node: LinkedListNode<T>) {
    this.tail.next = node;
    node.prev = this.tail;
    this.tail = node;
  }

  prepend(node: LinkedListNode<T>) {
    this.head.prev = node;
    node.next = this.head;
    this.head = node;
  }

  insertAfter(node: LinkedListNode<T>, newNode: LinkedListNode<T>) {
    if (node === this.tail) {
      this.append(newNode);
      return;
    }

    if (node === this.head) {
      this.prepend(newNode);
      return;
    }

    if (!node.next) {
      return;
    }

    newNode.next = node.next;
    node.next.prev = newNode;
    node.next = newNode;
    newNode.prev = node;
  }

  remove(node: LinkedListNode<T>) {
    if (node === this.head) {
      this.removeHead();
      return;
    }

    if (node === this.tail) {
      this.removeTail();
      return;
    }

    if (!node.next || !node.prev) {
      return;
    }

    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  removeHead() {
    const removedHead = this.head;
    if (!removedHead) {
      return null;
    }
    this.head = removedHead.next;
    return removedHead;
  }

  removeTail() {
    const removedTail = this.tail;
    if (!removedTail) {
      return null;
    }
    this.tail = removedTail.prev;
    return removedTail;
  }

  findNode(callback: (node: LinkedListNode<T>) => boolean) {
    let node = this.head;
    while (node) {
      if (callback(node)) {
        return node;
      }
      node = node.next;
    }
    return null;
  }

  findNodeByValue(value: LinkedListNode<T>['value']) {
    return this.findNode((node) => node.value === value);
  }

  findNodeByIndex(index: number) {
    let node = this.head;
    let i = 0;
    while (node) {
      if (i === index) {
        return node;
      }
      node = node.next;
      i++;
    }
    return null;
  }

  toArray() {
    const arr = [];
    let node = this.head;
    while (node) {
      arr.push(node.value);
      node = node.next;
    }
    return arr;
  }

  toString() {
    return this.toArray().toString();
  }

  reverse() {
    let prev = null;
    let curr = this.head;
    let next = null;
    while (curr) {
      next = curr.next;
      curr.next = prev;
      prev = curr;
      curr = next;
    }
    this.tail = this.head;
    this.head = prev;
  }

  *[Symbol.iterator]() {
    let node = this.head;
    while (node) {
      yield node;
      node = node.next;
    }
  }

  appendArray(arr: LinkedListNode<T>[]) {
    arr.forEach((node) => this.append(node));
  }
}

export class LinkedListNode<T = string> {
  public value: T;
  public next: LinkedListNode<T>;
  public prev: LinkedListNode<T>;
  constructor(value: T) {
    this.value = value;
    this.next = null;
    this.prev = null;
  }
}
