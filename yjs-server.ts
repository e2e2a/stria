import 'dotenv/config';
import { Server } from '@hocuspocus/server';
import { Logger } from '@hocuspocus/extension-logger';
import Node from './modules/projects/nodes/node.model';
import connectDb from './lib/db/connection';
import * as Y from 'yjs';

const saveTimers = new Map<string, NodeJS.Timeout>();

const dirtyTracker = new Map<string, { content: boolean; chunks: boolean }>();

async function debouncedSave(documentName: string, document: Y.Doc) {
  if (saveTimers.has(documentName)) {
    clearTimeout(saveTimers.get(documentName)!);
  }

  saveTimers.set(
    documentName,
    setTimeout(async () => {
      const tracker = dirtyTracker.get(documentName);
      if (!tracker) return;

      const updateData: { content?: string; chunks?: [number, number][] } = {};

      if (tracker.content) {
        updateData.content = document.getText('codemirror').toString();
        tracker.content = false;
      }

      if (tracker.chunks) {
        updateData.chunks = (document.getMap('chunk-state').get('splits') as [number, number][]) || [];
        tracker.chunks = false;
      }

      saveTimers.delete(documentName);

      if (Object.keys(updateData).length > 0) {
        try {
          console.log(`[DB] Saving fields:`, Object.keys(updateData));
          await Node.findByIdAndUpdate(documentName, updateData, { new: true });
          console.log(`✅ Saved ${documentName} to DB`);
        } catch (error) {
          console.error(`[DB Error] Failed to save node ${documentName}:`, error);
        }
      }
    }, 1000)
  );
}

async function start() {
  await connectDb();
  const server = new Server({
    port: 1234,
    unloadImmediately: true,
    quiet: true,

    extensions: [new Logger()],
    async onConnect(data) {
      const room = data.instance.documents.get(data.documentName);
      const userCount = room ? room.connections.size : 0;
      console.log(`Users in ${data.documentName}: ${userCount}`);
    },

    async onLoadDocument({ documentName, document }) {
      if (documentName.startsWith('project-presence-')) return document;

      console.log(`Loaded document "${documentName}"`);

      dirtyTracker.set(documentName, { content: false, chunks: false });

      const ytext = document.getText('codemirror');
      const ymap = document.getMap('chunk-state');

      let initialized = false;

      const loadFromDB = async () => {
        if (initialized) return;
        initialized = true;

        const node = await Node.findById(documentName);

        document.transact(() => {
          let loadedSomething = false;

          if (node?.content && ytext.length === 0) {
            const normalizedContent = node.content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            ytext.insert(0, normalizedContent);
            loadedSomething = true;
          }

          if (node?.chunks && !ymap.has('splits')) {
            ymap.set('splits', node.chunks);
            loadedSomething = true;
          }

          if (loadedSomething) {
            console.log('DB content and chunks inserted');
          }
        }, 'initial-load');
      };

      const timeout = setTimeout(loadFromDB, 100);

      const cancelDBLoad = () => {
        if (!initialized) {
          initialized = true;
          clearTimeout(timeout);
          console.log('Client state arrived, skipping DB load');
        }
      };

      ytext.observe(event => {
        cancelDBLoad();
        if (event.transaction.origin !== 'initial-load') {
          const tracker = dirtyTracker.get(documentName);
          if (tracker) tracker.content = true;
        }
      });

      ymap.observe(event => {
        cancelDBLoad();
        if (event.transaction.origin !== 'initial-load') {
          const tracker = dirtyTracker.get(documentName);
          if (tracker) tracker.chunks = true;
        }
      });

      return document;
    },

    async onStoreDocument({ documentName, document }) {
      if (documentName.startsWith('project-presence-')) return;
      debouncedSave(documentName, document);
    },
  });

  server.listen();
}
start();
