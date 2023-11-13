import { Server } from "socket.io";
import { connect } from "mongoose";
import { config } from "dotenv";

import DocumentModel from "./schema";

config();

connect(process.env.DATABASE_URI || "mongodb://localhost:27017/EditIT");

const INITIAL_DATA = "";

const io = new Server(8000, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("get-document", async (docId) => {
    const document = await findOrCreateDocument(docId);
    socket.join(docId);

    socket.emit("load-document", document?.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(docId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      const document = await DocumentModel.findById(docId);
      if (!document) return;
      document.data = data;
      await document.save();
    });
  });
});

async function findOrCreateDocument(id?: string) {
  if (id == null) return;
  const document = await DocumentModel.findById(id);
  return (
    document ?? (await DocumentModel.create({ _id: id, data: INITIAL_DATA }))
  );
}
