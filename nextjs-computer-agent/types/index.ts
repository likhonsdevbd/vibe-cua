// Core application types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  soundEnabled: boolean;
  autoPlay: boolean;
}

// Chat and conversation types
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  type?: 'text' | 'image' | 'action' | 'screenshot';
  metadata?: MessageMetadata;
  actions?: Action[];
}

export interface MessageMetadata {
  sessionId: string;
  executionTime?: number;
  stepsCompleted?: number;
  finalURL?: string;
  finalTitle?: string;
  error?: string;
}

export interface Action {
  id: string;
  type: 'navigate' | 'click' | 'type' | 'scroll' | 'screenshot' | 'search';
  label: string;
  description: string;
  icon?: string;
  disabled?: boolean;
  requiresConfirmation?: boolean;
  data?: any;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed' | 'error';
  metadata?: ConversationMetadata;
}

export interface ConversationMetadata {
  sessionId: string;
  totalMessages: number;
  totalActions: number;
  totalExecutionTime: number;
  finalURL?: string;
  finalTitle?: string;
}

// Computer use agent types
export interface AgentConfig {
  model: string;
  maxSteps: number;
  headless: boolean;
  safetyStrict: boolean;
  enableLogging: boolean;
  timeoutMs: number;
  allowedDomains: string[];
}

export interface AgentResponse {
  success: boolean;
  sessionId: string;
  message: string;
  data?: any;
  error?: string;
  stepsCompleted?: number;
  executionTime?: number;
  finalURL?: string;
  finalTitle?: string;
}

export interface WebRequest {
  action: 'chat' | 'navigate' | 'screenshot' | 'click' | 'type' | 'scroll' | 'pageInfo' | 'search';
  message?: string;
  url?: string;
  x?: number;
  y?: number;
  text?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  amount?: number;
  query?: string;
  site?: string;
  initialURL?: string;
}

// UI component types
export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
  suggestions: string[];
}

export interface BrowserState {
  currentURL: string;
  pageTitle: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  zoom: number;
  isFullscreen: boolean;
  hasScreenshots: boolean;
  lastScreenshot?: string;
}

export interface ControlPanelState {
  isOpen: boolean;
  position: 'left' | 'right' | 'bottom';
  activeTab: 'navigate' | 'tools' | 'history' | 'settings';
  width: number;
  height: number;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'url' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  value?: any;
  options?: { label: string; value: any }[];
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  error?: string;
}

export interface FormData {
  [key: string]: any;
}

export interface FormState {
  data: FormData;
  errors: { [key: string]: string };
  isValid: boolean;
  isSubmitting: boolean;
  touched: { [key: string]: boolean };
}

// Event types
export interface AppEvent {
  type: 'message_sent' | 'message_received' | 'action_performed' | 'error_occurred' | 'session_started' | 'session_ended';
  payload: any;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

// Error types
export interface AppError {
  id: string;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  context?: string;
  stack?: string;
}

export interface ValidationError extends AppError {
  field?: string;
  value?: any;
}

// Configuration types
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  agent: {
    defaultModel: string;
    maxSteps: number;
    timeoutMs: number;
  };
  ui: {
    theme: string;
    language: string;
    animations: boolean;
    soundEnabled: boolean;
  };
  security: {
    allowedDomains: string[];
    blockedActions: string[];
    rateLimit: {
      requests: number;
      window: number; // in seconds
    };
  };
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  onClick?: () => void;
  onHover?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  loading?: boolean;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
}

export interface FormComponentProps extends BaseComponentProps {
  value?: any;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

// Animation and transition types
export interface AnimationConfig {
  duration: number;
  delay?: number;
  easing?: string;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface TransitionConfig {
  property: string;
  duration: number;
  delay?: number;
  timingFunction?: string;
}

// Performance monitoring types
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
  networkRequests: number;
  bundleSize: number;
}

export interface UserMetrics {
  sessionDuration: number;
  pageViews: number;
  actionsPerformed: number;
  errors: number;
  satisfaction: number;
}

// Accessibility types
export interface AccessibilityFeatures {
  screenReader: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  voiceControl: boolean;
}

export interface AriaAttributes {
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  'aria-pressed'?: boolean;
  'aria-disabled'?: boolean;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-orientation'?: 'horizontal' | 'vertical';
  'aria-sort'?: 'ascending' | 'descending' | 'other' | 'none';
}