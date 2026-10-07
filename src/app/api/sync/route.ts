import { NextRequest, NextResponse } from 'next/server';

// Server-side shared storage across client devices
interface SyncStore {
  timestamp: number;
  products?: any[];
  customers?: any[];
  receipts?: any[];
  expenses?: any[];
  employees?: any[];
  customerOrders?: any[];
  shipments?: any[];
  purchases?: any[];
  serviceTickets?: any[];
  customerDebtPayments?: any[];
  payrolls?: any[];
  advances?: any[];
  handovers?: any[];
  exchangeRate?: number;
  baseCurrency?: string;
}

// Global persistence for warm serverless instances
declare global {
  // eslint-disable-next-line no-var
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
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to sync data' },
      { status: 500 }
    );
  }
}
