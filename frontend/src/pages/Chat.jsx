
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { FiSend } from 'react-icons/fi';

const Chat = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const receiverId = searchParams.get('user');

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    fetchRooms();

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (receiverId && user) {
      // Auto-select room with this user
      const userId = (user.id || user._id)?.toString();
      const receiverIdStr = receiverId.toString();
      const roomId = [userId, receiverIdStr].sort().join('_');
      setSelectedRoom(roomId);
      fetchMessages(roomId);
      if (socket) {
        socket.emit('join-room', roomId);
      }
    }
  }, [receiverId, user, socket]);

  useEffect(() => {
    if (socket && selectedRoom) {
      socket.emit('join-room', selectedRoom);
      
      socket.on('receive-message', (data) => {
        if (data.roomId === selectedRoom) {
          // Add new message to the list
          const newMessage = {
            _id: data._id || Date.now().toString(),
            roomId: data.roomId,
            sender: { _id: data.sender },
            receiver: { _id: data.receiver },
            message: data.message,
            createdAt: data.createdAt || new Date().toISOString(),
            read: false
          };
          setMessages(prev => {
            // Check if message already exists (avoid duplicates)
            const exists = prev.some(m => 
              m._id === newMessage._id || 
              (m.message === newMessage.message && 
               new Date(m.createdAt).getTime() === new Date(newMessage.createdAt).getTime())
            );
            if (exists) return prev;
            return [...prev, newMessage];
          });
          // Refresh messages from server to get full user data
          setTimeout(() => fetchMessages(selectedRoom), 500);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('receive-message');
      }
    };
  }, [socket, selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/chat/rooms');
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Fetch rooms error:', error);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      const response = await axios.get(`/api/chat/messages/${roomId}`);
      const fetchedMessages = response.data.messages || [];
      setMessages(fetchedMessages);
      
      // Mark unread messages as read
      const userId = (user?.id || user?._id)?.toString();
      const unreadMessages = fetchedMessages.filter(msg => {
        const receiverId = (msg.receiver?._id || msg.receiver?.id || msg.receiver)?.toString();
        return receiverId === userId && !msg.read;
      });
      
      // Mark each unread message as read
      for (const message of unreadMessages) {
        try {
          await axios.put(`/api/chat/messages/${message._id}/read`);
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      }
      
      // Refresh rooms to update unread count
      if (unreadMessages.length > 0) {
        fetchRooms();
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };

  const handleRoomSelect = (roomId) => {
    setSelectedRoom(roomId);
    fetchMessages(roomId);
    if (socket) {
      socket.emit('join-room', roomId);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    const roomParts = selectedRoom.split('_');
    const userId = (user?.id || user?._id)?.toString();
    const receiver = roomParts.find(id => id !== userId);

    if (!receiver) {
      console.error('Could not determine receiver ID');
      return;
    }

    try {
      const response = await axios.post('/api/chat/messages', {
        receiver: receiver.toString(),
        message: newMessage
      });
      
      // Add the sent message to the messages list immediately
      const sentMessage = {
        ...response.data.chatMessage,
        sender: user,
        receiver: { _id: receiver }
      };
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      
      // Refresh rooms to update last message
      fetchRooms();
      
      // Scroll to bottom after sending
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Send message error:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-cream-100 to-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Messages</h1>
        
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col lg:flex-row" style={{ minHeight: '600px' }}>
          {/* Rooms Sidebar */}
          <div className="w-full lg:w-1/3 border-b lg:border-r lg:border-b-0 border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">Conversations</h2>
            </div>
            <div className="overflow-y-auto flex-1">
              {rooms.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600 text-lg">No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {rooms.map(room => (
                    <button
                      key={room._id}
                      onClick={() => handleRoomSelect(room._id)}
                      className={`w-full p-6 text-left hover:bg-orange-50 transition-all ${
                        selectedRoom === room._id ? 'bg-orange-50 border-r-4 border-orange-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-gray-900 block truncate">
                            {room.otherUser?.name || `User ${room.otherUserId?.slice(0, 8) || room._id.slice(0, 8)}...`}
                          </span>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {room.lastMessageText || 'No messages'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end ml-4 flex-shrink-0">
                          {room.unreadCount > 0 && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full mb-2 font-medium">
                              {room.unreadCount}
                            </span>
                          )}
                          {room.lastMessage && (
                            <p className="text-xs text-gray-500">
                              {new Date(room.lastMessage).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedRoom ? (
              <>
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const userId = (user?.id || user?._id)?.toString();
                      const senderId = (message.sender?._id || message.sender?.id || message.sender)?.toString() || '';
                      const isOwn = senderId === userId;
                      return (
                        <div
                          key={message._id || index}
                          className={`mb-4 flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md ${
                              isOwn
                                ? 'bg-orange-500 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            <p className="break-words">{message.message}</p>
                            <p className={`text-xs mt-2 ${
                              isOwn ? 'text-orange-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-6 bg-white">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && e.preventDefault()}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-5 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center disabled:cursor-not-allowed"
                    >
                      <FiSend className="text-sm" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 bg-gray-50 rounded-r-2xl">
                <div className="text-center text-gray-500">
                  <FiSend className="text-4xl mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-semibold">Select a conversation</p>
                  <p className="text-sm">Choose from your conversations to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
