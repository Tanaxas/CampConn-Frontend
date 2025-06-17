import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getConversations, getMessages, sendMessage } from '../services/api';
import { getSocket } from '../services/socket';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const socket = getSocket();
  
  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await getConversations();
        setConversations(response.data.conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast.error('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
  }, []);
  
  // Set up socket.io listeners
  useEffect(() => {
    if (!socket) return;
    
    // Listen for new messages
    socket.on('receive_message', (message) => {
      // Check if the message belongs to the active conversation
      if (activeConversation && message.conversation_id === activeConversation.id) {
        setMessages(prevMessages => [...prevMessages, message]);
        
        // Mark as read
        socket.emit('mark_as_read', {
          conversationId: message.conversation_id,
          userId: user.id
        });
      }
      
      // Update conversations list
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv.id === message.conversation_id) {
            // Update last message
            return {
              ...conv,
              last_message: {
                ...message,
                sender_name: message.sender_name
              },
              unread_count: conv.unread_count + (message.sender_id !== user.id ? 1 : 0)
            };
          }
          return conv;
        });
      });
    });
    
    // Listen for messages read
    socket.on('messages_read', ({ conversationId }) => {
      if (activeConversation && activeConversation.id === conversationId) {
        // Update read status for all messages
        setMessages(prevMessages => 
          prevMessages.map(msg => ({
            ...msg,
            read_status: msg.sender_id === user.id ? 1 : msg.read_status
          }))
        );
      }
    });
    
    // Listen for typing indicator
    socket.on('user_typing', ({ conversationId, userId, isTyping }) => {
      if (activeConversation && activeConversation.id === conversationId) {
        setActiveConversation(prev => ({
          ...prev,
          isTyping: isTyping
        }));
      }
    });
    
    return () => {
      socket.off('receive_message');
      socket.off('messages_read');
      socket.off('user_typing');
    };
  }, [socket, activeConversation, user?.id]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) return;
    
    const fetchConversationMessages = async () => {
      try {
        setLoadingMessages(true);
        const response = await getMessages(activeConversation.id);
        setMessages(response.data.messages);
        
        // Update unread count in conversations list
        setConversations(prevConversations => {
          return prevConversations.map(conv => {
            if (conv.id === activeConversation.id) {
              return {
                ...conv,
                unread_count: 0
              };
            }
            return conv;
          });
        });
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoadingMessages(false);
      }
    };
    
    fetchConversationMessages();
  }, [activeConversation]);
  
  // Handle selecting a conversation
  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
  };
  
  // Handle sending a message
  // Handle sending a message
