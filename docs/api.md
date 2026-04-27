# API Contract

This frontend is a static Vite React app. All HTTP endpoints are relative to `VITE_API_BASE_URL`. The default file scope is configured by `VITE_DEFAULT_FILE_SCOPE_ID`.

The frontend still uses `projectId` and `node` internally, but the API can treat `projectId` as the active file scope and `node` as a file or folder.

## General Rules

| Rule | Contract |
| --- | --- |
| Request format | JSON |
| Mutating request header | `Content-Type: application/json` |
| Success status | Any `2xx` status |
| Error status | Any non-`2xx` status |
| Error response | Optional `message` string |
| Authentication | None required by default |
| CORS | Must allow browser requests from the frontend origin |

## Endpoints

### GET `/api/projects/:projectId`

Returns metadata for the active file scope. The frontend reads the `project` field from the response.

#### Parameters

| Name | Location | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `projectId` | Path | string | Yes | File scope identifier. |

#### Response

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `project` | FileScope | Yes | Active file scope metadata. |
| `project._id` | string | Yes | File scope identifier. |
| `project.title` | string | Yes | Display name shown in the file sidebar footer. |
| `project.nodes` | FileNode array | No | Optional embedded file tree. |
| `project.archived` | ArchivedState | No | Optional archived metadata. |

### GET `/api/projects/:projectId/nodes`

Returns the file tree for the active file scope. The frontend sends `exclude=content,updatedAt` to avoid loading full file contents in the tree.

#### Parameters

| Name | Location | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `projectId` | Path | string | Yes | File scope identifier. |
| `exclude` | Query | string | No | Comma-separated fields to omit. The frontend sends `content,updatedAt`. |

#### Response

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `nodes` | FileNode array | Yes | Root-level file tree nodes. |
| `nodes[]._id` | string | Yes | Stable node identifier. |
| `nodes[].projectId` | string | Yes | File scope identifier. |
| `nodes[].parentId` | string or null | Yes | Parent folder id. `null` means root. |
| `nodes[].type` | `file` or `folder` | Yes | Node kind. |
| `nodes[].title` | string | Yes | File or folder name. |
| `nodes[].path` | string | No | Display or lookup path. |
| `nodes[].children` | FileNode array | Yes | Nested child nodes. Use an empty array for files and empty folders. |
| `nodes[].content` | string or null | No | Usually omitted from tree responses. |
| `nodes[].archived` | ArchivedState | No | Optional archived metadata. |
| `nodes[].createdAt` | string | No | ISO timestamp. |

### GET `/api/nodes/:nodeId`

Returns one file or folder. For file nodes, include `content` so the editor can load the markdown body.

#### Parameters

| Name | Location | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `nodeId` | Path | string | Yes | File or folder node identifier. |

#### Response

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `_id` | string | Yes | Stable node identifier. |
| `projectId` | string | Yes | File scope identifier. |
| `parentId` | string or null | Yes | Parent folder id. `null` means root. |
| `type` | `file` or `folder` | Yes | Node kind. |
| `title` | string | Yes | File or folder name. |
| `path` | string | No | Display or lookup path. |
| `children` | FileNode array | Yes | Nested child nodes. Use an empty array for files and empty folders. |
| `content` | string or null | No | Markdown content. Required for editable file nodes. |
| `archived` | ArchivedState | No | Optional archived metadata. |
| `createdAt` | string | No | ISO timestamp. |

### POST `/api/nodes`

Creates a file or folder in the active file scope.

#### Parameters

| Name | Location | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `projectId` | Body | string | Yes | File scope identifier. |
| `parentId` | Body | string or null | Yes | Parent folder id. `null` creates at root. |
| `type` | Body | `file` or `folder` | Yes | Node kind to create. |
| `title` | Body | string | Yes | File or folder name. |

#### Response

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `_id` | string | Yes | Created node identifier when returning FileNode directly. |
| `projectId` | string | Yes | File scope identifier when returning FileNode directly. |
| `parentId` | string or null | Yes | Parent folder id when returning FileNode directly. |
| `type` | `file` or `folder` | Yes | Created node kind when returning FileNode directly. |
| `title` | string | Yes | Created node title when returning FileNode directly. |
| `children` | FileNode array | Yes | Created node children when returning FileNode directly. |
| `data` | FileNode | No | Alternative response wrapper. The frontend accepts either FileNode directly or `data` containing FileNode. |

### PATCH `/api/nodes/:nodeId`

Renames a file or folder, or saves markdown content for a file.

#### Parameters

| Name | Location | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `nodeId` | Path | string | Yes | File or folder node identifier. |
| `_id` | Body | string | Yes | Same node identifier as `nodeId`. |
| `title` | Body | string | No | New file or folder name. |
| `content` | Body | string | No | Markdown content to save. |

