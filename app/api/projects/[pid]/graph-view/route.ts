import { handleError } from '@/lib/server/handleError';
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/lib/db/connection';
import { projectController } from '@/modules/projects/project.controller';

export async function GET(_req: NextRequest, context: { params: Promise<{ pid: string }> }) {
  try {
    await connectDb();
    const { pid } = await context.params;

    const res = await projectController.getGrapView(pid);
    const jsonString = JSON.stringify(res);
    const bytes = Buffer.byteLength(jsonString, 'utf8');
    const kb = (bytes / 1024).toFixed(2);
    const mb = (bytes / (1024 * 1024)).toFixed(2);

    console.log(`--- 📦 API Payload Report (Project: ${pid}) ---`);
    console.log(`Nodes: ${res.d3Nodes?.length || 0}`);
    console.log(`Links: ${res.d3Links?.length || 0}`);
    console.log(`Total Size: ${bytes} bytes | ${kb} KB | ${mb} MB`);
    console.log(`----------------------------------------------`);
    // ----------------------
    return NextResponse.json(res);
  } catch (err) {
    return handleError(err);
  }
}