const handleSendMessage = async (e) => {
  e.preventDefault();
  
  if (!newMessage.trim() || !activeConversation) return;
  
  try {
    let messageSent = false;
    let socketError = null;
    //storing message text
    const messageText= newMessage;

    //Clear input right away
    setNewMessage('');
    
    // First try to send via socket.io
    if (socket && socket.connected) {
      try {
        // Create a promise to wait for socket response
        const socketPromise = new Promise((resolve, reject) => {
          // Set a timeout in case socket doesn't respond
          const timeout = setTimeout(() => {
            reject(new Error('Socket timeout'));
          }, 3000);
          
          // Listen for confirmation or error
          const onSuccess = () => {
            clearTimeout(timeout);
            resolve();
          };
          
          const onError = (error) => {
            clearTimeout(timeout);
            reject(error);
          };
          
          // Send the message
          socket.emit('send_message', {
            conversationId: activeConversation.id,
            senderId: user.id,
            receiverId: activeConversation.participants[0].id,
            text: messageText
          }, onSuccess);
          
          // Listen for errors
          socket.once('error', onError);
        });
        
        await socketPromise;
        messageSent = true;
        
      } catch (socketErr) {
        console.warn('Socket send failed, falling back to API:', socketErr);
        socketError = socketErr;
      }
    }
    
    // If socket failed or isn't available, use API fallback
    else{
      await sendMessage(activeConversation.id, messageText);
  //messageSent = true;
      }
    
    // Message was sent by one of the methods
    setNewMessage('');
    
    // Add optimistic UI update - show the message immediately
    const optimisticMessage = {
      id: 'temp-' + Date.now(),
      conversation_id: activeConversation.id,
      sender_id: user.id,
      text: newMessage,
      read_status: 0,
      created_at: new Date().toISOString(),
      sender_name: user.name,
      sender_pic: user.profile_pic
    };
    
    

    setMessages(prev => [...prev, optimisticMessage]);
  
    
  } catch (error) {
    console.error('Error sending message:', error);
    toast.error('Failed to send message');
  }
};
  
  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !activeConversation) return;
    
    socket.emit('typing', {
      conversationId: activeConversation.id,
      userId: user.id,
      isTyping: true
    });
    
    // Reset typing indicator after 2 seconds
    setTimeout(() => {
      socket.emit('typing', {
        conversationId: activeConversation.id,
        userId: user.id,
        isTyping: false
      });
    }, 2000);
  };
  
  // Format time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date/time
  const formatConversationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  // Get random color
  const getRandomColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
  };
  
  // Get initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex flex-col md:flex-row h-[70vh]">
          {/* Conversations List */}
          <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold">Conversations</h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No conversations yet
              </div>
            ) : (
              <div className="overflow-y-auto h-[calc(70vh-57px)]">
                {conversations.map(conversation => {
                  const otherParticipant = conversation.participants[0];
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                        activeConversation?.id === conversation.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="relative">
                          {otherParticipant.profile_pic ? (
                            <img
                              src={`http://localhost:5000${otherParticipant.profile_pic}`}
                              alt={otherParticipant.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: getRandomColor(otherParticipant.name) }}
                            >
                              {getInitials(otherParticipant.name)}
                            </div>
                          )}
                          
                          {conversation.unread_count > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary-color text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                        
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-medium">{otherParticipant.name}</h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {conversation.last_message
                                ? formatConversationTime(conversation.last_message.created_at)
                                : formatConversationTime(conversation.created_at)}
                            </span>
                          </div>
                          
                          <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                            {conversation.last_message
                              ? conversation.last_message.text
                              : 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Messages */}
          <div className="w-full md:w-2/3 flex flex-col">
            {activeConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                  {activeConversation.participants[0].profile_pic ? (
                    <img
                      src={`http://localhost:5000${activeConversation.participants[0].profile_pic}`}
                      alt={activeConversation.participants[0].name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: getRandomColor(activeConversation.participants[0].name) }}
                    >
                      {getInitials(activeConversation.participants[0].name)}
                    </div>
                  )}
                  
                  <div className="ml-3">
                    <h3 className="font-medium">{activeConversation.participants[0].name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activeConversation.isTyping ? (
                        <span className="text-primary-color">Typing...</span>
                      ) : (
                        activeConversation.participants[0].email
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Messages List */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 my-8">
                      No messages yet. Send a message to start the conversation.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`relative max-w-lg px-4 py-2 rounded-lg shadow-sm ${
                              message.sender_id === user.id
                                ? 'bg-primary-color text-white rounded-br-none'
                                : 'bg-gray-100 dark:bg-gray-700 rounded-bl-none'
                            }`}
                          >
                            <p>{message.text}</p>
                            <span className="block text-xs mt-1 text-right opacity-70">
                              {formatMessageTime(message.created_at)}
                              {message.sender_id === user.id && (
                                <span className="ml-1">
                                  {message.read_status === 1 ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                {/* Message Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <form onSubmit={handleSendMessage} className="flex">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleTyping}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-color"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-color text-white rounded-r-lg hover:bg-opacity-90 focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <h3 className="text-xl font-medium mb-2">Your Messages</h3>
                <p>Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;