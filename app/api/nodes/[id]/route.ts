import connectDb from '@/lib/db/connection';
import { handleError } from '@/lib/server/handleError';
import { nodeController } from '@/modules/projects/nodes/nodes.controller';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    await connectDb();
    const res = await nodeController.update(id, body);

    return NextResponse.json(res, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDb();
    const { id } = await context.params;
    const res = await nodeController.delete(id);
    return NextResponse.json(res, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
