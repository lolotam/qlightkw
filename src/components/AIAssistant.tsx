import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Phone,
  ShoppingCart,
  Loader2,
  Bot,
  User,
  Sparkles
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FeatureToggles {
  ai_voice_recording: boolean;
  ai_whatsapp_button: boolean;
  ai_order_function: boolean;
}

// 3D Animated AI Icon Component
const AnimatedAIIcon = ({ isOpen, isTyping }: { isOpen: boolean; isTyping: boolean }) => {
  return (
    <div className="relative w-14 h-14">
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-purple-500 to-cyan-500"
        animate={{
          scale: isTyping ? [1, 1.2, 1] : [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: isTyping ? 0.5 : 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Middle ring */}
      <motion.div
        className="absolute inset-1 rounded-full bg-gradient-to-br from-primary/80 to-purple-600/80"
        animate={{
          rotateY: [0, 180, 360],
          rotateX: [0, 15, 0, -15, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ transformStyle: 'preserve-3d' }}
      />
      
      {/* Inner core */}
      <motion.div
        className="absolute inset-2 rounded-full bg-gradient-to-br from-background to-muted flex items-center justify-center shadow-lg"
        animate={{
          scale: isTyping ? [1, 0.95, 1] : 1,
        }}
        transition={{
          duration: 0.3,
          repeat: isTyping ? Infinity : 0,
        }}
      >
        <motion.div
          animate={{
            rotateZ: isOpen ? 0 : [0, 10, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: isOpen ? 0 : Infinity,
            ease: "easeInOut"
          }}
        >
          {isTyping ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : (
            <Bot className="h-6 w-6 text-primary" />
          )}
        </motion.div>
      </motion.div>
      
      {/* Floating particles */}
      {!isOpen && (
        <>
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-primary/60"
            animate={{
              x: [0, 10, -10, 0],
              y: [0, -15, -10, 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 0,
            }}
            style={{ top: '10%', left: '80%' }}
          />
          <motion.div
            className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/60"
            animate={{
              x: [0, -12, 5, 0],
              y: [0, -10, -20, 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: 0.5,
            }}
            style={{ top: '20%', right: '70%' }}
          />
          <motion.div
            className="absolute w-1 h-1 rounded-full bg-purple-400/60"
            animate={{
              x: [0, 8, -5, 0],
              y: [0, -8, -15, 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 1,
            }}
            style={{ bottom: '30%', left: '75%' }}
          />
        </>
      )}
    </div>
  );
};

export default function AIAssistant() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [featureToggles, setFeatureToggles] = useState<FeatureToggles>({
    ai_voice_recording: true,
    ai_whatsapp_button: true,
    ai_order_function: true,
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch feature toggles
  useEffect(() => {
    const fetchFeatureToggles = async () => {
      const { data, error } = await supabase
        .from('feature_toggles')
        .select('feature_key, is_enabled')
        .in('feature_key', ['ai_voice_recording', 'ai_whatsapp_button', 'ai_order_function']);

      if (!error && data) {
        const toggles: FeatureToggles = {
          ai_voice_recording: true,
          ai_whatsapp_button: true,
          ai_order_function: true,
        };
        data.forEach((toggle) => {
          if (toggle.feature_key in toggles) {
            toggles[toggle.feature_key as keyof FeatureToggles] = toggle.is_enabled;
          }
        });
        setFeatureToggles(toggles);
      }
    };

    fetchFeatureToggles();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: isRTL 
          ? 'مرحباً! 👋 أنا مساعد Qlight. كيف يمكنني مساعدتك اليوم؟ يمكنك السؤال عن المنتجات أو الطلب عبر الدردشة أو واتساب.'
          : 'Hello! 👋 I\'m Qlight Assistant. How can I help you today? You can ask about products, place orders, or chat via WhatsApp.',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, isRTL]);

  // Send message to AI
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build conversation history
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: text,
          conversationHistory,
          language: i18n.language,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('AI Assistant error:', error);
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ في المساعد الذكي' : 'AI assistant error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        // In production, transcribe audio here using Speech-to-Text API
        // For now, show a message about voice recording
        toast({
          title: isRTL ? 'تسجيل صوتي' : 'Voice Recording',
          description: isRTL 
            ? 'تم تسجيل الصوت. جاري المعالجة...'
            : 'Voice recorded. Processing...',
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer (max 10 seconds)
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 10) {
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'لا يمكن الوصول للميكروفون' : 'Cannot access microphone',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  // WhatsApp function
  const openWhatsApp = (orderMode = false) => {
    const message = orderMode
      ? (isRTL ? 'مرحباً، أريد تقديم طلب' : 'Hello, I want to place an order')
      : (isRTL ? 'مرحباً، لدي استفسار' : 'Hello, I have a question');
    
    const url = `https://wa.me/96551111725?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Floating AI Button */}
      <motion.div
        className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-50`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1 }}
      >
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
              aria-label="Open AI Assistant"
            >
              <AnimatedAIIcon isOpen={false} isTyping={false} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary via-purple-600 to-cyan-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">
                      {isRTL ? 'مساعد Qlight' : 'Qlight Assistant'}
                    </h3>
                    <p className="text-xs text-white/80">
                      {isLoading 
                        ? (isRTL ? 'جاري الكتابة...' : 'Typing...') 
                        : (isRTL ? 'متصل' : 'Online')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Quick Actions - Conditionally rendered based on feature toggles */}
            {(featureToggles.ai_order_function || featureToggles.ai_whatsapp_button) && (
              <div className="p-2 border-b border-border bg-muted/30 flex gap-2">
                {featureToggles.ai_order_function && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openWhatsApp(true)}
                    className="flex-1 text-xs"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {isRTL ? 'طلب سريع' : 'Quick Order'}
                  </Button>
                )}
                {featureToggles.ai_whatsapp_button && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openWhatsApp(false)}
                    className="flex-1 text-xs"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    {isRTL ? 'واتساب' : 'WhatsApp'}
                  </Button>
                )}
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="h-80 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-[10px] mt-1 ${message.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <motion.div
                          className="w-2 h-2 bg-primary/60 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-primary/60 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-primary/60 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 border-t border-border bg-muted/30">
              {isRecording ? (
                <div className="flex items-center gap-3">
                  <motion.div
                    className="flex-1 flex items-center gap-2 bg-destructive/10 rounded-full px-4 py-2"
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                    <span className="text-sm text-destructive font-medium">
                      {isRTL ? `تسجيل... ${recordingTime}/10 ث` : `Recording... ${recordingTime}/10s`}
                    </span>
                  </motion.div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={stopRecording}
                  >
                    <MicOff className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(inputValue)}
                    placeholder={isRTL ? 'اكتب رسالتك...' : 'Type your message...'}
                    className="flex-1 bg-background"
                    disabled={isLoading}
                  />
                  {/* Voice recording button - conditionally rendered */}
                  {featureToggles.ai_voice_recording && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={startRecording}
                      disabled={isLoading}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    onClick={() => sendMessage(inputValue)}
                    disabled={!inputValue.trim() || isLoading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
