import {Platform, Alert, ToastAndroid, Linking} from 'react-native';
import RNFS from 'react-native-fs';
// @ts-ignore
import {PDFDocument, rgb, PDFFont, PDFPage, StandardFonts} from 'pdf-lib';
// Buffer polyfill for pdf-lib
import {Buffer} from 'buffer';
// @ts-ignore
import FileViewer from 'react-native-file-viewer';
// @ts-ignore
import RNBlobUtil from 'react-native-blob-util';
// @ts-ignore
import PushNotification from 'react-native-push-notification';
// @ts-ignore
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import {PermissionsAndroid} from 'react-native';

export const viewFileInFiles = async (filePath: string) => {
  if (Platform.OS === 'ios') {
    try {
      console.log('Attempting to open file in iOS Files app:', filePath);

      // Ensure the file exists
      const exists = await RNBlobUtil.fs.exists(filePath);
      if (!exists) {
        console.error('File does not exist at path:', filePath);
        Alert.alert('Error', 'Cannot find file to open');
        return;
      }

      // Remove file:// prefix if present
      const cleanPath = filePath.replace('file://', '');

      // First try to open with UIDocumentInteractionController
      try {
        console.log('Trying to open with openDocument:', cleanPath);
        await RNBlobUtil.ios.openDocument(cleanPath);
        return;
      } catch (error) {
        console.log('openDocument failed, trying previewDocument...');
      }

      // If openDocument fails, try previewDocument
      try {
        console.log('Trying to open with previewDocument:', cleanPath);
        await RNBlobUtil.ios.previewDocument(cleanPath);
        return;
      } catch (error) {
        console.log('previewDocument failed, trying Files app...');
      }

      // As a last resort, try to open the Files app
      const iosFilesAppUrl = 'shareddocuments://';
      const canOpen = await Linking.canOpenURL(iosFilesAppUrl);

      if (canOpen) {
        console.log('Opening Files app directly');
        await Linking.openURL(iosFilesAppUrl);
      } else {
        throw new Error('Cannot open Files app');
      }
    } catch (error) {
      console.error('Error opening file in iOS:', error);
      Alert.alert(
        'Cannot Open File',
        'The file was saved but cannot be opened automatically. Please open the Files app to view it.',
        [{text: 'OK', style: 'cancel'}],
      );
    }
  } else {
    // For Android, use the existing openPdf function
    await openPdf(filePath);
  }
};
/**
 * Helper function to draw wrapped text in a PDF
 */
export const drawWrappedText = (
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  options?: {
    align?: string;
    lineHeight?: number;
    font?: PDFFont;
  },
) => {
  const {align = 'left'} = options || {};
  const lineHeight = options?.lineHeight || fontSize * 1.2;

  // Safely sanitize the input text to handle encoding issues
  // Replace problematic characters including newlines and special chars
  const sanitizedText = text
    ? text
        .replace(/[\n\r]/g, ' ') // Replace newlines with spaces
        .replace(/[\u202F\u00A0]/g, ' ') // Replace narrow no-break space and no-break space with regular space
        .replace(/[^\x20-\x7E]/g, '') // Remove other non-ASCII characters
    : '';

  // Use Times-Roman which has better encoding support than Helvetica
  const font =
    options?.font || page.doc.embedStandardFont(StandardFonts.TimesRoman);

  // Handle common product patterns for better wrapping
  let formattedText = sanitizedText
    .replace(/(\d+)\s*(KG|BOX|BAG)/gi, '$1 $2 ')
    .replace(/(\w+)\s+(\d+)\s*(KG|BOX|BAG)/gi, '$1 $2 $3');

  // Split text into lines
  const words = formattedText.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  // Create lines that fit within width
  for (const word of words) {
    // Skip empty words that might be created from sanitization
    if (!word.trim()) continue;

    const testLine = currentLine ? `${currentLine} ${word}` : word;
    let testWidth;

    try {
      testWidth = font.widthOfTextAtSize(testLine, fontSize);
    } catch (e) {
      console.warn('Error measuring text width, skipping word:', word);
      continue; // Skip this word if it causes encoding issues
    }

    if (testWidth <= width) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // If a single word is too long, try to truncate it
        try {
          // Test if we can at least measure this word
          font.widthOfTextAtSize(word, fontSize);
          lines.push(word);
        } catch (e) {
          // If we can't even measure a single word, skip it
          console.warn('Error with single word, skipping:', word);
        }
        currentLine = '';
      }
    }
  }

  // Add the last line if it has content
  if (currentLine) {
    lines.push(currentLine);
  }

  // Calculate total height
  const totalHeight = lines.length * lineHeight;

  lines.forEach((line: string, i: number) => {
    let xPos = x;
    try {
      if (align === 'center') {
        const lineWidth = font.widthOfTextAtSize(line, fontSize);
        xPos = x + (width - lineWidth) / 2;
      } else if (align === 'right') {
        const lineWidth = font.widthOfTextAtSize(line, fontSize);
        xPos = x + width - lineWidth - 4;
      }

      // Draw the text safely
      try {
        page.drawText(line, {
          x: xPos,
          y: y - i * lineHeight + totalHeight / 2 - fontSize / 2,
          size: fontSize,
          font,
        });
      } catch (e) {
        console.warn('Error drawing text line:', e);
        // Try again with additional sanitization if there's an encoding error
        try {
          // Further sanitize to handle any problematic characters
          const fallbackText = line.replace(/[^\x00-\x7F]/g, '');
          page.drawText(fallbackText, {
            x: xPos,
            y: y - i * lineHeight + totalHeight / 2 - fontSize / 2,
            size: fontSize,
            font,
          });
        } catch (fallbackError) {
          console.error('Fallback text drawing also failed:', fallbackError);
        }
      }
    } catch (e) {
      console.warn('Error measuring text line, skipping:', line);
    }
  });

  return totalHeight;
};

