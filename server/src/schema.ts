import { Schema, model } from "mongoose";

const documentSchema = new Schema({
  _id: String,
  data: Object,
});

export default model("Document", documentSchema);
