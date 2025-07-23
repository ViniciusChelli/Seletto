export interface TwoFactorSettings {
  id: string;
  userId: string;
  isEnabled: boolean;
  method: '2fa_method';
  phoneNumber?: string;
  totpSecret?: string;
  backupCodes?: string[];
  recoveryEmail?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type TwoFactorMethod = 'email' | 'sms' | 'totp' | 'backup_codes';

export interface VerificationCode {
  id: string;
  userId: string;
  code: string;
  codeType: 'sms' | 'email' | 'login' | 'setup';
  expiresAt: string;
  usedAt?: string;
  attempts: number;
  maxAttempts: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface TrustedDevice {
  id: string;
  userId: string;
  deviceName: string;
  deviceFingerprint: string;
  ipAddress?: string;
  userAgent?: string;
  lastUsedAt: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface SecurityLog {
  id: string;
  userId?: string;
  eventType: SecurityEventType;
  ipAddress?: string;
  userAgent?: string;
  location?: any;
  metadata?: any;
  riskScore: number;
  createdAt: string;
}

export type SecurityEventType = 
  | 'login_success' 
  | 'login_failed' 
  | 'logout'
  | '2fa_enabled' 
  | '2fa_disabled' 
  | '2fa_success' 
  | '2fa_failed'
  | 'password_changed' 
  | 'email_changed' 
  | 'account_locked'
  | 'suspicious_activity' 
  | 'device_trusted' 
  | 'device_removed';

export interface SecureSession {
  id: string;
  userId: string;
  sessionToken: string;
  deviceId?: string;
  ipAddress: string;
  userAgent?: string;
  is2faVerified: boolean;
  lastActivity: string;
  expiresAt: string;
  createdAt: string;
}

export interface RateLimit {
  id: string;
  identifier: string;
  actionType: 'login' | '2fa' | 'password_reset' | 'code_request';
  attempts: number;
  windowStart: string;
  blockedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export const SECURITY_SETTINGS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  CODE_EXPIRY_MINUTES: 10,
  TRUSTED_DEVICE_DAYS: 30,
  SESSION_TIMEOUT_HOURS: 24,
  MAX_2FA_ATTEMPTS: 3,
  RATE_LIMIT_WINDOW_MINUTES: 15,
} as const;

export const TWO_FACTOR_METHODS = {
  email: 'Email',
  sms: 'SMS',
  totp: 'Aplicativo Autenticador',
  backup_codes: 'Códigos de Backup'
} as const;

// Advanced Security Types
export interface SecurityPolicy {
  id: string;
  policyName: string;
  policyType: 'access_control' | 'data_protection' | 'audit' | 'backup' | 'monitoring';
  isEnabled: boolean;
  configuration: any;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  autoEnforce: boolean;
  notificationEnabled: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPWhitelist {
  id: string;
  ipAddress: string;
  ipRange?: string;
  description?: string;
  userId?: string;
  isActive: boolean;
  expiresAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPBlacklist {
  id: string;
  ipAddress: string;
  ipRange?: string;
  reason: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  autoBlocked: boolean;
  isPermanent: boolean;
  blockedUntil?: string;
  incidentCount: number;
  lastIncidentAt: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditTrail {
  id: string;
  userId?: string;
  sessionId?: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  apiEndpoint?: string;
  httpMethod?: string;
  responseStatus?: number;
  executionTimeMs?: number;
  riskScore: number;
  isSensitive: boolean;
  complianceTags: string[];
  createdAt: string;
}

export interface BackupLog {
  id: string;
  backupType: 'full' | 'incremental' | 'differential';
  backupScope: 'database' | 'files' | 'complete';
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  fileSizeBytes?: number;
  backupLocation?: string;
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
  retentionDays: number;
  checksum?: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  triggeredBy: string;
  createdBy?: string;
  createdAt: string;
}

export interface EncryptionKey {
  id: string;
  keyName: string;
  keyType: 'aes256' | 'rsa2048' | 'rsa4096' | 'ed25519';
  keyPurpose: 'data_encryption' | 'backup_encryption' | 'api_signing' | 'session_encryption';
  keyData: string;
  isActive: boolean;
  expiresAt?: string;
  rotationFrequencyDays: number;
  lastRotatedAt: string;
  usageCount: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SuspiciousActivity {
  id: string;
  userId?: string;
  activityType: 'multiple_failed_logins' | 'unusual_access_pattern' | 'data_exfiltration' | 
                'privilege_escalation' | 'unusual_location' | 'suspicious_api_calls' |
                'bulk_operations' | 'after_hours_access' | 'multiple_sessions';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectionMethod: 'rule_based' | 'ml_model' | 'anomaly_detection' | 'manual';
  confidenceScore: number;
  ipAddress?: string;
  userAgent?: string;
  sessionData?: any;
  evidence?: any;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  investigatedBy?: string;
  investigatedAt?: string;
  resolutionNotes?: string;
  autoBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityIncident {
  id: string;
  incidentNumber: string;
  title: string;
  description: string;
  incidentType: 'data_breach' | 'unauthorized_access' | 'malware' | 'phishing' |
                'ddos_attack' | 'insider_threat' | 'system_compromise' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  affectedSystems: string[];
  affectedUsers: string[];
  impactAssessment?: string;
  containmentActions?: string;
  recoveryActions?: string;
  lessonsLearned?: string;
  reportedBy?: string;
  assignedTo?: string;
  discoveredAt: string;
  containedAt?: string;
  resolvedAt?: string;
  estimatedCost: number;
  complianceImpact?: string;
  externalNotificationRequired: boolean;
  externalNotificationSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataRetentionPolicy {
  id: string;
  policyName: string;
  tableName: string;
  retentionPeriodDays: number;
  archiveBeforeDelete: boolean;
  archiveLocation?: string;
  deletionCriteria?: any;
  isActive: boolean;
  complianceRequirement?: string;
  lastExecutedAt?: string;
  nextExecutionAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const ACTIVITY_TYPES = {
  multiple_failed_logins: 'Múltiplas Tentativas de Login',
  unusual_access_pattern: 'Padrão de Acesso Incomum',
  data_exfiltration: 'Exfiltração de Dados',
  privilege_escalation: 'Escalação de Privilégios',
  unusual_location: 'Localização Incomum',
  suspicious_api_calls: 'Chamadas de API Suspeitas',
  bulk_operations: 'Operações em Massa',
  after_hours_access: 'Acesso Fora do Horário',
  multiple_sessions: 'Múltiplas Sessões'
} as const;

export const INCIDENT_TYPES = {
  data_breach: 'Vazamento de Dados',
  unauthorized_access: 'Acesso Não Autorizado',
  malware: 'Malware',
  phishing: 'Phishing',
  ddos_attack: 'Ataque DDoS',
  insider_threat: 'Ameaça Interna',
  system_compromise: 'Comprometimento do Sistema',
  other: 'Outros'
} as const;

export const THREAT_LEVELS = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
  critical: 'Crítico'
} as const;