/**
 * Generate a unique filename if the file already exists
 */
export const getUniqueFileName = async (
  basePath: string,
  baseFileName: string,
): Promise<string> => {
  // First check if the file exists
  const filePath = `${basePath}/${baseFileName}`;
  const exists = await RNBlobUtil.fs.exists(filePath);

  if (!exists) {
    return filePath; // Original file path is fine
  }

  // File exists, create a unique name by adding timestamp
  const timestamp = new Date().getTime();
  const fileNameParts = baseFileName.split('.');
  const extension = fileNameParts.pop() || 'pdf';
  const nameWithoutExtension = fileNameParts.join('.');
  const newFileName = `${nameWithoutExtension}_${timestamp}.${extension}`;
  console.log('File already exists, using unique filename:', newFileName);

  return `${basePath}/${newFileName}`;
};

/**
 * Open the generated PDF
 */
export const openPdf = async (filePath: string): Promise<void> => {
  try {
    console.log('Attempting to open PDF at path:', filePath);

    // Ensure the path is properly formatted for the platform
    let formattedPath = filePath;

    // For Android, ensure it has file:// prefix
    if (Platform.OS === 'android' && !filePath.startsWith('file://')) {
      formattedPath = `file://${filePath}`;
      console.log('Formatted Android path:', formattedPath);
    }

    // For iOS, remove file:// if present since FileViewer handles it
    if (Platform.OS === 'ios' && formattedPath.startsWith('file://')) {
      formattedPath = formattedPath.replace('file://', '');
      console.log('Formatted iOS path:', formattedPath);
    }

    // Ensure the file exists before trying to open it
    const exists = await RNBlobUtil.fs.exists(
      Platform.OS === 'ios' ? formattedPath : filePath,
    );

    if (!exists) {
      throw new Error(`File does not exist at path: ${filePath}`);
    }

    // Open the file with FileViewer
    await FileViewer.open(formattedPath, {
      showOpenWithDialog: true,
      showAppsSuggestions: true,
      displayName: 'PDF Report',
    });
  } catch (error) {
    console.error('Error opening PDF:', error);

    // Check if the filePath is in app-specific storage or public storage
    const isPublicStorage = !filePath.includes('Android/data');

    Alert.alert(
      'PDF View Error',
      'Could not open the PDF file directly. The file is still saved ' +
        (Platform.OS === 'ios'
          ? 'and can be accessed from the Files app.'
          : isPublicStorage
          ? 'to your Downloads folder.'
          : 'to app storage.'),
      [
        {
          text: 'Try Again',
          onPress: () => {
            if (Platform.OS === 'ios') {
              viewFileInFiles(filePath);
            } else {
              // For Android, try alternative opening method
              const androidPath = filePath.startsWith('file://')
                ? filePath
                : `file://${filePath}`;

              // Try to use Android's action view intent as fallback
              RNBlobUtil.android
                .actionViewIntent(
                  androidPath.replace('file://', ''),
                  'application/pdf',
                )
                .catch(err => {
                  console.error('Error with actionViewIntent:', err);
                });
            }
          },
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ],
    );
  }
};

/**
 * Request storage permissions for Android
 */
export const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    // Get the Android version safely
    let androidVersion = 0;

    if (Platform.OS === 'android') {
      if (typeof Platform.Version === 'number') {
        androidVersion = Platform.Version;
      } else if (typeof Platform.Version === 'string') {
        androidVersion = parseInt(Platform.Version, 10);
      }
    }

    console.log('Detected Android version:', androidVersion);

    // Android 13 is API 33+
    if (androidVersion >= 33) {
      console.log('Using Android 13+ permission model');
      // For Android 13+ (API 33+), we need different permissions
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
      ]);

      const mediaImagesGranted =
        granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
        PermissionsAndroid.RESULTS.GRANTED;

      console.log('READ_MEDIA_IMAGES permission granted:', mediaImagesGranted);

      return mediaImagesGranted;
    } else {
      console.log('Using legacy Android permission model');
      // For older Android versions, we need storage permissions
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);

      const writeGranted =
        granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
        PermissionsAndroid.RESULTS.GRANTED;

      const readGranted =
        granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
        PermissionsAndroid.RESULTS.GRANTED;

      console.log('Storage permissions granted:', {
        read: readGranted,
        write: writeGranted,
      });

      return writeGranted && readGranted;
    }
  } catch (err) {
    console.warn('Error requesting permissions:', err);
    return false;
  }
};

