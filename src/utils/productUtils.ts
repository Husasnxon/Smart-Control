import { Product, Branch } from '../types';

/**
 * Retrive stock of a product for a specific branch.
 * If product is a service, returns 9999.
 * If branchStocks has an entry for branchId, returns it.
 * Otherwise, if product belongs to this branch (or defaults to defaultBranchId), returns product.stockQuantity;
 * otherwise returns 0.
 */
export function getProductStockForBranch(
  product: Product,
  branchId: string,
  defaultBranchId: string = 'branch-1'
): number {
  if (product.isService) return 9999;
  if (product.branchStocks && product.branchStocks[branchId] !== undefined) {
    return Math.max(0, product.branchStocks[branchId] || 0);
  }
  const assigned = product.branchId || defaultBranchId;
  if (assigned === branchId) {
    return Math.max(0, product.stockQuantity || 0);
  }
  return 0;
}

/**
 * Retrieve serial numbers for a specific branch.
 */
export function getProductSerialsForBranch(
  product: Product,
  branchId: string,
  defaultBranchId: string = 'branch-1'
): string[] {
  if (product.isService) return [];
  if (product.branchSerials && product.branchSerials[branchId] !== undefined) {
    return product.branchSerials[branchId] || [];
  }
  const assigned = product.branchId || defaultBranchId;
  if (assigned === branchId) {
    return product.serialNumbers || [];
  }
  return [];
}

/**
 * Retrieve total stock of a product across all branches.
 */
export function getTotalProductStock(
  product: Product,
  defaultBranchId: string = 'branch-1'
): number {
  if (product.isService) return 9999;
  if (product.branchStocks && Object.keys(product.branchStocks).length > 0) {
    return Object.values(product.branchStocks).reduce((sum, v) => sum + Math.max(0, v || 0), 0);
  }
  return Math.max(0, product.stockQuantity || 0);
}

/**
 * Retrieve all serial numbers of a product across all branches.
 */
export function getTotalProductSerials(product: Product): string[] {
  if (product.isService) return [];
  if (product.branchSerials && Object.keys(product.branchSerials).length > 0) {
    const set = new Set<string>();
    Object.values(product.branchSerials).forEach((arr) => {
      (arr || []).forEach((sn) => set.add(sn));
    });
    return Array.from(set);
  }
  return product.serialNumbers || [];
}

/**
 * Adjust product stock for a specific branch by delta (+ or -).
 */
export function adjustProductStockForBranch(
  product: Product,
  branchId: string,
  deltaQty: number,
  serialsToAdd: string[] = [],
  serialsToRemove: string[] = [],
  defaultBranchId: string = 'branch-1'
): Product {
  if (product.isService) return product;

  // Initialize branchStocks map if not present
  const branchStocks: Record<string, number> = { ...(product.branchStocks || {}) };
  if (Object.keys(branchStocks).length === 0) {
    const initBranch = product.branchId || defaultBranchId;
    branchStocks[initBranch] = Math.max(0, product.stockQuantity || 0);
  }

  const currentBranchStock = branchStocks[branchId] !== undefined
    ? branchStocks[branchId]
    : ((product.branchId || defaultBranchId) === branchId ? (product.stockQuantity || 0) : 0);

  const newBranchStock = Math.max(0, currentBranchStock + deltaQty);
  branchStocks[branchId] = newBranchStock;

  // Initialize branchSerials map if not present
  const branchSerials: Record<string, string[]> = { ...(product.branchSerials || {}) };
  if (Object.keys(branchSerials).length === 0 && product.serialNumbers && product.serialNumbers.length > 0) {
    const initBranch = product.branchId || defaultBranchId;
    branchSerials[initBranch] = [...product.serialNumbers];
  }

  let currentSerials = [
    ...(branchSerials[branchId] !== undefined
      ? branchSerials[branchId]
      : ((product.branchId || defaultBranchId) === branchId ? (product.serialNumbers || []) : []))
  ];

  if (serialsToRemove.length > 0) {
    const removeSet = new Set(serialsToRemove);
    currentSerials = currentSerials.filter((sn) => !removeSet.has(sn));
  }

  if (serialsToAdd.length > 0) {
    serialsToAdd.forEach((sn) => {
      if (!currentSerials.includes(sn)) currentSerials.push(sn);
    });
  }

  branchSerials[branchId] = currentSerials;

  const totalStock = Object.values(branchStocks).reduce((acc, v) => acc + Math.max(0, v || 0), 0);
  const totalSerialsSet = new Set<string>();
  Object.values(branchSerials).forEach((arr) => {
    (arr || []).forEach((sn) => totalSerialsSet.add(sn));
  });
  const totalSerials = Array.from(totalSerialsSet);

  return {
    ...product,
    branchStocks,
    branchSerials,
    stockQuantity: product.hasSerialNumber && totalSerials.length > 0 ? totalSerials.length : totalStock,
    serialNumbers: totalSerials,
  };
}

/**
 * Transfer stock and serial numbers between two branches.
 */
export function transferProductStock(
  product: Product,
  fromBranchId: string,
  toBranchId: string,
  quantity: number,
  transferredSerials: string[] = [],
  defaultBranchId: string = 'branch-1'
): Product {
  if (product.isService) return product;

  // 1. Deduct from fromBranchId
  const afterDeduction = adjustProductStockForBranch(
    product,
    fromBranchId,
    -quantity,
    [],
    transferredSerials,
    defaultBranchId
  );

  // 2. Add to toBranchId
  const afterAddition = adjustProductStockForBranch(
    afterDeduction,
    toBranchId,
    quantity,
    transferredSerials,
    [],
    defaultBranchId
  );

  return afterAddition;
}

/**
 * Projects a master products array for the current active branch.
 * If currentBranchId === 'all', each product is projected with total combined stock.
 * If currentBranchId is a specific branch, each product has stockQuantity set to that branch's stock,
 * and serialNumbers set to that branch's serials.
 * Every product in the catalog is preserved — no duplicates!
 */
export function mapProductsForCurrentBranch(
  products: Product[],
  currentBranchId: string,
  defaultBranchId: string = 'branch-1'
): Product[] {
  const isBranchAll = currentBranchId === 'all';

  return products.map((prod) => {
    if (prod.isService) {
      return {
        ...prod,
        stockQuantity: 9999,
        branchId: isBranchAll ? 'all' : currentBranchId,
      };
    }

    if (isBranchAll) {
      const totalStock = getTotalProductStock(prod, defaultBranchId);
      const totalSerials = getTotalProductSerials(prod);
      return {
        ...prod,
        stockQuantity: totalStock,
        serialNumbers: totalSerials,
        branchId: 'all',
      };
    }

    const branchStock = getProductStockForBranch(prod, currentBranchId, defaultBranchId);
    const branchSerials = getProductSerialsForBranch(prod, currentBranchId, defaultBranchId);

    return {
      ...prod,
      stockQuantity: branchStock,
      serialNumbers: branchSerials,
      branchId: currentBranchId,
    };
  });
}
