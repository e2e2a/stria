import mongoose from 'mongoose';
import Node from '@/modules/projects/nodes/node.model';
import dotenv from 'dotenv';
import User from '@/modules/users/user.model';
import Workspace from '@/modules/workspaces/workspace.model';
import Project from '@/modules/projects/project.model';
import WorkspaceMember from '@/modules/workspaces/members/member.model';
import ProjectMember from '@/modules/projects/member/member.model';
import { hashText } from '@/lib/server/bcrypt';
import ApiToken from '@/modules/apitokens/apitoken.model';
import { createHash } from 'crypto';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/testdb';
const userData = {
  email: 'example1@gmail.com',
  isOnboard: true,
  role: 'user',
  email_verified: true,
  image: null,
  company: '',
  country: '',
  phoneNumber: '',
  family_name: 'User1',
  given_name: 'User1',
  goal: 'Real-time collaboration',
  last_login: '2025-12-27T06:53:06.347Z',
};

const userAdminData = {
  email: 'admin@gmail.com',
  isOnboard: false,
  role: 'admin',
  email_verified: true,
  image: null,
  company: null,
  country: null,
  phoneNumber: null,
  last_login: '2025-12-27T06:53:06.347Z',
};

const workspaceData = {
  title: 'workspace 1',
};

const projectData = {
  title: 'project 1',
};
const workspaceMemberData = {
  role: 'owner',
  status: 'accepted',
};

const projectMemberData = {
  role: 'owner',
};

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🚀 Connected to MongoDB');

    const userInitialPassword = 'password';
    await User.deleteMany();
    const hashedPassword = await hashText(userInitialPassword);
    const user = await User.create({ ...userData, password: hashedPassword });
    const userAdmin = await User.create({ ...userAdminData, password: hashedPassword });

    await ApiToken.deleteMany();
    const token = 'sk_078c8c1aa18940566a7d9283ad0fd479583eb8aaad6722fdfc01d7dc7fdc426f';
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await ApiToken.create({ userId: userAdmin._id, tokenHash });

    await Workspace.deleteOne({ title: workspaceData.title }, { new: true });
    const workspace = await Workspace.create({ ...workspaceData, ownerUserId: user._id });

    await WorkspaceMember.deleteMany();
    await WorkspaceMember.create({ ...workspaceMemberData, workspaceId: workspace._id, email: user.email });

    await Project.deleteOne();
    const project = await Project.create({ ...projectData, workspaceId: workspace._id, createdBy: user._id });

    await ProjectMember.deleteMany();
    await ProjectMember.create({ ...projectMemberData, workspaceId: workspace._id, projectId: project._id, email: user.email });

    const BASE = {
      workspaceId: workspace._id,
      projectId: project._id,
    };

    await Node.deleteMany();
    console.log('🧹 Cleaned existing project nodes');

    // 2. Create 5 Main Parent Trees
    for (let i = 1; i <= 5; i++) {
      console.log(`Building Tree #${i}...`);

      const rootTitle = `Root-Parent-${i}`;

      // Create Top Level Parent
      let currentParent = await Node.create({
        ...BASE,
        parentId: null,
        title: rootTitle,
        path: rootTitle, // 1st level path is just the title
        type: 'folder',
      });

      // 3. Create 4 levels of nested sub-parents
      for (let depth = 1; depth <= 4; depth++) {
        const subTitle = `Sub-Level-${depth}-of-Tree-${i}`;

        const subParent = await Node.create({
          ...BASE,
          parentId: currentParent._id,
          title: subTitle,
          path: `${currentParent.path}/${subTitle}`, // Concatenate parent path
          type: 'folder',
        });

        await Node.findByIdAndUpdate(currentParent._id, {
          $push: { children: subParent._id },
        });

        currentParent = subParent;
      }

      // 4. Create 5 terminal "Child" files
      const leafFiles = [];
      for (let f = 1; f <= 5; f++) {
        const fileTitle = `leaf-file-${f}.ts`;

        const file = await Node.create({
          ...BASE,
          parentId: currentParent._id,
          title: fileTitle,
          path: `${currentParent.path}/${fileTitle}`, // Concatenate parent path
          type: 'file',
          content: `// This is file ${f} inside the deep nested structure of tree ${i}`,
        });
        leafFiles.push(file._id);
      }

      await Node.findByIdAndUpdate(currentParent._id, {
        $push: { children: { $each: leafFiles } },
      });
    }

    console.log('✅ Success: 5 deep-nested trees created (5 levels deep each)');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
