"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Modal,
  message as antdMessage,
  Spin,
} from "antd";

import {
  CommentOutlined,
  SendOutlined,
  UserOutlined,
  PaperClipOutlined,
  FileOutlined,
  AudioOutlined,
  SoundOutlined,
  VideoCameraOutlined,
  CloseOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

import {
  getDoubtComments,
  createDoubtComment,
} from "@/app/services/authService";

function Comment({
  open,
  setOpen,
  doubtId,
  data,
  role,
}) {
  // =====================================================
  // STATE
  // =====================================================

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);

  const [attachment, setAttachment] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  // =====================================================
  // REFS
  // =====================================================

  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);

  const textareaRef = useRef(null);

  // =====================================================
  // VOICE RECORDING REFS
  // =====================================================

  const mediaRecorderRef =
    useRef(null);

  const audioChunksRef =
    useRef([]);

  const mediaStreamRef =
    useRef(null);

  // =====================================================
  // VOICE TO TEXT REF
  // =====================================================

  const speechRecognitionRef =
    useRef(null);

  // =====================================================
  // VOICE STATES
  // =====================================================

  const [isRecording, setIsRecording] =
    useState(false);

  const [recordingTime, setRecordingTime] =
    useState(0);

  const [isListening, setIsListening] =
    useState(false);

  // =====================================================
  // CURRENT USER ROLE
  // =====================================================

  const currentRole = String(
    role || "student"
  ).toLowerCase();

  // =====================================================
  // AUTO RESIZE TEXTAREA
  // =====================================================

  const autoResizeTextarea = (
    textarea
  ) => {
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";

    const maxHeight = 180;

    const newHeight = Math.min(
      textarea.scrollHeight,
      maxHeight
    );

    textarea.style.height =
      `${newHeight}px`;

    textarea.style.overflowY =
      textarea.scrollHeight >
      maxHeight
        ? "auto"
        : "hidden";
  };

  // =====================================================
  // RESET TEXTAREA HEIGHT
  // =====================================================

  const resetTextareaHeight = () => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height =
      "42px";

    textareaRef.current.style.overflowY =
      "hidden";
  };

  // =====================================================
  // GET CURRENT USER NAME
  // =====================================================

  const getCurrentUserName = () => {
    if (currentRole === "admin") {
      return "Admin";
    }

    if (currentRole === "faculty") {
      return "Faculty";
    }

    return "Student";
  };

  // =====================================================
  // SCROLL TO BOTTOM
  // =====================================================

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView(
        {
          behavior: "smooth",
        }
      );
    }, 100);
  };

  // =====================================================
  // USER NAME FALLBACK
  // =====================================================

  const getUserNameFromRole = (
    userRole
  ) => {
    const normalizedRole =
      String(
        userRole || ""
      ).toLowerCase();

    if (
      normalizedRole ===
      "admin"
    ) {
      return "Admin";
    }

    if (
      normalizedRole ===
      "faculty"
    ) {
      return "Faculty";
    }

    if (
      normalizedRole ===
      "student"
    ) {
      return "Student";
    }

    return "User";
  };

  // =====================================================
  // FORMAT API MESSAGE
  // =====================================================

  const formatApiMessage = (
    item
  ) => {
    return {
      id: item.id,

      userId: item.user_id,

      user:
        item.user?.name ||
        item.user?.username ||
        getUserNameFromRole(
          item.user?.role
        ),

      role:
        item.user?.role?.toLowerCase?.() ||
        "",

      type:
        item.message_type ||
        "text",

      message:
        item.message ||
        "",

      time: formatTime(
        item.created_at
      ),

      createdAt:
        item.created_at,

      fileUrl:
        item.attachment_url ||
        null,

      fileName:
        item.attachment
          ? getFileName(
              item.attachment
            )
          : null,

      fileSize:
        null,
    };
  };

  // =====================================================
  // FILE NAME
  // =====================================================

  const getFileName = (
    url
  ) => {
    if (!url) {
      return "File";
    }

    try {
      const cleanUrl =
        url.split("?")[0];

      const parts =
        cleanUrl.split("/");

      return decodeURIComponent(
        parts[
          parts.length - 1
        ] || "File"
      );
    } catch {
      return "File";
    }
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (
    dateString
  ) => {
    if (!dateString) {
      return "";
    }

    try {
      return new Date(
        dateString
      ).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return "";
    }
  };

  // =====================================================
  // LOAD COMMENTS
  // =====================================================

  const loadComments =
    async () => {
      if (!doubtId) {
        return;
      }

      try {
        setLoading(true);

        const response =
          await getDoubtComments(
            doubtId
          );

        const apiData =
          Array.isArray(
            response?.data
          )
            ? response.data
            : response?.data
                ?.results || [];

        const formattedMessages =
          apiData.map(
            formatApiMessage
          );

        setMessages(
          formattedMessages
        );

        scrollToBottom();
      } catch (error) {
        console.error(
          "Failed to load doubt comments:",
          error
        );

        antdMessage.error(
          error?.response?.data
            ?.detail ||
            error?.response?.data
              ?.error ||
            "Failed to load comments."
        );
      } finally {
        setLoading(false);
      }
    };

  // =====================================================
  // FILE TYPE
  // =====================================================

  const getFileType = (
    file
  ) => {
    if (!file) {
      return "document";
    }

    if (
      file.type.startsWith(
        "image/"
      )
    ) {
      return "image";
    }

    if (
      file.type.startsWith(
        "video/"
      )
    ) {
      return "video";
    }

    if (
      file.type.startsWith(
        "audio/"
      )
    ) {
      return "audio";
    }

    return "document";
  };

  // =====================================================
  // FILE SIZE
  // =====================================================

  const formatFileSize = (
    bytes
  ) => {
    if (!bytes) {
      return "";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (
      bytes <
      1024 * 1024
    ) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  // =====================================================
  // SELECT FILE
  // =====================================================

  const handleFileSelect = (
    e
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    const MAX_FILE_SIZE =
      30 * 1024 * 1024;

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      antdMessage.error(
        "File size cannot exceed 30 MB."
      );

      e.target.value = "";

      return;
    }

    const type =
      getFileType(file);

    const previewUrl =
      URL.createObjectURL(
        file
      );

    if (attachment?.url) {
      URL.revokeObjectURL(
        attachment.url
      );
    }

    setAttachment({
      file,
      type,
      name: file.name,
      size: file.size,
      url: previewUrl,
    });

    e.target.value = "";
  };

  // =====================================================
  // REMOVE ATTACHMENT
  // =====================================================

  const removeAttachment =
    () => {
      if (attachment?.url) {
        URL.revokeObjectURL(
          attachment.url
        );
      }

      setAttachment(null);
    };

  // =====================================================
  // VOICE RECORDING
  // =====================================================

  const startVoiceRecording =
    async () => {
      if (
        sending ||
        isRecording
      ) {
        return;
      }

      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices
            .getUserMedia
        ) {
          antdMessage.error(
            "Voice recording is not supported in this browser."
          );

          return;
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        mediaStreamRef.current =
          stream;

        let mimeType =
          "audio/webm";

        if (
          MediaRecorder.isTypeSupported(
            "audio/webm;codecs=opus"
          )
        ) {
          mimeType =
            "audio/webm;codecs=opus";
        } else if (
          MediaRecorder.isTypeSupported(
            "audio/webm"
          )
        ) {
          mimeType =
            "audio/webm";
        } else if (
          MediaRecorder.isTypeSupported(
            "audio/mp4"
          )
        ) {
          mimeType =
            "audio/mp4";
        }

        const mediaRecorder =
          new MediaRecorder(
            stream,
            {
              mimeType,
            }
          );

        mediaRecorderRef.current =
          mediaRecorder;

        audioChunksRef.current =
          [];

        mediaRecorder.ondataavailable =
          (event) => {
            if (
              event.data &&
              event.data.size > 0
            ) {
              audioChunksRef.current.push(
                event.data
              );
            }
          };

        mediaRecorder.onstop =
          () => {
            const audioBlob =
              new Blob(
                audioChunksRef.current,
                {
                  type:
                    mediaRecorder.mimeType ||
                    "audio/webm",
                }
              );

            const MAX_FILE_SIZE =
              30 * 1024 * 1024;

            if (
              audioBlob.size >
              MAX_FILE_SIZE
            ) {
              antdMessage.error(
                "Voice recording cannot exceed 30 MB."
              );

              audioChunksRef.current =
                [];

              return;
            }

            const extension =
              mediaRecorder.mimeType?.includes(
                "mp4"
              )
                ? "mp4"
                : "webm";

            const audioFile =
              new File(
                [audioBlob],
                `voice-message-${Date.now()}.${extension}`,
                {
                  type:
                    mediaRecorder.mimeType ||
                    "audio/webm",
                }
              );

            const previewUrl =
              URL.createObjectURL(
                audioBlob
              );

            if (attachment?.url) {
              URL.revokeObjectURL(
                attachment.url
              );
            }

            setAttachment({
              file: audioFile,
              type: "audio",
              name:
                audioFile.name,
              size:
                audioFile.size,
              url: previewUrl,
            });

            audioChunksRef.current =
              [];

            if (
              mediaStreamRef.current
            ) {
              mediaStreamRef.current
                .getTracks()
                .forEach(
                  (track) =>
                    track.stop()
                );

              mediaStreamRef.current =
                null;
            }

            mediaRecorderRef.current =
              null;
          };

        mediaRecorder.onerror =
          (event) => {
            console.error(
              "MediaRecorder error:",
              event
            );

            antdMessage.error(
              "Voice recording failed."
            );

            cancelVoiceRecording();
          };

        mediaRecorder.start();

        setRecordingTime(0);

        setIsRecording(true);
      } catch (error) {
        console.error(
          "Failed to start voice recording:",
          error
        );

        if (
          error?.name ===
          "NotAllowedError"
        ) {
          antdMessage.error(
            "Microphone permission was denied."
          );
        } else {
          antdMessage.error(
            "Unable to access microphone."
          );
        }
      }
    };

  // =====================================================
  // STOP VOICE RECORDING
  // =====================================================

  const stopVoiceRecording =
    () => {
      if (
        !mediaRecorderRef.current
      ) {
        return;
      }

      if (
        mediaRecorderRef.current
          .state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      setIsRecording(false);

      setRecordingTime(0);
    };

  // =====================================================
  // CANCEL VOICE RECORDING
  // =====================================================

  const cancelVoiceRecording =
    () => {
      const recorder =
        mediaRecorderRef.current;

      if (recorder) {
        recorder.ondataavailable =
          null;

        recorder.onstop = null;

        recorder.onerror = null;

        if (
          recorder.state !==
          "inactive"
        ) {
          recorder.stop();
        }
      }

      if (
        mediaStreamRef.current
      ) {
        mediaStreamRef.current
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        mediaStreamRef.current =
          null;
      }

      mediaRecorderRef.current =
        null;

      audioChunksRef.current =
        [];

      setIsRecording(false);

      setRecordingTime(0);
    };

  // =====================================================
  // RECORDING TIMER
  // =====================================================

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const timer =
      setInterval(() => {
        setRecordingTime(
          (prev) => prev + 1
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [isRecording]);

  // =====================================================
  // FORMAT RECORDING TIME
  // =====================================================

  const formatRecordingTime =
    (seconds) => {
      const minutes =
        Math.floor(
          seconds / 60
        );

      const remainingSeconds =
        seconds % 60;

      return `${String(
        minutes
      ).padStart(
        2,
        "0"
      )}:${String(
        remainingSeconds
      ).padStart(
        2,
        "0"
      )}`;
    };

  // =====================================================
  // VOICE TO TEXT
  // =====================================================

  const startVoiceToText =
    () => {
      if (
        sending ||
        isListening ||
        isRecording
      ) {
        return;
      }

      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        antdMessage.error(
          "Voice-to-text is not supported in this browser. Please use Chrome."
        );

        return;
      }

      try {
        const recognition =
          new SpeechRecognition();

        speechRecognitionRef.current =
          recognition;

        recognition.continuous =
          true;

        recognition.interimResults =
          true;

        recognition.lang =
          "en-IN";

        let finalTranscript =
          message.trim();

        recognition.onstart =
          () => {
            setIsListening(true);
          };

        recognition.onresult =
          (event) => {
            let interimTranscript =
              "";

            let newFinalText =
              finalTranscript;

            for (
              let i =
                event.resultIndex;
              i <
              event.results.length;
              i++
            ) {
              const result =
                event.results[i];

              const transcript =
                result[0]
                  ?.transcript || "";

              if (
                result.isFinal
              ) {
                newFinalText =
                  `${newFinalText}${
                    newFinalText
                      ? " "
                      : ""
                  }${transcript.trim()}`;

                finalTranscript =
                  newFinalText;
              } else {
                interimTranscript +=
                  transcript;
              }
            }

            const combinedText =
              `${finalTranscript}${
                interimTranscript
                  ? `${
                      finalTranscript
                        ? " "
                        : ""
                    }${interimTranscript}`
                  : ""
              }`.trim();

            setMessage(
              combinedText
            );

            // Auto-grow textarea
            requestAnimationFrame(
              () => {
                autoResizeTextarea(
                  textareaRef.current
                );
              }
            );
          };

        recognition.onerror =
          (event) => {
            console.error(
              "Speech recognition error:",
              event.error
            );

            if (
              event.error ===
              "not-allowed"
            ) {
              antdMessage.error(
                "Microphone permission was denied."
              );
            } else if (
              event.error ===
              "no-speech"
            ) {
              antdMessage.info(
                "No speech detected."
              );
            } else if (
              event.error !==
              "aborted"
            ) {
              antdMessage.error(
                "Voice-to-text could not start."
              );
            }

            setIsListening(false);

            speechRecognitionRef.current =
              null;
          };

        recognition.onend =
          () => {
            setIsListening(
              false
            );

            speechRecognitionRef.current =
              null;
          };

        recognition.start();
      } catch (error) {
        console.error(
          "Failed to start voice-to-text:",
          error
        );

        setIsListening(false);

        speechRecognitionRef.current =
          null;

        antdMessage.error(
          "Unable to start voice-to-text."
        );
      }
    };

  // =====================================================
  // STOP VOICE TO TEXT
  // =====================================================

  const stopVoiceToText =
    () => {
      if (
        speechRecognitionRef.current
      ) {
        try {
          speechRecognitionRef.current.stop();
        } catch (error) {
          console.error(
            "Failed to stop speech recognition:",
            error
          );
        }

        speechRecognitionRef.current =
          null;
      }

      setIsListening(false);
    };

  // =====================================================
  // LOAD WHEN MODAL OPENS
  // =====================================================

  useEffect(() => {
    if (open && doubtId) {
      loadComments();
    }

    if (!open) {
      setMessage("");

      resetTextareaHeight();

      if (attachment?.url) {
        URL.revokeObjectURL(
          attachment.url
        );
      }

      setAttachment(null);

      cancelVoiceRecording();

      stopVoiceToText();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doubtId]);

  // =====================================================
  // CLEANUP WHEN COMPONENT UNMOUNTS
  // =====================================================

  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current
      ) {
        try {
          if (
            mediaRecorderRef.current
              .state !== "inactive"
          ) {
            mediaRecorderRef.current.stop();
          }
        } catch (error) {
          console.error(error);
        }
      }

      if (
        mediaStreamRef.current
      ) {
        mediaStreamRef.current
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );
      }

      if (
        speechRecognitionRef.current
      ) {
        try {
          speechRecognitionRef.current.stop();
        } catch (error) {
          console.error(error);
        }
      }

      if (attachment?.url) {
        URL.revokeObjectURL(
          attachment.url
        );
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const handleSend =
    async () => {
      const trimmedMessage =
        message.trim();

      if (
        !trimmedMessage &&
        !attachment
      ) {
        return;
      }

      if (!doubtId) {
        antdMessage.error(
          "Doubt ID is missing."
        );

        return;
      }

      if (isRecording) {
        antdMessage.info(
          "Please stop the recording first."
        );

        return;
      }

      if (isListening) {
        stopVoiceToText();
      }

      try {
        setSending(true);

        const formData =
          new FormData();

        formData.append(
          "doubt",
          String(doubtId)
        );

        if (trimmedMessage) {
          formData.append(
            "message",
            trimmedMessage
          );
        }

        if (attachment?.file) {
          formData.append(
            "attachment",
            attachment.file
          );
        }

        const response =
          await createDoubtComment(
            formData
          );

        if (response?.data) {
          const newMessage =
            formatApiMessage(
              response.data
            );

          setMessages(
            (prev) => [
              ...prev,
              newMessage,
            ]
          );
        }

        setMessage("");

        resetTextareaHeight();

        removeAttachment();

        scrollToBottom();
      } catch (error) {
        console.error(
          "Failed to send comment:",
          error
        );

        antdMessage.error(
          error?.response?.data
            ?.detail ||
            error?.response?.data
              ?.error ||
            "Failed to send message."
        );
      } finally {
        setSending(false);
      }
    };

  // =====================================================
  // ENTER TO SEND
  // =====================================================

  const handleKeyDown = (
    e
  ) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      if (!sending) {
        handleSend();
      }
    }
  };

  // =====================================================
  // AVATAR INITIAL
  // =====================================================

  const getInitial = (
    name
  ) => {
    if (!name) {
      return "?";
    }

    return name
      .charAt(0)
      .toUpperCase();
  };

  // =====================================================
  // RENDER ATTACHMENT
  // =====================================================

  const renderAttachment = (
    item
  ) => {
    // IMAGE
    if (
      item.type === "image"
    ) {
      return (
        <div className="mb-1">
          <a
            href={item.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={item.fileUrl}
              alt={
                item.fileName ||
                "Image"
              }
              className="max-w-[280px] max-h-[280px] rounded-lg object-cover cursor-pointer"
            />
          </a>
        </div>
      );
    }

    // VIDEO
    if (
      item.type === "video"
    ) {
      return (
        <div className="mb-1">
          <video
            src={item.fileUrl}
            controls
            className="max-w-[300px] max-h-[240px] rounded-lg"
          />
        </div>
      );
    }

    // AUDIO
    if (
      item.type === "audio"
    ) {
      return (
        <div className="mb-1 min-w-[240px]">
          <audio
            src={item.fileUrl}
            controls
            className="w-full"
          />
        </div>
      );
    }

    // DOCUMENT
    if (
      item.type === "document"
    ) {
      return (
        <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-3 min-w-[230px]">

          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <FileOutlined className="text-red-500 text-lg" />
          </div>

          <div className="flex-1 min-w-0">

            <div className="text-sm font-medium text-gray-700 truncate">
              {item.fileName ||
                "Document"}
            </div>

            {item.fileSize && (
              <div className="text-xs text-gray-400 mt-1">
                {formatFileSize(
                  item.fileSize
                )}
              </div>
            )}

          </div>

          {item.fileUrl && (
            <a
              href={item.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={
                item.fileName
              }
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200"
              title="Download"
            >
              <DownloadOutlined className="text-gray-600" />
            </a>
          )}

        </div>
      );
    }

    return null;
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Modal
      open={open}
      onCancel={() => {
        cancelVoiceRecording();

        stopVoiceToText();

        setOpen(false);
      }}
      footer={null}
      centered
      width={650}
      closable={true}
      styles={{
        body: {
          padding: 0,
        },
      }}
      title={
        <div className="flex items-center gap-3">

          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
            <CommentOutlined className="text-blue-600 text-lg" />
          </div>

          <div>

            <div className="font-semibold text-gray-800">
              Doubt Discussion
            </div>

            <div className="text-xs text-gray-400 font-normal">
              Student • Admin • Faculty
            </div>

          </div>

        </div>
      }
      className="rounded-xl overflow-hidden"
    >

      <div className="flex flex-col h-[600px] bg-[#efeae2]">

        {/* =================================================
            DOUBT HEADER
        ================================================= */}

        <div className="bg-white border-b border-gray-200 px-4 py-3">

          <div className="text-xs text-gray-400 uppercase font-semibold">
            Doubt
          </div>

          <div className="text-sm text-gray-700 font-medium mt-1 line-clamp-2">
            {data?.description ||
              "Doubt discussion"}
          </div>

        </div>

        {/* =================================================
            MESSAGES
        ================================================= */}

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">

          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Spin />
            </div>
          ) : messages.length ===
            0 ? (
            <div className="flex justify-center items-center h-full">

              <div className="text-center">

                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <CommentOutlined className="text-2xl text-gray-400" />
                </div>

                <div className="text-sm text-gray-500">
                  No messages yet
                </div>

                <div className="text-xs text-gray-400 mt-1">
                  Start the discussion
                </div>

              </div>

            </div>
          ) : (
            messages.map(
              (item) => {
                const isMine =
                  String(
                    item.role ||
                      ""
                  ).toLowerCase() ===
                  currentRole;

                return (
                  <div
                    key={item.id}
                    className={`flex ${
                      isMine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`flex items-end gap-2 max-w-[85%] ${
                        isMine
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >

                      {/* AVATAR */}

                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isMine
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-500 border border-gray-200"
                        }`}
                      >

                        {item.user ? (
                          <span className="text-xs font-semibold">
                            {getInitial(
                              item.user
                            )}
                          </span>
                        ) : (
                          <UserOutlined />
                        )}

                      </div>

                      {/* MESSAGE BUBBLE */}

                      <div
                        className={`relative px-3 py-2 rounded-lg shadow-sm ${
                          isMine
                            ? "bg-[#d9fdd3] rounded-br-sm"
                            : "bg-white rounded-bl-sm"
                        }`}
                      >

                        {!isMine && (
                          <div className="text-[11px] font-semibold text-blue-600 mb-1">
                            {item.user}
                          </div>
                        )}

                        {item.type !==
                          "text" &&
                          item.fileUrl &&
                          renderAttachment(
                            item
                          )}

                        {item.message && (
                          <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                            {
                              item.message
                            }
                          </div>
                        )}

                        <div className="flex justify-end mt-1">

                          <span className="text-[10px] text-gray-400">
                            {item.time}
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              }
            )
          )}

          <div
            ref={messagesEndRef}
          />

        </div>

        {/* =================================================
            ATTACHMENT PREVIEW
        ================================================= */}

        {attachment && (
          <div className="bg-white border-t border-gray-200 px-3 py-2">

            <div className="relative inline-flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-2">

              {attachment.type ===
                "image" && (
                <img
                  src={
                    attachment.url
                  }
                  alt={
                    attachment.name
                  }
                  className="w-14 h-14 rounded-md object-cover"
                />
              )}

              {attachment.type ===
                "video" && (
                <div className="w-14 h-14 rounded-md bg-gray-200 flex items-center justify-center">
                  <VideoCameraOutlined className="text-xl text-blue-600" />
                </div>
              )}

              {attachment.type ===
                "audio" && (
                <div className="flex items-center gap-2">

                  <div className="w-14 h-14 rounded-md bg-green-50 flex items-center justify-center">
                    <AudioOutlined className="text-xl text-green-600" />
                  </div>

                  <audio
                    src={
                      attachment.url
                    }
                    controls
                    className="w-[220px]"
                  />

                </div>
              )}

              {attachment.type ===
                "document" && (
                <div className="w-14 h-14 rounded-md bg-red-50 flex items-center justify-center">
                  <FileOutlined className="text-xl text-red-500" />
                </div>
              )}

              <div className="max-w-[250px]">

                <div className="text-sm font-medium text-gray-700 truncate">
                  {
                    attachment.name
                  }
                </div>

                <div className="text-xs text-gray-400 mt-1">
                  {formatFileSize(
                    attachment.size
                  )}
                </div>

              </div>

              <button
                type="button"
                onClick={
                  removeAttachment
                }
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-800"
                title="Remove"
              >
                <CloseOutlined className="text-xs" />
              </button>

            </div>

          </div>
        )}

        {/* =================================================
            MESSAGE INPUT
        ================================================= */}

        <div className="bg-[#f0f2f5] border-t border-gray-200 p-3">

          {/* RECORDING BAR */}

          {isRecording && (
            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">

              <div className="flex items-center gap-2">

                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />

                <span className="text-sm text-red-600 font-medium">
                  Recording
                </span>

                <span className="text-sm text-gray-600">
                  {formatRecordingTime(
                    recordingTime
                  )}
                </span>

              </div>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={
                    cancelVoiceRecording
                  }
                  className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    stopVoiceRecording
                  }
                  className="px-3 py-1.5 text-xs text-white bg-red-500 rounded-md hover:bg-red-600"
                >
                  Stop
                </button>

              </div>

            </div>
          )}

          {/* LISTENING BAR */}

          {isListening && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-2">

              <div className="flex items-center gap-2">

                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />

                <span className="text-sm text-blue-600 font-medium">
                  Listening...
                </span>

                <span className="text-xs text-gray-500">
                  Speak now
                </span>

              </div>

              <button
                type="button"
                onClick={
                  stopVoiceToText
                }
                className="px-3 py-1.5 text-xs text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Stop
              </button>

            </div>
          )}

          <div className="flex items-end gap-2">

            {/* ATTACHMENT BUTTON */}

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                sending ||
                isRecording ||
                isListening
              }
              className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition disabled:opacity-50"
              title="Attach file"
            >
              <PaperClipOutlined className="text-lg" />
            </button>

            {/* FILE INPUT */}

            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
              onChange={
                handleFileSelect
              }
            />

            {/* VOICE RECORD */}

            <button
              type="button"
              onClick={
                isRecording
                  ? stopVoiceRecording
                  : startVoiceRecording
              }
              disabled={
                sending ||
                isListening
              }
              className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-gray-600 hover:bg-gray-200"
              } disabled:opacity-50`}
              title={
                isRecording
                  ? "Stop recording"
                  : "Record voice message"
              }
            >
              <AudioOutlined className="text-lg" />
            </button>

            {/* =================================================
                AUTO-GROWING TEXTAREA
            ================================================= */}

            <div className="flex-1 min-w-0 bg-white rounded-lg border border-gray-200">

              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(
                    e.target.value
                  );

                  autoResizeTextarea(
                    e.target
                  );
                }}
                onKeyDown={
                  handleKeyDown
                }
                rows={1}
                disabled={
                  sending ||
                  isRecording
                }
                placeholder={
                  isListening
                    ? "Listening..."
                    : "Type a message..."
                }
                className={`w-full px-3 py-2.5 text-sm bg-transparent border-0 outline-none resize-none ${
                  isListening
                    ? "text-blue-600"
                    : ""
                }`}
                style={{
                  minHeight:
                    "42px",
                  maxHeight:
                    "180px",
                  overflowY:
                    "hidden",
                }}
              />

            </div>

            {/* VOICE TO TEXT */}

            <button
              type="button"
              onClick={
                isListening
                  ? stopVoiceToText
                  : startVoiceToText
              }
              disabled={
                sending ||
                isRecording
              }
              className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition ${
                isListening
                  ? "bg-blue-600 text-white animate-pulse"
                  : "text-gray-600 hover:bg-gray-200"
              } disabled:opacity-50`}
              title={
                isListening
                  ? "Stop voice-to-text"
                  : "Voice to text"
              }
            >
              <SoundOutlined className="text-lg" />
            </button>

            {/* SEND */}

            <button
              type="button"
              onClick={
                handleSend
              }
              disabled={
                sending ||
                isRecording ||
                (!message.trim() &&
                  !attachment)
              }
              className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition ${
                !sending &&
                !isRecording &&
                (message.trim() ||
                  attachment)
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              title="Send"
            >
              {sending ? (
                <Spin
                  size="small"
                  className="[&_.ant-spin-dot-item]:!bg-white"
                />
              ) : (
                <SendOutlined />
              )}
            </button>

          </div>

        </div>

      </div>

    </Modal>
  );
}

export default Comment;