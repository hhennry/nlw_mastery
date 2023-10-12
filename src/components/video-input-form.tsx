import { Label } from "@radix-ui/react-label";
import { Separator } from "@radix-ui/react-separator";
import { FileVideo, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { server } from "@/lib/axios";

export function VideoInpuForm() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  function headFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget;

    if (!files) {
      return;
    }

    const selectedFile = files[0];

    setVideoFile(selectedFile);
  }

  const previewURL = useMemo(() => {
    if (!videoFile) {
      return null;
    }
    return URL.createObjectURL(videoFile);
  }, [videoFile]);

  async function convertVideoToAudio(video: File) {
    console.log("Converção iniciada.");

    const ffmpeg = await getFFmpeg();

    await ffmpeg.writeFile("input.mp4", await fetchFile(video));

    // ffmpeg.on("log", log => {
    //     console.log(log)
    // })

    ffmpeg.on("progress", (progress) => {
      console.log(
        "Progresso da converção:" + Math.round(progress.progress * 100)
      );
    });

    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-map",
      "0:a",
      "-b:a",
      "20k",
      "-acodec",
      "libmp3lame",
      "output.mp3",
    ]);

    const data = await ffmpeg.readFile("output.mp3");

    const audioFileBlob = new Blob([data], { type: "audio/mpeg" });
    const audioFile = new File([audioFileBlob], "audio.mp3", {
      type: "audio/mpeg",
    });

    console.log("Converção finalizada.");

    return audioFile;
  }

  async function headUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const prompt = promptInputRef.current?.value;

    if (!videoFile) {
      return;
    }

    const audioFile = await convertVideoToAudio(videoFile);

    const data = new FormData();

    data.append("file", audioFile);

    const response = await server.post("/videos", data);

    console.log(response.data);
  }

  return (
    <form className="space-y-6" onSubmit={headUploadVideo}>
      <label
        htmlFor="video"
        className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/10"
      >
        {previewURL ? (
          <video
            src={previewURL}
            controls={false}
            className="pointer-events-none inset-0"
          />
        ) : (
          <>
            <FileVideo className="w-4 h-4" />
            Selecionar vídeo
          </>
        )}
      </label>
      <input
        type="file"
        id="video"
        accept="video/mp4"
        className="sr-only"
        onChange={headFileSelect}
      />
      <Separator />
      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>
        <Textarea
          ref={promptInputRef}
          id="transcription_prompt"
          className="h-20 leading-relaxed resize-none"
          placeholder="Inclua palavras chaves"
        />
      </div>
      <Button type="submit" className="w-full gap-2">
        Carregar vídeo
        <Upload className="w-4 h-4" />
      </Button>
    </form>
  );
}
