import { NextRequest, NextResponse } from 'next/server';
import { handleError } from '@/lib/server/handleError';
import connectDb from '@/lib/db/connection';
import { projectMemberController } from '@/modules/projects/member/member.controller';

export async function GET(_req: NextRequest, context: { params: Promise<{ pid: string }> }) {
  try {
    await connectDb();
    const { pid } = await context.params;
    const res = await projectMemberController.getMyMembership(pid);

    return NextResponse.json(res ?? null, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
}
