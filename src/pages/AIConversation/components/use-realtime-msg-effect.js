import { useEffect } from "react";
import { useConversationStore } from "./use-conversation-store";
import { useDeviceStore } from "./use-device-store";
import { base64ToArrayBuffer, mergeInt16Arrays } from "./audio-utils";

const useRealtimeMsgEffect = (wsInstance) => {
  const { setCurrentSessionId, setCurrentSessionList } = useConversationStore();
  const { wavStreamPlayer } = useDeviceStore();

  useEffect(() => {
    const parsedData = JSON.parse(wsInstance.lastMessage?.data ?? "{}");

    if (parsedData.type === "session.created") {
      console.info("session.created");
      setCurrentSessionId(parsedData.session.id);
      setCurrentSessionList(() => {
        return { id: parsedData.session.id, message: [] };
      });
    }

    if (parsedData.type === "conversation.item.created") {
      console.info("conversation.item.created");
      const currentEventId = parsedData.event_id;
      const currentEventName = parsedData.type;
      const currentItemId = parsedData.item.id;
      const currentRole = parsedData.item.role;
      const userContent = parsedData.item.content?.at(0).text;
      const currentPreviousItemId = parsedData.previous_item_id;

      if (currentRole === "assistant") {
        setCurrentSessionList((prev) => ({
          ...prev,
          message: [
            ...prev.message,
            {
              msgType: "realtime",
              eventId: currentEventId,
              eventName: currentEventName,
              itemId: currentItemId,
              previousItemId: currentPreviousItemId,
              role: currentRole,
              isStreaming: false,
            },
          ],
        }));
      }

      if (currentRole === "user") {
        setCurrentSessionList((prev) => ({
          ...prev,
          message: [
            ...prev.message,
            {
              msgType: "realtime",
              eventId: currentEventId,
              eventName: currentEventName,
              itemId: currentItemId,
              previousItemId: currentPreviousItemId,
              role: currentRole,
              isStreaming: false,
              textFinal: userContent,
            },
          ],
        }));
      }
    }

    if (parsedData.type === "response.audio_transcript.delta") {
      console.info("response.audio_transcript.delta");
      const currentEventId = parsedData.event_id;
      const currentEventName = parsedData.type;
      const currentItemId = parsedData.item_id;
      const currentDelta = parsedData.delta;

      setCurrentSessionList((prev) => ({
        ...prev,
        message: prev.message.map((item) => {
          if (item.msgType === "realtime" && item.itemId === currentItemId) {
            return {
              ...item,
              eventId: currentEventId,
              eventName: currentEventName,
              textDelta: (item.textDelta ?? "") + currentDelta,
              isStreaming: true,
            };
          }

          return item;
        }),
      }));
    }

    if (parsedData.type === "response.audio_transcript.done") {
      console.info("response.audio_transcript.done");
      const currentEventId = parsedData.event_id;
      const currentEventName = parsedData.type;
      const currentItemId = parsedData.item_id;
      const currentTranscript = parsedData.transcript;

      setCurrentSessionList((prev) => ({
        ...prev,
        message: prev.message.map((item) => {
          if (item.msgType === "realtime" && item.itemId === currentItemId) {
            return {
              ...item,
              eventId: currentEventId,
              eventName: currentEventName,
              textDelta: undefined,
              textFinal: currentTranscript,
              isStreaming: false,
            };
          }

          return item;
        }),
      }));
    }

    if (parsedData.type === "response.audio.delta") {
      console.info("response.audio.delta");
      const currentEventId = parsedData.event_id;
      const currentEventName = parsedData.type;
      const currentItemId = parsedData.item_id;
      const currentDelta = parsedData.delta;

      const audioArrayBuffer = base64ToArrayBuffer(currentDelta);
      const audioInt16ArrayBuffer = new Int16Array(audioArrayBuffer);

      setCurrentSessionList((prev) => ({
        ...prev,
        message: prev.message.map((item) => {
          if (item.msgType === "realtime" && item.itemId === currentItemId) {
            return {
              ...item,
              eventId: currentEventId,
              eventName: currentEventName,
              audioDelta: audioInt16ArrayBuffer,
              audioFinal: mergeInt16Arrays(
                item.audioFinal ?? new Int16Array(0),
                audioInt16ArrayBuffer
              ),
              isStreaming: true,
            };
          }

          return item;
        }),
      }));
    }

    if (parsedData.type === "response.audio.done") {
      console.info("response.audio.done");
      const currentEventId = parsedData.event_id;
      const currentItemId = parsedData.item_id;
      const currentEventName = parsedData.type;

      setCurrentSessionList((prev) => ({
        ...prev,
        message: prev.message.map((item) => {
          if (item.msgType === "realtime" && item.itemId === currentItemId) {
            return {
              ...item,
              eventId: currentEventId,
              eventName: currentEventName,
              audioDelta: undefined,
              isStreaming: false,
            };
          }

          return item;
        }),
      }));
    }

    if (
      parsedData.type ===
      "conversation.item.input_audio_transcription.completed"
    ) {
      console.info("conversation.item.input_audio_transcription.completed");
      const currentEventId = parsedData.event_id;
      const currentItemId = parsedData.item_id;
      const currentEventName = parsedData.type;
      const currenttranscript = parsedData.transcript;

      setCurrentSessionList((prev) => ({
        ...prev,
        message: prev.message.map((item) => {
          if (item.msgType === "realtime" && item.itemId === currentItemId) {
            return {
              ...item,
              eventId: currentEventId,
              eventName: currentEventName,
              textFinal: currenttranscript,
            };
          }

          return item;
        }),
      }));
    }

    if (parsedData.type === "input_audio_buffer.speech_started") {
      console.info("input_audio_buffer.speech_started");
      wavStreamPlayer.interrupt();
    }

    if (parsedData.type === "input_audio_buffer.speech_stopped") {
      console.info("input_audio_buffer.speech_stopped");
    }

    if (parsedData.type === "response.created") {
      console.info("response.created");
      wavStreamPlayer.interrupt();
    }

    // 处理响应完成事件
    if (parsedData.type === "response.done") {
      console.info("response.done");
    }
  }, [wsInstance.lastMessage?.data]);
};

export default useRealtimeMsgEffect;
export { useRealtimeMsgEffect };
