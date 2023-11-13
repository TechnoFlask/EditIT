import TextEditor from "./Components/TextEditor";
import { Routes, Route, Navigate } from "react-router-dom";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        index
        element={<Navigate to={`/documents/${crypto.randomUUID()}`} replace />}
      />
      <Route path="/documents/:id" element={<TextEditor />} />
    </Routes>
  );
}
