"use client";

import { useEffect, useState } from "react";

import { getElement, type ElementId } from "@/entities/element";
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

type Slot = "welcome" | ElementId;
type Video = { slot: Slot; videoUrl: string | null; body: string };

function slotTitle(slot: Slot) {
  return slot === "welcome" ? "Приветственное видео" : `Видео по стихии ${getElement(slot).genitive}`;
}

function VideoForm({ video }: { video: Video }) {
  const [videoUrl, setVideoUrl] = useState(video.videoUrl ?? "");
  const [body, setBody] = useState(video.body);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setPending(true);
    setMessage(null);
    try {
      await request("/api/admin/library", { method: "POST", body: JSON.stringify({ slot: video.slot, videoUrl, body }) });
      setMessage({ ok: true, text: "Сохранено" });
    } catch (saveError) {
      setMessage({ ok: false, text: (saveError as Error).message });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border bg-background p-4">
      <h2 className="font-semibold">{slotTitle(video.slot)}</h2>
      {video.slot === "welcome" && (
        <p className="text-sm text-muted-foreground">
          Открывается перед первым входом в программу, пока человек не нажмёт «Просмотрено».
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor={`${video.slot}-url`}>Ссылка на YouTube</Label>
        <Input
          id={`${video.slot}-url`}
          className="h-11"
          placeholder="https://youtu.be/…"
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${video.slot}-body`}>Текст под видео</Label>
        <Textarea id={`${video.slot}-body`} value={body} onChange={(event) => setBody(event.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <Button className="h-11" disabled={pending} onClick={() => void save()}>
          Сохранить
        </Button>
        {message && (
          <span role={message.ok ? undefined : "alert"} className={message.ok ? "text-sm text-primary" : "text-sm text-destructive"}>
            {message.text}
          </span>
        )}
      </div>
    </section>
  );
}

/** Раздел «Библиотека»: приветственное видео и видео по стихиям. Книги появятся на этапе библиотеки. */
export function AdminLibraryPage() {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isStaticPrototype) return;
    request<Video[]>("/api/admin/library")
      .then(setVideos)
      .catch((loadError: Error) => setError(loadError.message));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold">Библиотека</h1>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!videos && !error && <p className="text-sm text-muted-foreground">Загружаем…</p>}
      {videos?.map((video) => <VideoForm key={video.slot} video={video} />)}
      <section className="rounded-2xl border bg-background p-4">
        <h2 className="font-semibold">Книги</h2>
        <p className="text-sm text-muted-foreground">Загрузка книг появится на этапе библиотеки.</p>
      </section>
    </div>
  );
}
