import "quill/dist/quill.snow.css";
import Quill, { TextChangeHandler } from "quill";
import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useParams } from "react-router-dom";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ size: ["small", false, "large", "huge"] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  ["blockquote", "code-block", "image"],
  [{ align: [] }, { list: "ordered" }, { list: "bullet" }],
  ["clean"],
];

const SAVE_INTERVAL_MS = 2000;

export default function TextEditor() {
  const [socket, setSocket] = useState<Socket>();
  const [quill, setQuill] = useState<Quill>();
  const { id: documentId } = useParams();

  // Socket connection useEffect
  useEffect(() => {
    console.log(import.meta.env.VITE_SERVER_URL);
    const s = io(import.meta.env.VITE_SERVER_URL || "http://localhost:8000");
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  // Load document useEffect
  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", (documentData) => {
      quill.setText("");
      quill.setContents(documentData);
      quill.enable();
    });

    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  // Save document useEffect
  useEffect(() => {
    if (socket == null || quill == null) return;
    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [socket, quill]);

  // Quill text change receive and update useEffect
  useEffect(() => {
    if (socket == null || quill == null) return;
    const handler: TextChangeHandler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  // Quill text change send useEffect
  useEffect(() => {
    if (socket == null || quill == null) return;
    const handler: TextChangeHandler = (delta, _, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handler);
    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  // Quill editor init useEffect/useCallback
  const wrapperRef = useCallback((wrapper: HTMLDivElement) => {
    if (wrapper == null) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      placeholder: "Start here....",
      theme: "snow",
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
    });
    q.setText("Loading....");
    q?.disable();
    setQuill(q);
  }, []);
  return <div id="editor" ref={wrapperRef}></div>;
}
