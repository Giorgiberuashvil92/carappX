import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);

  constructor() {
    if (admin.apps.length === 0) {
      try {
        // Try to build service account from individual environment variables first
        const serviceAccount = this.buildServiceAccountFromEnvVars();

        if (serviceAccount) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId:
              serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
          });
          this.logger.log(
            '✅ Firebase initialized with individual environment variables',
          );
          return;
        }

        // Fallback to single JSON environment variable
        const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        const saPath =
          process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
          process.env.GOOGLE_APPLICATION_CREDENTIALS;

        this.logger.log(`Environment: ${process.env.NODE_ENV}`);
        this.logger.log(`Service Account JSON exists: ${!!saJson}`);
        this.logger.log(`Service Account Path exists: ${!!saPath}`);

        if (saJson || saPath) {
          const creds = this.loadServiceAccount(
            saJson,
            saPath,
          ) as admin.ServiceAccount & {
            project_id?: string;
            projectId?: string;
          };

          if (creds) {
            admin.initializeApp({
              credential: admin.credential.cert(creds),
              projectId:
                creds.projectId ||
                creds.project_id ||
                process.env.FIREBASE_PROJECT_ID ||
                process.env.GOOGLE_CLOUD_PROJECT ||
                process.env.GCLOUD_PROJECT,
            });
            this.logger.log('✅ Firebase initialized with service account');
          } else {
            this.logger.warn(
              'Firebase credentials not available, skipping initialization',
            );
          }
        } else {
          // Try application default credentials
          try {
            admin.initializeApp({
              credential: admin.credential.applicationDefault(),
              projectId:
                process.env.FIREBASE_PROJECT_ID ||
                process.env.GOOGLE_CLOUD_PROJECT ||
                process.env.GCLOUD_PROJECT,
            });
            this.logger.log(
              '✅ Firebase initialized with application default credentials',
            );
          } catch (appDefaultError) {
            this.logger.warn(
              'Application default credentials failed, continuing without Firebase',
            );
            this.logger.warn(appDefaultError.message);
          }
        }
      } catch (e) {
        this.logger.error('Failed to initialize Firebase', (e as Error)?.stack);
        // Production-ზე Firebase-ის გარეშე მუშაობა
        if (process.env.NODE_ENV === 'production') {
          this.logger.warn('Continuing without Firebase in production mode');
        } else {
          throw e;
        }
      }
    }
  }

  private buildServiceAccountFromEnvVars(): admin.ServiceAccount | null {
    const requiredFields = [
      'type',
      'project_id',
      'private_key_id',
      'private_key',
      'client_email',
      'client_id',
      'auth_uri',
      'token_uri',
      'auth_provider_x509_cert_url',
      'client_x509_cert_url',
    ];

    // Check if all required fields are available as environment variables
    const missingFields = requiredFields.filter((field) => !process.env[field]);

    if (missingFields.length > 0) {
      this.logger.log(`Missing Firebase env vars: ${missingFields.join(', ')}`);
      return null;
    }

    try {
      const serviceAccount: admin.ServiceAccount = {
        type: process.env.type,
        project_id: process.env.project_id,
        private_key_id: process.env.private_key_id,
        private_key: process.env.private_key.replace(/\\n/g, '\n'),
        client_email: process.env.client_email,
        client_id: process.env.client_id,
        auth_uri: process.env.auth_uri,
        token_uri: process.env.token_uri,
        auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
        client_x509_cert_url: process.env.client_x509_cert_url,
      };

      this.logger.log(
        '✅ Successfully built Firebase service account from environment variables',
      );
      return serviceAccount;
    } catch (error) {
      this.logger.error(
        'Failed to build service account from environment variables:',
        error,
      );
      return null;
    }
  }

  private loadServiceAccount(
    jsonEnv?: string,
    pathEnv?: string,
  ): Record<string, unknown> {
    // 1) If JSON provided, try parse as JSON, else try base64
    if (jsonEnv) {
      const parsed = this.tryParseJsonOrBase64(jsonEnv);
      if (!parsed)
        throw new Error(
          'Invalid FIREBASE_SERVICE_ACCOUNT_JSON. Not JSON or base64 JSON.',
        );
      this.normalizePrivateKey(parsed);
      return parsed;
    }

    // 2) If path provided, read file and parse
    if (pathEnv) {
      if (!fs.existsSync(pathEnv)) {
        if (process.env.NODE_ENV === 'production') {
          this.logger.warn(
            `Service account path not found: ${pathEnv}, continuing without Firebase`,
          );
          return null;
        }
        throw new Error(`Service account path not found: ${pathEnv}`);
      }
      const file = fs.readFileSync(pathEnv, 'utf8');
      const parsed = JSON.parse(file) as Record<string, unknown>;
      this.normalizePrivateKey(parsed);
      return parsed;
    }

    if (process.env.NODE_ENV === 'production') {
      this.logger.warn(
        'No service account provided, continuing without Firebase',
      );
      return null;
    }
    throw new Error('No service account provided');
  }

  private tryParseJsonOrBase64(value: string): Record<string, unknown> | null {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      try {
        const buf = Buffer.from(value, 'base64');
        const decoded = buf.toString('utf8');
        return JSON.parse(decoded) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
  }

  private normalizePrivateKey(obj: Record<string, unknown>): void {
    const maybeKey = (obj as { private_key?: unknown }).private_key;
    if (typeof maybeKey === 'string' && maybeKey.includes('\\n')) {
      (obj as { private_key?: string }).private_key = maybeKey.replace(
        /\\n/g,
        '\n',
      );
    }
  }

  get db() {
    try {
      return admin.firestore();
    } catch (e) {
      this.logger.warn('Firebase not initialized, returning null');
      return null;
    }
  }

  ping() {
    this.logger.log('firebase service ready');
    return true;
  }
}
