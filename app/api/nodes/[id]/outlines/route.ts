import { handleError } from '@/lib/server/handleError';
import { NextRequest, NextResponse } from 'next/server';
import { nodeController } from '@/modules/projects/nodes/nodes.controller';
import connectDb from '@/lib/db/connection';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDb();
    const { id } = await context.params;

    const res = await nodeController.getOutlines(id);

    return NextResponse.json(res);
  } catch (err) {
    return handleError(err);
  }
}
