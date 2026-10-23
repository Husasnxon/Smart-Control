import { NextRequest, NextResponse } from 'next/server';
import {
  Product,
  Customer,
  SaleReceipt,
  Expense,
  Employee,
  CustomerOrder,
  ShipmentOrder,
  PurchaseInvoice,
  ServiceTicket,
  CustomerDebtPayment,
  PayrollRecord,
  EmployeeAdvance,
  ObjectHandover,
  Branch,
  StockTransfer
} from '@/types';

// Server-side shared storage across client devices
interface SyncStore {
  timestamp: number;
  products?: Product[];
  customers?: Customer[];
  receipts?: SaleReceipt[];
  expenses?: Expense[];
  employees?: Employee[];
  customerOrders?: CustomerOrder[];
  shipments?: ShipmentOrder[];
  purchases?: PurchaseInvoice[];
  serviceTickets?: ServiceTicket[];
  customerDebtPayments?: CustomerDebtPayment[];
  payrolls?: PayrollRecord[];
  advances?: EmployeeAdvance[];
  handovers?: ObjectHandover[];
  branches?: Branch[];
  stockTransfers?: StockTransfer[];
  exchangeRate?: number;
  baseCurrency?: string;
  deletedProductIds?: string[];
  deletedPurchaseIds?: string[];
}

// Global persistence for warm serverless instances
declare global {
  var __smartControlSyncStore: SyncStore | undefined;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const since = Number(searchParams.get('since') || 0);

  const store = globalThis.__smartControlSyncStore;
  if (!store || !store.timestamp) {
    return NextResponse.json({
      timestamp: 0,
      modified: false,
      data: null,
      message: 'No central sync data yet.'
    });
  }

  // Bandwidth optimization: If client already has the latest timestamp, do not transfer full payload
  if (since && store.timestamp <= since) {
    return NextResponse.json({
      timestamp: store.timestamp,
      modified: false
    });
  }

  return NextResponse.json({
    timestamp: store.timestamp,
    modified: true,
    data: store
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: Partial<SyncStore> = await req.json();

    const existing = globalThis.__smartControlSyncStore || { timestamp: 0 };

    const mergedDeletedProducts = Array.from(new Set([
      ...(existing.deletedProductIds || []),
      ...(body.deletedProductIds || [])
    ]));
    const mergedDeletedPurchases = Array.from(new Set([
      ...(existing.deletedPurchaseIds || []),
      ...(body.deletedPurchaseIds || [])
    ]));

    let updatedStore: SyncStore;
    if ((body as { reset?: boolean }).reset) {
      updatedStore = {
        timestamp: Date.now(),
        products: (body.products || existing.products || []).map((p: Product) => ({ ...p, stockQuantity: 0, serialNumbers: [] })),
        customers: body.customers || existing.customers || [],
        receipts: [],
        expenses: [],
        customerOrders: [],
        shipments: [],
        purchases: [],
        serviceTickets: [],
        customerDebtPayments: [],
        payrolls: [],
        advances: [],
        handovers: [],
        employees: body.employees || existing.employees,
        branches: body.branches || existing.branches,
        stockTransfers: [],
        exchangeRate: 12850,
        baseCurrency: 'UZS',
        deletedProductIds: mergedDeletedProducts,
        deletedPurchaseIds: mergedDeletedPurchases
      };
    } else {
      let nextProducts = body.products !== undefined ? body.products : existing.products;
      if (nextProducts) {
        nextProducts = nextProducts.filter(p => !mergedDeletedProducts.includes(p.id));
      }

      let nextPurchases = body.purchases !== undefined ? body.purchases : existing.purchases;
      if (nextPurchases) {
        nextPurchases = nextPurchases.filter(p => !mergedDeletedPurchases.includes(p.id));
      }

      updatedStore = {
        ...existing,
        ...body,
        products: nextProducts,
        purchases: nextPurchases,
        deletedProductIds: mergedDeletedProducts,
        deletedPurchaseIds: mergedDeletedPurchases,
        timestamp: Date.now()
      };
    }

    globalThis.__smartControlSyncStore = updatedStore;

    return NextResponse.json({
      success: true,
      timestamp: updatedStore.timestamp
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to sync data';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