#### Response

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `_id` | string | No | Updated node identifier. |
| `projectId` | string | No | File scope identifier. |
| `parentId` | string or null | No | Parent folder id. |
| `type` | `file` or `folder` | No | Node kind. |
| `title` | string | No | Updated title. |
| `content` | string or null | No | Updated markdown content. |
| `children` | FileNode array | No | Nested child nodes. |
| `message` | string | No | Success message if returning a success envelope. |

### POST `/api/nodes/move`

Moves a file or folder to another folder or to the root.

#### Parameters

| Name | Location | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `_id` | Body | string | Yes | Node identifier to move. |
| `parentId` | Body | string or null | Yes | New parent folder id. `null` moves to root. |

#### Response

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `_id` | string | No | Moved node identifier. |
| `parentId` | string or null | No | Updated parent folder id. |
| `path` | string | No | Updated path if the API maintains paths. |
| `message` | string | No | Success message if returning a success envelope. |

### DELETE `/api/nodes/:nodeId`

Deletes or trashes a file or folder. The frontend treats this as a delete action; the API may soft-delete or hard-delete.

#### Parameters

| Name | Location | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `nodeId` | Path | string | Yes | File or folder node identifier. |
| `_id` | Body | string | Yes | Same node identifier as `nodeId`. |

#### Response

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `_id` | string | No | Deleted or trashed node identifier. |
| `archived` | ArchivedState | No | Archive state if soft-deleted. |
| `message` | string | No | Success message if returning a success envelope. |

### POST `/api/nodes/restore`

Restores previously deleted nodes. Used by undo flows.

#### Parameters

| Name | Location | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `nodes` | Body | FileNode array | Yes | Nodes to restore. |
| `nodes[]._id` | Body | string | Yes | Node identifier. |
| `nodes[].projectId` | Body | string | Yes | File scope identifier. |
| `nodes[].parentId` | Body | string or null | Yes | Parent folder id. |
| `nodes[].type` | Body | `file` or `folder` | Yes | Node kind. |
| `nodes[].title` | Body | string | Yes | File or folder name. |
| `nodes[].children` | Body | FileNode array | Yes | Nested child nodes. |

#### Response

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `nodes` | FileNode array | No | Restored nodes. |
| `message` | string | No | Success message if returning a success envelope. |

### POST `/api/projects/:projectId/search`

Searches file titles and contents in the active file scope. Optional, but needed for sidebar search.

#### Parameters

| Name | Location | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `projectId` | Path | string | Yes | File scope identifier. |
| `query` | Body | string | Yes | Search text. |

#### Response

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `[]` | SearchResult array | Yes | Search result list. |
| `[].nodeId` | string | Yes | Matching file node id. |
| `[].title` | string | Yes | Matching file title. |
| `[].matches` | SearchMatch array | Yes | Matching lines. |
| `[].matches[].line` | number | No | Line number if available. |
| `[].matches[].lineContent` | string | Yes | Full line text used for display. |
| `[].matches[].text` | string | Yes | Matched text. |
| `[].matches[].index` | number | Yes | Character offset for jump behavior. |
| `[].matches[].matchIndices` | number array | Yes | Highlight start positions in the line. |

### GET `/api/nodes/:nodeId/backlinks`

Returns linked and unlinked backlink matches for one node. Optional, but needed for the backlink sidebar.

#### Parameters

| Name | Location | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `nodeId` | Path | string | Yes | File node identifier. |

#### Response

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `linked` | Backlink array | Yes | Explicit linked references. |
| `unlinked` | Backlink array | Yes | Suggested unlinked mentions. |
| `linked[]._id` | string | Yes | Source node id. |
| `linked[].title` | string | Yes | Source node title. |
| `linked[].path` | string | Yes | Source node path. |
| `linked[].type` | `file` or `folder` | Yes | Source node type. |
| `linked[].mentions` | BacklinkMention array | Yes | Individual mention locations. |
| `linked[].mentions[].excerpt` | string | Yes | Display text around the match. |
| `linked[].mentions[].line` | number | Yes | Line number. |
| `linked[].mentions[].index` | number | Yes | Character offset. |
| `linked[].mentions[].length` | number | Yes | Match length. |
| `linked[].mentions[].alias` | string | No | Optional link alias. |
| `unlinked[]` | Backlink | Yes | Same shape as `linked[]`. |

### GET `/api/nodes/:nodeId/outlines`

Returns the markdown heading outline for one file. Optional, but needed for the outline sidebar.

#### Parameters

| Name | Location | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `nodeId` | Path | string | Yes | File node identifier. |

