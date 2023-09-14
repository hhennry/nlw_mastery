import { fastify } from "fastify";
import { fastifyCors } from "@fastify/cors";
import { getAllPrompts } from "./routes/get-all-prompts";
import { getAllVideos } from "./routes/upload-video";
import { createTranscriptionRoutes } from "./routes/create-transcription";
import { generateAICompleteRoute } from "./routes/generate-ai-completion";

const app = fastify();

app.register(fastifyCors, {
  origin: "*",
});

app.register(getAllPrompts);
app.register(getAllVideos);
app.register(createTranscriptionRoutes);
app.register(generateAICompleteRoute);

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log("Funcionou!");
  });
