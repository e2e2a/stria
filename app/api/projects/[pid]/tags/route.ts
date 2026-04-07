import { handleError } from '@/lib/server/handleError';
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/db/connection';
import { projectController } from '@/modules/projects/project.controller';

export async function GET(_req: NextRequest, context: { params: Promise<{ pid: string }> }) {
  try {
    await connectDb();
    const { pid } = await context.params;

    const res = await projectController.getTags(pid);
    return NextResponse.json(res);
  } catch (err) {
    return handleError(err);
  }
}