#### Response

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `[]` | OutlineNode array | Yes | Heading outline list. |
| `[].text` | string | Yes | Heading text. |
| `[].level` | number | Yes | Heading level. |
| `[].children` | OutlineNode array | Yes | Nested headings. |

### GET `/api/projects/:projectId/properties`

Returns markdown/frontmatter property counts for the active file scope. Optional, but needed for the properties sidebar.

#### Parameters

| Name | Location | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `projectId` | Path | string | Yes | File scope identifier. |

#### Response

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `[]` | PropertyStat array | Yes | Property count list. |
| `[].key` | string | Yes | Property name. |
| `[].count` | number | Yes | Number of occurrences. |

### GET `/api/projects/:projectId/tags`

Returns tag counts for the active file scope. Optional, but needed for the tags sidebar.

#### Parameters

| Name | Location | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `projectId` | Path | string | Yes | File scope identifier. |

#### Response

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `[]` | TagStat array | Yes | Tag count list. |
| `[].name` | string | Yes | Tag name. |
| `[].count` | number | Yes | Number of occurrences. |

### GET `/api/projects/:projectId/graph-view`

Returns graph nodes and links for the active file scope. Optional, but needed for the graph tab.

#### Parameters

| Name | Location | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `projectId` | Path | string | Yes | File scope identifier. |

#### Response

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `d3Nodes` | GraphNode array | Yes | Graph nodes. |
| `d3Nodes[]._id` | string | Yes | Graph node id. |
| `d3Nodes[].title` | string | Yes | Display label. |
| `d3Nodes[].path` | string | No | File path if available. |
| `d3Nodes[].content` | string or null | No | Optional content. |
| `d3Nodes[].type` | `file` or `tag` | Yes | Graph node category. |
| `d3Nodes[].x` | number | Yes | D3 x coordinate. |
| `d3Nodes[].y` | number | Yes | D3 y coordinate. |
| `d3Nodes[].vx` | number | Yes | D3 x velocity. |
| `d3Nodes[].vy` | number | Yes | D3 y velocity. |
| `d3Nodes[].fx` | number or null | No | Fixed x coordinate. |
| `d3Nodes[].fy` | number or null | No | Fixed y coordinate. |
| `d3Nodes[].radius` | number | Yes | Render radius. |
| `d3Links` | GraphLink array | Yes | Graph links. |
| `d3Links[].source` | string | Yes | Source node id. |
| `d3Links[].target` | string | Yes | Target node id. |

### WebSocket `VITE_WS_URL`

Optional realtime collaboration endpoint. If `VITE_WS_URL` is unset, the frontend uses REST load/save only.

#### Parameters

| Name | Location | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `VITE_WS_URL` | Environment | string | No | Hocuspocus/Yjs-compatible WebSocket URL. |
| File document name | WebSocket document | string | Yes, when realtime is enabled | File node id. |
| Editor text field | Yjs text field | string | Yes, when realtime is enabled | `codemirror`. |
| Presence document name | WebSocket document | string | Yes, when realtime is enabled | `project-presence-${projectId}`. |
| Presence sync map | Yjs map | string | Yes, when realtime is enabled | `sync-state`. |

#### Response

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| Awareness state `user.id` | string | Yes, when realtime is enabled | Client/user id. |
| Awareness state `user.name` | string | Yes, when realtime is enabled | Display name. |
| Awareness state `user.color` | string | Yes, when realtime is enabled | Display color. |

## Minimum First Integration

| Priority | Method | Route | Purpose |
| --- | --- | --- | --- |
| 1 | GET | `/api/projects/:projectId` | Load file scope metadata. |
| 1 | GET | `/api/projects/:projectId/nodes` | Load file tree. |
| 1 | GET | `/api/nodes/:nodeId` | Load file content. |
| 1 | POST | `/api/nodes` | Create files and folders. |
| 1 | PATCH | `/api/nodes/:nodeId` | Rename and save markdown content. |
| 1 | POST | `/api/nodes/move` | Move files and folders. |
| 1 | DELETE | `/api/nodes/:nodeId` | Delete files and folders. |
| 2 | POST | `/api/nodes/restore` | Support undo restore. |
| 3 | POST | `/api/projects/:projectId/search` | Support sidebar search. |
| 3 | GET | `/api/nodes/:nodeId/backlinks` | Support backlinks. |
| 3 | GET | `/api/nodes/:nodeId/outlines` | Support outline. |
| 3 | GET | `/api/projects/:projectId/properties` | Support properties. |
| 3 | GET | `/api/projects/:projectId/tags` | Support tags. |
| 3 | GET | `/api/projects/:projectId/graph-view` | Support graph view. |
