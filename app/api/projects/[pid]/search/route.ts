import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/db/connection';
import { handleError } from '@/lib/server/handleError';
import { projectController } from '@/modules/projects/project.controller';

export async function POST(req: NextRequest, context: { params: Promise<{ pid: string }> }) {
  try {
    await connectDb();
    const { query } = await req.json();
    const { pid } = await context.params;
    const res = await projectController.search(pid, query);
    return NextResponse.json(res, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
