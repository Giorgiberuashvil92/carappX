import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);

  constructor() {
    if (admin.apps.length === 0) {
      try {
        // Prefer explicit service account JSON via env, else fall back to application default
        const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        const saPath =
          process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
          process.env.GOOGLE_APPLICATION_CREDENTIALS;

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
            this.logger.log('Firebase initialized with service account');
          } else {
            // Production-ზე Firebase-ის გარეშე მუშაობა
            this.logger.warn(
              'Firebase credentials not available, skipping initialization',
            );
          }
        } else {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId:
              process.env.FIREBASE_PROJECT_ID ||
              process.env.GOOGLE_CLOUD_PROJECT ||
              process.env.GCLOUD_PROJECT,
          });
        }
        this.logger.log('Firebase initialized');
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
    return admin.firestore();
  }

  ping() {
    this.logger.log('firebase service ready');
    return true;
  }
}
