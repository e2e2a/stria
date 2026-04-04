import mongoose, { Schema, models, model, Document } from 'mongoose';

export interface INode extends Document {
  workspaceId: mongoose.Schema.Types.ObjectId;
  projectId: mongoose.Schema.Types.ObjectId;
  parentId?: mongoose.Schema.Types.ObjectId | null;
  path: string; // The "Materialized Path" (e.g., "docs/setup.md")
  type: string;
  children: (Schema.Types.ObjectId | INode)[];
  title?: string;
  content: string;
  chunks?: [number, number][];
  archived: {
    by: string;
    at: Date;
    reason: string;
  } | null;
}

const nodeSchema = new Schema<INode>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Project' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    parentId: { type: Schema.Types.ObjectId, ref: 'Node', default: null },
    path: { type: String },
    type: { type: String, enum: ['file', 'folder'] },
    children: [{ type: Schema.Types.ObjectId, ref: 'Node', default: null }],
    title: { type: String },
    content: { type: String },
    chunks: { type: [[Number]], default: [] },
    archived: {
      by: { type: Schema.Types.ObjectId, ref: 'User' },
      at: Date,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

nodeSchema.index({ projectId: 1, path: 1 });
const Node = models.Node || model<INode>('Node', nodeSchema);
export default Node;
