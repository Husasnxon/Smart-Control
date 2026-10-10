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
  ObjectHandover
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
  exchangeRate?: number;
  baseCurrency?: string;
}

// Global persistence for warm serverless instances
declare global {
  var __smartControlSyncStore: SyncStore | undefined;
}

export async function GET() {
  const store = globalThis.__smartControlSyncStore;
  if (!store || !store.timestamp) {
    return NextResponse.json({
      timestamp: 0,
      data: null,
      message: 'No central sync data yet.'
    });
  }

  return NextResponse.json({
    timestamp: store.timestamp,
    data: store
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: Partial<SyncStore> = await req.json();

    const existing = globalThis.__smartControlSyncStore || { timestamp: 0 };

    // Merge incoming data with existing store
    const updatedStore: SyncStore = {
      ...existing,
      ...body,
      timestamp: Date.now()
    };

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
