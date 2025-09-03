// 通用类型守卫工具集
export function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

export function isSymbolsObject(v: unknown): v is { symbols: string[] } {
  return typeof v === 'object' && v !== null && Array.isArray((v as { symbols?: unknown }).symbols);
}

export function isArrayOfSymbolObjects(v: unknown): v is Array<{ symbol: string }> {
  return Array.isArray(v) && v.every((x) => typeof x === 'object' && x !== null && typeof (x as { symbol?: unknown }).symbol === 'string');
}

// 带 uid 的对象类型守卫
export interface ItemWithUid { uid: string }

export function isItemWithUid(v: unknown): v is ItemWithUid {
  return typeof v === 'object' && v !== null && typeof (v as { uid?: unknown }).uid === 'string';
}

export function asItemsWithUidArray(v: unknown): ItemWithUid[] | null {
  return Array.isArray(v) && v.every(isItemWithUid) ? (v as ItemWithUid[]) : null;
}

// 从对象树中提取含 uid 的数组（防循环引用版本）
export function extractNewsItemsWithUid(root: unknown): ItemWithUid[] {
  // 1) 根就是数组
  const direct = asItemsWithUidArray(root);
  if (direct) return direct;

  // 2) 广度优先搜索对象树，使用 WeakSet 防止循环引用
  const queue: unknown[] = [];
  const visited = new WeakSet<object>(); // 防止循环引用
  
  if (typeof root === 'object' && root !== null) {
    queue.push(root);
    visited.add(root);
  }
  
  const maxNodes = 5000; // 防御性限制
  let nodeCount = 0;
  
  while (queue.length > 0 && nodeCount < maxNodes) {
    const cur = queue.shift() as unknown;
    nodeCount++;
    
    const arr = asItemsWithUidArray(cur);
    if (arr) return arr;
    
    if (typeof cur === 'object' && cur !== null) {
      const o = cur as Record<string, unknown>;
      for (const k of Object.keys(o)) {
        const val = o[k];
        
        // 先检查是否为数组
        const asArr = asItemsWithUidArray(val);
        if (asArr) return asArr;
        
        // 再检查是否为对象且未访问过
        if (typeof val === 'object' && val !== null && !visited.has(val)) {
          queue.push(val);
          visited.add(val);
        }
      }
    }
  }
  
  return [];
}
