import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Drive file scope
const driveProvider = new GoogleAuthProvider();
driveProvider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token management
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Drive access token was not returned. Please try again.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const driveSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink: string;
  directDownloadUrl: string;
  isPublic: boolean;
}

/**
 * Uploads a file (Blob) directly to user's Google Drive and makes it publicly accessible.
 */
export const uploadToGoogleDrive = async (params: {
  fileBlob: Blob;
  fileName: string;
  mimeType: string;
  description?: string;
  makePublic?: boolean;
}): Promise<DriveUploadResult> => {
  let token = cachedAccessToken;

  // If token is missing, trigger popup sign-in
  if (!token) {
    const authRes = await googleSignIn();
    token = authRes.accessToken;
  }

  const { fileBlob, fileName, mimeType, description, makePublic = true } = params;

  // 1. Prepare Multipart Upload payload
  const metadata = {
    name: fileName,
    mimeType: mimeType,
    description: description || 'Exported from VoxGemini Voice & Video Studio',
  };

  const boundary = '-------VoxGeminiDriveBoundary' + Date.now().toString(16);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBody = new Blob(
    [
      delimiter,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      delimiter,
      `Content-Type: ${mimeType}\r\n\r\n`,
      fileBlob,
      closeDelimiter,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  // 2. Upload file to Google Drive REST v3
  const uploadResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: multipartBody,
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Google Drive upload failed (${uploadResponse.status}): ${errorText}`);
  }

  const fileData = await uploadResponse.json();
  const fileId = fileData.id;

  // 3. Make the file publicly accessible with reader role if requested
  if (makePublic && fileId) {
    try {
      const permResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone',
            allowFileDiscovery: false,
          }),
        }
      );

      if (!permResponse.ok) {
        console.warn('Warning: Could not set public permission on Google Drive file:', await permResponse.text());
      }
    } catch (permErr) {
      console.warn('Failed setting public permissions:', permErr);
    }
  }

  const directDownloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
  const webViewLink = fileData.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

  return {
    id: fileId,
    name: fileData.name || fileName,
    webViewLink,
    directDownloadUrl,
    isPublic: true,
  };
};
