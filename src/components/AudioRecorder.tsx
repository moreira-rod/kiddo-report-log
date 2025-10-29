import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Play, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AudioRecorderProps {
  studentId: string;
  onAudioSaved: (url: string) => void;
  existingAudioUrl?: string;
}

const AudioRecorder = ({ studentId, onAudioSaved, existingAudioUrl }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(existingAudioUrl || "");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await uploadAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error("Erro ao acessar microfone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudio = async (audioBlob: Blob) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `${user?.id}/${studentId}/${Date.now()}.webm`;

      const { error: uploadError } = await supabase.storage
        .from("audio-notes")
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("audio-notes")
        .getPublicUrl(fileName);

      setAudioUrl(publicUrl);
      onAudioSaved(publicUrl);
      toast.success("Áudio gravado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar áudio");
    }
  };

  const deleteAudio = async () => {
    if (!audioUrl) return;

    try {
      const urlParts = audioUrl.split("/");
      const fileName = urlParts.slice(-3).join("/");

      const { error } = await supabase.storage
        .from("audio-notes")
        .remove([fileName]);

      if (error) throw error;

      setAudioUrl("");
      onAudioSaved("");
      toast.success("Áudio excluído");
    } catch (error) {
      toast.error("Erro ao excluir áudio");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Áudio do Dia</h3>
        {audioUrl && !isRecording && (
          <Button variant="ghost" size="sm" onClick={deleteAudio}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {!isRecording && !audioUrl && (
          <Button
            type="button"
            onClick={startRecording}
            variant="outline"
            className="flex-1 gap-2"
          >
            <Mic className="w-4 h-4" />
            Gravar Áudio
          </Button>
        )}

        {isRecording && (
          <Button
            type="button"
            onClick={stopRecording}
            variant="destructive"
            className="flex-1 gap-2"
          >
            <StopCircle className="w-4 h-4" />
            Parar Gravação
          </Button>
        )}

        {audioUrl && !isRecording && (
          <audio src={audioUrl} controls className="flex-1" />
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
