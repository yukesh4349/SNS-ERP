import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FcmService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  onModuleInit() {
    try {
      let serviceAccount: any;
      const envServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

      if (envServiceAccount) {
        serviceAccount = JSON.parse(envServiceAccount);
      } else {
        const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
        if (fs.existsSync(serviceAccountPath)) {
          console.warn('[FcmService] WARNING: Using file-based Firebase service account. Set FIREBASE_SERVICE_ACCOUNT env var in production.');
          serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        }
      }

      if (serviceAccount) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin initialized successfully');
      } else {
        console.warn('Firebase service account not found (env or file), push notifications will be disabled');
      }
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error.message);
    }
  }

  async sendPushNotification(tokens: string[], title: string, body: string, data?: any) {
    if (!tokens || tokens.length === 0) return { successCount: 0, failureCount: 0 };
    if (!this.firebaseApp) {
      console.warn('[FcmService] Push notification skipped: Firebase Admin not initialized.');
      return { successCount: 0, failureCount: 0, skipped: true };
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'high_importance_channel',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`${response.successCount} messages were sent successfully`);
      
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
          }
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error sending push notification (handled gracefully):', error);
      return { successCount: 0, failureCount: tokens.length, error: error.message };
    }
  }

  async sendToTopic(topic: string, title: string, body: string, data?: any) {
    const message: admin.messaging.Message = {
      topic,
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    try {
      const response = await admin.messaging().send(message);
      console.log(`Successfully sent message to topic ${topic}:`, response);
      return response;
    } catch (error) {
      console.error(`Error sending to topic ${topic}:`, error);
      throw error;
    }
  }
}
