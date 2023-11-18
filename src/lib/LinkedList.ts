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
    this.tail = node;
  }

  prepend(node: LinkedListNode<T>) {
    node.next = this.head;
    this.head = node;
  }

  insertAfter(node: LinkedListNode<T>, newNode: LinkedListNode<T>) {
    newNode.next = node.next;
    node.next = newNode;
  }

  removeAfter(node: LinkedListNode<T>) {
    const removedNode = node.next;
    if (!removedNode) {
      return null;
    }
    node.next = removedNode.next;
    return removedNode;
  }

  removeHead() {
    const removedHead = this.head;
    if (!removedHead) {
      return null;
    }
    this.head = removedHead.next;
    return removedHead;
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
  constructor(value: T) {
    this.value = value;
    this.next = null;
  }
}
