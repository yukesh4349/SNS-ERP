"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  PaperPlaneTilt, 
  MagnifyingGlass,
  DotsThreeVertical,
  UsersThree,
  Paperclip,
  X,
  Checks,
  ChatCircle,
  UserPlus,
  PencilSimple,
  Bell,
  User
} from "@phosphor-icons/react";
import { useAuth } from "../../hooks/use-auth";

import {
  getGroups,
  getMessages,
  sendMessage as apiSendMessage,
  addMember as apiAddMember,
} from "../../services/messaging-service";
import { uploadChatFile } from "../../lib/supabase";

export function ChatPage() {
  const { session } = useAuth();
  const [localContacts, setLocalContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [isViewingMembers, setIsViewingMembers] = useState(false);
  const [isViewingGroupInfo, setIsViewingGroupInfo] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const isParent = session?.user?.role === "parent";

  const fetchGroups = async () => {
    try {
      const groups = await getGroups();
      const uniqueGroups = Array.from(
        new Map(groups.map(g => [g.id, g])).values()
      );
      setLocalContacts(uniqueGroups.map(g => ({
        id: g.id,
        name: g.name,
        type: "Group",
        lastMsg: "Select to view messages",
        time: "Now",
        unread: 0,
        online: true,
        description: g.description,
        members: g.members
      })));
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  };

  const fetchMessages = async (groupId: string) => {
    try {
      const msgs = await getMessages(groupId);
      setMessages(msgs.map(m => ({
        id: m.id,
        sender: m.sender.name,
        text: m.text,
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(m.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        isMe: m.senderId === session?.user?.id,
        status: 'read'
      })));
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleOpenAddMembers = async () => {
    setIsAddingMembers(true);
    setIsLoadingUsers(true);
    setFetchError(null);
    try {
      const { getAllUsers } = await import("../../services/users-service");
      const users = (await getAllUsers()) as any[];
      setAllUsers(users);
    } catch (err) {
      console.error("Failed to fetch users", err);
      setFetchError(err instanceof Error ? err.message : "Failed to load directory");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedContact) return;
    try {
      await apiAddMember(selectedContact.id, userId);
      alert("Member added successfully");
      setIsAddingMembers(false);
      fetchGroups(); 
    } catch (err) {
      alert("Failed to add member");
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedContact) return;
    
    try {
      await apiSendMessage(selectedContact.id, input);
      setInput("");
      fetchMessages(selectedContact.id);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleConfirmCreateGroup = async () => {
    if (newGroupName.trim()) {
      try {
        const { createGroup } = await import("../../services/messaging-service");
        await createGroup(newGroupName.trim(), newGroupDescription || "");
        setIsCreatingGroup(false);
        setNewGroupName("");
        setNewGroupDescription("");
        fetchGroups();
      } catch (err) {
        setFetchError("Failed to create group");
      }
    }
  };

  const handleEditGroup = async () => {
    if (!selectedContact || isParent) return;
    setNewGroupName(selectedContact.name);
    setNewGroupDescription(selectedContact.description || "");
    setIsCreatingGroup(true); 
  };

  const handleNewGroup = async () => {
    if (isParent) return;
    setNewGroupName("");
    setNewGroupDescription("");
    setIsCreatingGroup(true);
  };

  const handleReply = (msg: any) => {
    setReplyingTo(msg);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContact) return;
    const localPreview: any = {
      id: `local-${Date.now()}`,
      sender: session?.user?.name || "User",
      text: `📎 Uploading ${file.name}…`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      isMe: true,
      status: 'sending',
    };
    setMessages((prev) => [...prev, localPreview]);
    try {
      const url = await uploadChatFile(file);
      const isImage = file.type.startsWith('image/');
      const msgText = isImage ? `📷 [Image] ${url}` : `📎 [File] ${file.name} — ${url}`;
      await apiSendMessage(selectedContact.id, msgText);
      fetchMessages(selectedContact.id);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      console.error("File upload failed:", msg);
      setMessages((prev) => prev.filter((m) => m.id !== localPreview.id));
      alert(`Upload failed: ${msg}`);
    }
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const filteredContacts = localContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const MessageStatusIcon = ({ status }: { status?: string }) => {
    if (!status) return null;
    return <Checks size={14} weight="bold" className={status === 'read' ? 'text-orange-500' : 'text-slate-400'} />;
  };

  const groupMessagesByDate = (msgs: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    msgs.forEach(msg => {
      if (!grouped[msg.date]) grouped[msg.date] = [];
      grouped[msg.date].push(msg);
    });
    return grouped;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="h-full max-h-full w-full max-w-full min-w-0 overflow-hidden bg-slate-50 p-4 lg:p-6">
      <div className="grid h-full min-h-0 min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:gap-6">
      <div className="min-h-0 min-w-0 flex flex-col gap-4 lg:gap-6">
        <div className="flex shrink-0 items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => {}}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-orange-600 text-white"
          >
            <ChatCircle size={14} weight="bold" />
            Messages
          </button>
          {!isParent && (
            <button
              onClick={() => {}}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-50"
            >
              <Bell size={14} weight="bold" />
              Announcements
            </button>
          )}
        </div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-0 flex-1 p-4 lg:p-6 rounded-[28px] lg:rounded-[32px] bg-white border border-slate-200 shadow-sm flex flex-col overflow-hidden"
        >
          <div className="relative mb-6">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-transparent focus:border-orange-500 text-sm transition-all text-slate-900 outline-none"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto space-y-2 pr-1 lg:pr-2">
            {localContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <motion.button 
                  key={contact.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full p-3 rounded-2xl transition-all flex items-center gap-3 group border ${
                    selectedContact?.id === contact.id 
                      ? "bg-orange-50 border-orange-200" 
                      : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                      <UsersThree size={20} weight="duotone" />
                    </div>
                    {contact.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{contact.name}</h4>
                      <span className="text-[10px] text-slate-500">{contact.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{contact.lastMsg}</p>
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                No conversations found
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="min-h-0 min-w-0">
        {selectedContact ? (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full min-h-0 min-w-0 p-4 lg:p-6 rounded-[28px] lg:rounded-[32px] bg-white border border-slate-200 shadow-sm flex flex-col overflow-hidden"
          >
            <div className="shrink-0 flex items-center justify-between pb-4 lg:pb-6 border-b border-slate-200 mb-4 lg:mb-6 min-w-0">
              <div className="min-w-0 flex items-center gap-3 lg:gap-4 cursor-pointer" onClick={() => setIsViewingGroupInfo(true)}>
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <UsersThree size={24} weight="duotone" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-slate-900">{selectedContact.name}</h3>
                  <p className="text-xs text-green-500 font-bold">Online</p>
                </div>
              </div>
              <button className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all">
                <DotsThreeVertical size={20} weight="bold" />
              </button>
            </div>

            <div ref={messagesContainerRef} className="min-h-0 flex-1 overflow-y-auto space-y-4 pr-1 lg:pr-2 mb-4 lg:mb-6">
              {Object.entries(groupedMessages).length > 0 ? (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-slate-100 px-3 py-1 rounded-full text-xs text-slate-600 font-medium">
                        {date}
                      </div>
                    </div>
                    {(msgs as any[]).map((msg: any) => (
                      <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} mb-2 group`}>
                        <div className="relative flex max-w-[min(76%,42rem)] flex-col">
                          <div 
                            className={`px-4 py-2 rounded-2xl ${
                              msg.isMe 
                                ? 'bg-orange-600 text-white' 
                                : 'bg-slate-100 text-slate-900'
                            }`}
                          >
                            {!msg.isMe && (
                              <div className="text-xs font-bold mb-1 opacity-75">{msg.sender}</div>
                            )}
                            <div className="text-sm leading-relaxed break-words">
                              {msg.text?.startsWith('📷 [Image] ') ? (
                                <a href={msg.text.replace('📷 [Image] ', '')} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={msg.text.replace('📷 [Image] ', '')}
                                    alt="attachment"
                                    className="max-w-[220px] rounded-xl mt-1 cursor-pointer"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                </a>
                              ) : msg.text?.startsWith('📎 [File] ') ? (
                                (() => {
                                  const parts = msg.text.replace('📎 [File] ', '').split(' — ');
                                  const name = parts[0];
                                  const url = parts[1];
                                  return url
                                    ? <a href={url} target="_blank" rel="noopener noreferrer" className="underline opacity-80 hover:opacity-100">{name}</a>
                                    : <span>{name}</span>;
                                })()
                              ) : msg.text}
                            </div>
                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${msg.isMe ? 'text-orange-100' : 'text-slate-500'}`}>
                              <span>{msg.time}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <ChatCircle size={48} className="text-slate-300 mb-3" weight="duotone" />
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-2 lg:gap-3 pt-4 lg:pt-6 border-t border-slate-200 min-w-0">
              <label className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">
                <Paperclip size={20} weight="bold" />
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
              
              <div className="min-w-0 flex-1 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
                <input 
                  ref={inputRef}
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="w-full bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className="p-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-all"
              >
                <PaperPlaneTilt size={20} weight="fill" className="text-white" />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full min-h-0 min-w-0 p-6 rounded-[32px] bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center overflow-hidden"
          >
            <div className="p-4 rounded-full bg-slate-100 mb-4">
              <ChatCircle size={48} className="text-slate-400" weight="duotone" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Your Messages</h3>
            <p className="text-sm text-slate-500 text-center max-w-[280px]">
              Select a conversation from the sidebar to start messaging
            </p>
          </motion.div>
        )}
      </div>
      </div>

      {/* Modals and Slide-overs */}
      {isViewingGroupInfo && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setIsViewingGroupInfo(false)} />
          <div className="relative w-full max-w-md bg-slate-50 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
            <div className="h-16 bg-white px-6 flex items-center gap-6 border-b border-slate-200">
              <button onClick={() => setIsViewingGroupInfo(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} weight="bold" className="text-slate-600" />
              </button>
              <h3 className="text-lg font-bold text-slate-800">Group info</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="bg-white p-8 flex flex-col items-center border-b border-slate-100 mb-2">
                <div className="h-40 w-40 rounded-full bg-slate-100 flex items-center justify-center mb-6 relative group cursor-pointer shadow-inner">
                  <UsersThree size={80} weight="duotone" className="text-orange-500" />
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-slate-900">{selectedContact?.name}</h2>
                  {!isParent && (
                    <button onClick={handleEditGroup} className="p-1.5 hover:bg-orange-50 rounded-lg text-slate-400 hover:text-orange-500 transition-all">
                      <PencilSimple size={20} weight="bold" />
                    </button>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-500">Group · {selectedContact?.members?.length || 0} members</p>
              </div>
              <div className="bg-white p-4 flex justify-center gap-4 border-b border-slate-100 mb-2">
                  {!isParent && (
                    <button onClick={handleOpenAddMembers} className="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl hover:bg-orange-50 transition-all border border-slate-100 group">
                      <div className="h-12 w-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UserPlus size={24} weight="bold" />
                      </div>
                      <span className="text-xs font-bold text-orange-600">Add</span>
                    </button>
                  )}
                <button onClick={() => {}} className="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl hover:bg-slate-50 transition-all border border-slate-100 group">
                  <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MagnifyingGlass size={24} weight="bold" />
                  </div>
                  <span className="text-xs font-bold text-slate-600">Search</span>
                </button>
              </div>
              <div className="bg-white px-6 py-5 border-b border-slate-100 mb-2 group">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-orange-600 uppercase tracking-widest">Description</span>
                 </div>
                 <p className="text-sm text-slate-600 leading-relaxed font-medium">
                   {selectedContact?.description || "Welcome to the group."}
                 </p>
              </div>
              <div className="bg-white p-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                   <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">{selectedContact?.members?.length || 0} members</h4>
                </div>
                <div className="space-y-4">
                   {!isParent && (
                     <button onClick={handleOpenAddMembers} className="w-full flex items-center gap-4 group">
                       <div className="h-10 w-10 rounded-full bg-orange-500 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                          <UserPlus size={20} weight="bold" />
                       </div>
                       <span className="text-sm font-bold text-orange-600">Add members</span>
                     </button>
                   )}
                   {(selectedContact?.members || []).map((member: any) => (
                      <div key={member.user.id} className="flex items-center justify-between group">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                               <Checks size={20} weight="duotone" />
                            </div>
                            <div>
                               <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                 {member.user.name}
                                 {member.user.id === session?.user?.id && <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-black">YOU</span>}
                               </div>
                               <div className="text-[10px] font-extrabold text-slate-400 uppercase">{member.user.role}</div>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreatingGroup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Create Group</h3>
                <p className="text-sm text-slate-500 mt-1">Setup a new communication channel</p>
              </div>
              <button onClick={() => setIsCreatingGroup(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} weight="bold" className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 px-1">Group Name</label>
                <input 
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 px-1">Description (Optional)</label>
                <textarea 
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="What's this group about?"
                  rows={3}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-300 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsCreatingGroup(false)} className="flex-1 py-4 px-6 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all">Cancel</button>
              <button 
                onClick={handleConfirmCreateGroup}
                disabled={!newGroupName.trim()}
                className="flex-[2] py-4 px-6 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-700 disabled:bg-slate-200 disabled:shadow-none transition-all"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingMembers && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] p-2">
            <div className="px-6 py-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Add Members</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">To {selectedContact?.name}</p>
              </div>
              <button onClick={() => setIsAddingMembers(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={20} weight="bold" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {allUsers.map((user) => (
                <button 
                  key={user.id}
                  onClick={() => handleAddMember(user.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-orange-50 transition-all group text-left border border-transparent hover:border-orange-100"
                >
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-orange-500 group-hover:shadow-sm transition-all">
                    <User size={24} weight="duotone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900">{user.name}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.role}</div>
                  </div>
                  <div className="h-6 w-6 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:border-orange-500 transition-all">
                    <div className="h-3 w-3 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4">
               <button onClick={() => setIsAddingMembers(false)} className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black shadow-xl hover:bg-slate-800 transition-all">Done</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-in { animation: 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        @keyframes zoom-in-95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
