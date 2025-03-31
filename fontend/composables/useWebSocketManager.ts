export const useWebSocketManager = () => {
  const config = useRuntimeConfig();
  const auth = useAuth();
  const chatStore = useChatStore();
  const toast = useToast();

  const ws = ref<WebSocket | null>(null);
  const isAuthenticated = ref(false);

  const connect = () => {
    if (ws.value?.readyState === WebSocket.OPEN) return;

    const { status, data, send, open, close } = useWebSocket(
      `${config.public.WS_DOMAIN}/api/ws/conversations`,
      {
        onConnected(socket) {
          ws.value = socket;
          chatStore.setWebSocket(socket);

          socket.onmessage = async (event) => {
            try {
              const response = JSON.parse(event.data);

              if (response.code == 101 || response.code == 401) {
                if (isAuthenticated.value) {
                  await auth.refreshTokens();
                }

                send(
                  JSON.stringify({
                    action: "auth",
                    token: auth.getAccessToken(),
                  })
                );
                isAuthenticated.value = true;
              }

              // ... rest of your message handling logic ...
            } catch (error) {
              console.error("WebSocket message parsing error:", error);
            }
          };
        },
        // onDisconnected() {
        //   ws.value = null;
        //   isAuthenticated.value = false;
        // },
      }
    );

    return { send, close };
  };

  return {
    connect,
    ws,
    isAuthenticated,
  };
};