/**
 * Show notification for PDF file download
 */
export const showDownloadNotification = (
  filePath: string,
  fileName: string,
  isInward: boolean,
) => {
  console.log('Showing notification for downloaded PDF:', filePath);
  console.log('Using mode for notification:', isInward ? 'INWARD' : 'OUTWARD');

  // Ensure the file path is properly formatted for notification click handling
  const formattedFilePath =
    Platform.OS === 'android' && !filePath.startsWith('file://')
      ? `file://${filePath}`
      : filePath;

  // Configure the notification channel first (only needed for Android)
  if (Platform.OS === 'android') {
    // Create a specific channel for each type (inward/outward) to have different colors
    const channelId = isInward
      ? 'pdf-downloads-inward'
      : 'pdf-downloads-outward';

    // Make sure the notification is properly configured
    PushNotification.createChannel(
      {
        channelId,
        channelName: isInward
          ? 'Inward PDF Downloads'
          : 'Outward PDF Downloads',
        channelDescription: `Notifications for ${
          isInward ? 'Inward' : 'Outward'
        } PDF downloads`,
        importance: 5, // Max importance for visibility
        vibrate: true,
        // Use the appropriate color for the channel based on inward/outward
        lightColor: isInward ? '#F48221' : '#4682B4',
        playSound: true,
        soundName: 'default',
      },
      (created: boolean) => {
        console.log(
          `Notification channel created status: ${
            created ? 'success' : 'failed'
          }`,
        );
        if (!created) {
          console.log(
            'Failed to create notification channel, using Toast as fallback',
          );
          ToastAndroid.show(
            'PDF downloaded to Downloads folder',
            ToastAndroid.LONG,
          );
        }
      },
    );

    // Use a direct notification method as a fallback
    console.log('Attempting to show notification directly');
    try {
      PushNotification.localNotification({
        // Use inward or outward specific channel ID
        channelId: channelId,
        title: `${isInward ? 'Inward' : 'Outward'} Report Downloaded`,
        message: `PDF saved to Downloads folder`,
        playSound: true,
        soundName: 'default',
        color: isInward ? '#F48221' : '#4682B4', // Use the appropriate color
        importance: 'high',
        priority: 'high',
        visibility: 'public',
        vibrate: true,
        actions: ['View'], // Add a "View" button on the notification
        userInfo: {filePath: formattedFilePath}, // Store the file path
        id: String(Date.now()), // Unique id
      });
      console.log('Notification sent successfully');
    } catch (notifError) {
      console.error('Error showing notification:', notifError);
      // Fallback to Toast
      ToastAndroid.show(
        'PDF downloaded to Downloads folder',
        ToastAndroid.LONG,
      );
    }
  } else if (Platform.OS === 'ios') {
    // For iOS
    PushNotificationIOS.addNotificationRequest({
      id: String(Date.now()),
      title: `${isInward ? 'Inward' : 'Outward'} Report Downloaded`,
      body: `PDF has been saved to your device`,
      userInfo: {filePath: formattedFilePath},
      repeats: false,
      sound: 'default',
    });
  }
};
