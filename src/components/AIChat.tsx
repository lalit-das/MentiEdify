// src/components/AIChat.tsx

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, Copy, RotateCcw, ThumbsUp, ThumbsDown, ArrowDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { geminiService, GeminiMessage } from '@/services/gemini';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  onClose?: () => void;
  context?: string;
}

export const AIChat = ({ onClose, context }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: context || 'Hi! I\'m your AI mentor assistant. How can I help you today?\n\n**Quick suggestions:**\n• Find mentors in your field\n• Book a mentorship session\n• Get career advice\n• Learn about platform features',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle scroll visibility
  const handleScroll = (e: any) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    setShowScrollButton(!bottom);
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const geminiMessages: GeminiMessage[] = messages
        .slice(1)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

      geminiMessages.push({
        role: 'user',
        parts: [{ text: userMessage.content }]
      });

      const response = await geminiService.chatWithHistory(geminiMessages);

      if (response.error) {
        throw new Error(response.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied!',
      description: 'Message copied to clipboard',
    });
  };

  const regenerateResponse = async () => {
    if (messages.length < 2) return;
    
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    // Remove last AI response
    setMessages(prev => prev.slice(0, -1));
    setInput(lastUserMessage.content);
    setTimeout(() => handleSend(), 100);
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hi! I\'m your AI mentor assistant. How can I help you today?\n\n**Quick suggestions:**\n• Find mentors in your field\n• Book a mentorship session\n• Get career advice\n• Learn about platform features',
        timestamp: new Date()
      }
    ]);
    toast({
      title: 'Chat cleared',
      description: 'Conversation history has been reset',
    });
  };

  const charCount = input.length;
  const maxChars = 2000;

  return (
    <Card className="flex flex-col h-[600px] max-w-3xl mx-auto shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-primary/5 to-primary/10 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">AI Mentor Assistant</CardTitle>
            <p className="text-xs text-muted-foreground">Always here to help</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={clearChat} title="Clear chat">
            <Trash2 className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <ScrollArea 
        className="flex-1 p-4" 
        onScroll={handleScroll}
        ref={scrollAreaRef}
      >
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              } animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 max-w-[85%]">
                <div
                  className={`rounded-2xl p-4 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted/50 border border-border/50 rounded-tl-sm'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-md text-xs"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className="bg-muted px-1.5 py-0.5 rounded text-xs" {...props}>
                                {children}
                              </code>
                            );
                          },
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 px-2">
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>

                  {message.role === 'assistant' && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyMessage(message.content)}
                        title="Copy message"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {message.id === messages[messages.length - 1]?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={regenerateResponse}
                          title="Regenerate response"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-tl-sm p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {showScrollButton && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-24 right-6 rounded-full shadow-lg"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}

      <CardContent className="border-t p-4 bg-muted/30">
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder="Ask me anything about mentorship..."
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, maxChars))}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                className="min-h-[44px] max-h-[120px] resize-none pr-12"
                rows={1}
              />
              <Badge 
                variant="secondary" 
                className="absolute bottom-2 right-2 text-xs"
              >
                {charCount}/{maxChars}
              </Badge>
            </div>
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="h-11 px-4"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift + Enter</kbd> for new line
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
