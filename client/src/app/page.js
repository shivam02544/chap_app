"use client";
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSend,
  FiUser,
  FiMessageCircle,
  FiSmile,
  FiImage,
  FiMoon,
  FiSun,
} from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";

const socket = io("https://chap-app-peach.vercel.app/");

const Page = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [whoIsTyping, setWhoIsTyping] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    socket.on("chat message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
      // Play notification sound for others' messages
      if (data.username !== username && data.username !== "System") {
        const audio = new Audio("/notification.mp3");
        audio.play();
      }
    });

    socket.on("user list", (users) => {
      setOnlineUsers(users);
    });

    socket.on("typing", ({ user, isTyping }) => {
      if (user !== username) {
        setWhoIsTyping(isTyping ? user : "");
        setIsTyping(isTyping);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setWhoIsTyping("");
          }, 1000);
        }
      }
    });

    return () => {
      socket.off("chat message");
      socket.off("user list");
      socket.off("typing");
    };
  }, [username]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleJoinChat = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsJoined(true);
      socket.emit("user joined", username);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", {
      user: username,
      isTyping: e.target.value.length > 0,
    });
  };

  const onEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowEmoji(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit("chat message", {
        text: message,
        username: username,
        time: new Date().toLocaleTimeString(),
      });
      setMessage("");
      socket.emit("typing", { user: username, isTyping: false });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        socket.emit("chat message", {
          text: "📷 Image",
          imageUrl: reader.result,
          username: username,
          time: new Date().toLocaleTimeString(),
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -100 },
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gradient-to-br from-gray-100 to-blue-50"
      }`}
    >
      {!isJoined ? (
        <div className="min-h-screen p-4 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 sm:p-8 mx-4"
          >
            <form onSubmit={handleJoinChat} className="space-y-6">
              <div className="text-center space-y-4">
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="inline-block text-6xl text-blue-600 mb-4"
                >
                  <FiMessageCircle />
                </motion.div>
                <h2 className="text-4xl font-bold text-gray-800 tracking-tight">
                  Welcome to ChatRoom
                </h2>
                <p className="text-gray-500">
                  Connect with people around the world
                </p>
              </div>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg"
                  placeholder="Enter your name..."
                  required
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
              >
                Join Chat Room
              </motion.button>
            </form>
          </motion.div>
        </div>
      ) : (
        <div className="p-2 sm:p-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Sidebar */}
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={`lg:col-span-1 ${
                darkMode ? "bg-gray-800" : "bg-white/90"
              } backdrop-blur-lg rounded-2xl shadow-xl p-4 sm:p-6`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className={`text-base sm:text-lg font-semibold ${
                    darkMode ? "text-white" : "text-gray-700"
                  } flex items-center gap-2`}
                >
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  Online ({onlineUsers.length})
                </h3>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 rounded-lg ${
                    darkMode
                      ? "bg-gray-700 text-yellow-400"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {darkMode ? <FiSun /> : <FiMoon />}
                </button>
              </div>
              <div className="space-y-3 flex lg:block overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                {onlineUsers.map((user, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={index}
                    className={`flex-shrink-0 lg:flex-shrink w-auto mx-2 lg:mx-0 first:ml-0 flex items-center space-x-3 p-3 rounded-xl ${
                      darkMode ? "bg-gray-700/50" : "bg-white/50"
                    } hover:bg-opacity-80 transition-colors`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {user[0].toUpperCase()}
                    </div>
                    <span
                      className={`text-sm ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {user}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Chat Area */}
            <div
              className={`lg:col-span-3 ${
                darkMode ? "bg-gray-800" : "bg-white/90"
              } backdrop-blur-lg rounded-2xl shadow-xl p-4 sm:p-6`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2
                  className={`text-xl sm:text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Welcome, {username}!
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition-colors"
                >
                  Leave Chat
                </motion.button>
              </div>

              <div
                className={`mb-4 sm:mb-6 h-[calc(100vh-400px)] lg:h-[calc(100vh-300px)] overflow-y-auto rounded-xl p-4 sm:p-6 ${
                  darkMode ? "bg-gray-900/50" : "bg-gray-50/50"
                }`}
              >
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                      key={index}
                      className={`mb-4 flex ${
                        msg.username === username
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          msg.username === username
                            ? "bg-blue-600 text-white"
                            : msg.username === "System"
                            ? darkMode
                              ? "bg-gray-700 text-gray-300"
                              : "bg-gray-200 text-gray-600"
                            : darkMode
                            ? "bg-gray-700 text-white"
                            : "bg-white"
                        } p-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow`}
                      >
                        <p className="text-sm font-semibold mb-1">
                          {msg.username}
                        </p>
                        {msg.imageUrl ? (
                          <img
                            src={msg.imageUrl}
                            alt="Shared"
                            className="rounded-lg max-w-full"
                          />
                        ) : (
                          <p className="text-sm">{msg.text}</p>
                        )}
                        <p className="text-xs mt-2 opacity-70">{msg.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-sm italic ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {whoIsTyping} is typing...
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSubmit}
                className="relative flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={message}
                    onChange={handleTyping}
                    className={`w-full px-4 py-3 pr-20 rounded-xl transition-colors ${
                      darkMode
                        ? "bg-gray-700 text-white border-gray-600 focus:border-blue-500"
                        : "border-2 border-gray-200 focus:border-blue-500"
                    } focus:outline-none`}
                    placeholder="Type a message..."
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2 rounded-lg ${
                        darkMode
                          ? "text-gray-400 hover:text-white"
                          : "text-gray-400 hover:text-gray-600"
                      } transition-colors`}
                    >
                      <FiImage size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEmoji(!showEmoji)}
                      className={`p-2 rounded-lg ${
                        darkMode
                          ? "text-gray-400 hover:text-white"
                          : "text-gray-400 hover:text-gray-600"
                      } transition-colors`}
                    >
                      <FiSmile size={20} />
                    </button>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <FiSend /> Send
                </motion.button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                {showEmoji && (
                  <div className="absolute bottom-full right-0 mb-2">
                    <EmojiPicker theme={darkMode ? "dark" : "light"} />
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
