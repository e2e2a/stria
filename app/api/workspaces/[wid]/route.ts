import connectDb from '@/lib/db/connection';
import { handleError } from '@/lib/server/handleError';
import { NextRequest, NextResponse } from 'next/server';
import { workspaceController } from '@/modules/workspaces/workspace.controller';

export async function GET(req: NextRequest, context: { params: Promise<{ wid: string }> }) {
  try {
    await connectDb();
    const { wid } = await context.params;
    const res = await workspaceController.getWorkspace(wid);
    return NextResponse.json(res);
  } catch (err) {
    return handleError(err);
  }
}
