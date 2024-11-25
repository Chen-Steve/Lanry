export const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  if (e.ctrlKey) {
    switch(e.key.toLowerCase()) {
      case 'b':
        e.preventDefault();
        document.execCommand('bold', false);
        break;
      case 'i':
        e.preventDefault();
        document.execCommand('italic', false);
        break;
      case 'u':
        e.preventDefault();
        document.execCommand('underline', false);
        break;
    }
  }
};

export const saveCaretPosition = (element: HTMLElement) => {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  }
  return 0;
};

export const restoreCaretPosition = (element: HTMLElement, position: number) => {
  const range = document.createRange();
  const selection = window.getSelection();
  let charIndex = 0;
  let done = false;

  const nodeStack: Node[] = [element];
  let node: Node | undefined;
  let foundNode: Text | null = null;
  let foundPosition = 0;

  while (!done && (node = nodeStack.pop())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const nextCharIndex = charIndex + textNode.length;
      if (!foundNode && position >= charIndex && position <= nextCharIndex) {
        foundNode = textNode;
        foundPosition = position - charIndex;
        done = true;
      }
      charIndex = nextCharIndex;
    } else {
      let i = node.childNodes.length;
      while (i--) {
        nodeStack.push(node.childNodes[i]);
      }
    }
  }

  if (foundNode) {
    range.setStart(foundNode, foundPosition);
    range.setEnd(foundNode, foundPosition);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
}; 