import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../../store/chatSlice";

const normalizeHistoryMessages = (history = [], currentUserId) =>
  Array.isArray(history)
    ? history.map((item) => {
        const isCurrentUser =
          currentUserId != null &&
          item?.user?.id != null &&
          String(item.user.id) === String(currentUserId);

        return {
          text: `${isCurrentUser ? "You" : item?.user?.username || "Unknown user"} : ${item?.message || ""}`,
          type: isCurrentUser ? "outgoing" : "incoming",
        };
      })
    : [];

function ChatPage({ currentUser, socket }) {
  const dispatch = useDispatch();
  const latestMessageRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(() =>
    normalizeHistoryMessages(currentUser?.oldMessage, currentUser?.id),
  );
  const [isJoined, setIsJoined] = useState(Boolean(currentUser));
  const [userName, setUserName] = useState(currentUser?.name || "");

  useEffect(() => {
    latestMessageRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleUserJoined = (user) => {
      setMessages((prev) => [
        ...prev,
        { text: `${user} has joined the chat`, type: "system" },
      ]);
    };

    const handleLoginSuccess = (data) => {
      localStorage.setItem("token", data.token);
      const oldMessages = normalizeHistoryMessages(
        data?.oldMessage,
        data?.user?.id,
      );
      setMessages(oldMessages);
      setUserName(data?.user?.username || currentUser?.name || "User");
      setIsJoined(true);
    };

    const handleReceive = (data) => {
      setMessages((prev) => [
        ...prev,
        { text: `${data.name} : ${data.message}`, type: "incoming" },
      ]);
    };

    const handleLeft = (data) => {
      const username = data?.data?.username;
      if (!username) return;
      setMessages((prev) => [
        ...prev,
        { text: `${username} has left the chat`, type: "system" },
      ]);
    };

    const handleError = (err) => {
      console.log(err);
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("loginSuccess", handleLoginSuccess);
    socket.on("receive", handleReceive);
    socket.on("left", handleLeft);
    socket.on("error", handleError);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("loginSuccess", handleLoginSuccess);
      socket.off("receive", handleReceive);
      socket.off("left", handleLeft);
      socket.off("error", handleError);
    };
  }, [socket, currentUser?.name]);

  const handleJoin = (event) => {
    event.preventDefault();
    const obj = { email, password };
    socket?.emit("new-user-join", obj);
  };

  const handleSend = (event) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    const token = localStorage.getItem("token");

    if (!trimmedMessage || !token) return;

    const obj = { message: trimmedMessage, token };
    setMessages((prev) => [
      ...prev,
      { text: `You : ${trimmedMessage}`, type: "outgoing" },
    ]);
    socket?.emit("send", obj);
    setMessage("");
  };

  const handleLeaveRoom = () => {
    localStorage.removeItem("token");
    socket?.disconnect();
    dispatch(logoutUser());
  };

  return (
    <div className="app-shell flex items-center justify-center p-4">
      <div className="whatsapp-panel flex flex-col overflow-hidden md:flex-row">
        {!isJoined ? (
          <div className="flex w-full items-center justify-center bg-[#111b21] p-6">
            <form
              onSubmit={handleJoin}
              className="auth-card w-full max-w-md rounded-2xl p-8"
            >
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#25d366] text-2xl font-bold text-[#111b21]">
                  W
                </div>
                <h1 className="text-3xl font-semibold text-white">Join chat</h1>
                <p className="mt-2 text-sm text-[#8696a0]">
                  Connect with your room using your email and password
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#1f2c34] px-4 py-3 text-white outline-none placeholder:text-[#8696a0]"
                  placeholder="Email"
                  required
                />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#1f2c34] px-4 py-3 text-white outline-none placeholder:text-[#8696a0]"
                  placeholder="Password"
                  required
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#25d366] px-4 py-3 text-sm font-semibold text-[#111b21] transition hover:bg-[#1fbf5a]"
                >
                  Enter chat
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <aside className="chat-sidebar flex w-full max-w-[360px] flex-col bg-[#111b21]">
              <div className="flex items-center justify-between border-b border-white/10 bg-[#202c33] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a3942] text-sm font-semibold text-white">
                    {userName ? userName.slice(0, 2).toUpperCase() : "ME"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {userName || "User"}
                    </p>
                    <p className="text-[11px] text-green-300">online</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-[#d1d7db] transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                >
                  Leave room
                </button>
              </div>

              <div className="search-box m-3 flex items-center gap-2 rounded-full px-3 py-2 text-sm text-[#d1d7db]">
                <span>⌕</span>
                <input
                  className="w-full bg-transparent text-sm text-white placeholder:text-[#8696a0] outline-none"
                  placeholder="Search chats"
                />
              </div>

              <div className="flex-1 px-3 py-2 text-[#8696a0]">
                <div className="rounded-xl border border-white/10 bg-[#202c33] p-4 text-sm text-white">
                  Active room
                </div>
              </div>
            </aside>

            <main className="chat-window flex w-full flex-col bg-[#0b141a]">
              <header className="flex items-center justify-between border-b border-white/10 bg-[#202c33] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a3942] text-sm font-semibold text-white">
                    RC
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Room Chat</p>
                    <p className="text-[11px] text-[#8696a0]">online now</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-lg text-[#aebac1]">
                  <span>⌕</span>
                  <span>⋯</span>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center p-4">
                <div className="mx-auto flex max-w-4xl flex-col gap-3">
                  {messages.map((item, index) => (
                    <div
                      key={`${item.text}-${index}`}
                      className={`chat-bubble ${item.type === "outgoing" ? "mine ml-auto" : item.type === "incoming" ? "their mr-auto" : "mx-auto w-full max-w-[80%] bg-[#202c33] text-center text-xs text-[#d1d7db]"}`}
                    >
                      <p className="text-sm leading-6">{item.text}</p>
                    </div>
                  ))}
                  <div ref={latestMessageRef} />
                </div>
              </div>

              <footer className="border-t border-white/10 bg-[#202c33] px-4 py-3">
                <form
                  onSubmit={handleSend}
                  className="mx-auto flex max-w-4xl items-center gap-3"
                >
                  <button type="button" className="text-2xl text-[#aebac1]">
                    ☺
                  </button>
                  <button type="button" className="text-2xl text-[#aebac1]">
                    ＋
                  </button>
                  <input
                    type="text"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Type a message"
                    className="message-input flex-1 rounded-full px-4 py-3 text-sm text-white placeholder:text-[#8696a0] outline-none"
                  />
                  <button
                    type="submit"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25d366] text-lg font-bold text-[#111b21] shadow-lg shadow-green-900/40"
                  >
                    ▶
                  </button>
                </form>
              </footer>
            </main>
          </>
        )}
      </div>
    </div>
  );
}

export default ChatPage;
