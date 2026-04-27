import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { ProjectSingleClient } from '@/components/project/editor/ProjectSingleClient';

function FileEditorRoute() {
  const { pid } = useParams();
  if (!pid) return <Navigate to={`/files/${import.meta.env.VITE_DEFAULT_FILE_SCOPE_ID || 'default'}`} replace />;
  return <ProjectSingleClient />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/files/${import.meta.env.VITE_DEFAULT_FILE_SCOPE_ID || 'default'}`} replace />} />
      <Route path="/files" element={<FileEditorRoute />} />
      <Route path="/files/:pid" element={<FileEditorRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
