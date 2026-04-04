import { NextResponse } from 'next/server';
import Node from '@/modules/projects/nodes/node.model';
import connectDb from '@/lib/db/connection';
import { performSearch } from '@/utils/client/search-nodes-utils';
import { INode } from '@/types';

export async function POST(req: Request, { params }: { params: Promise<{ pid: string }> }) {
  try {
    await connectDb();
    const { query } = await req.json();
    const resolvedParams = await params;
    const pid = resolvedParams.pid;

    if (!query || !pid) return NextResponse.json([]);

    // Only fetch exactly what is needed for search (no chunks, no dates)
    const nodes = await Node.find({ projectId: pid, type: 'file' }).select('_id title content').lean();

    const results = performSearch(query, nodes as unknown as INode[]);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
