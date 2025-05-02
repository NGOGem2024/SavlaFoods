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
    // For iOS, we can use this approach to view in Files app
    const iosFilesAppUrl = 'shareddocuments://';
    const canOpen = await Linking.canOpenURL(iosFilesAppUrl);

    if (canOpen) {
      await Linking.openURL(iosFilesAppUrl);
    } else {
      // Fallback to just opening the document
      await RNBlobUtil.ios.openDocument(filePath);
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
    await FileViewer.open(filePath, {
      showOpenWithDialog: true,
      showAppsSuggestions: true,
    });
  } catch (error) {
    console.error('Error opening PDF:', error);
    Alert.alert(
      'Success',
      Platform.OS === 'ios'
        ? 'Report saved successfully! You can access it from the Files app.'
        : isPublicStorage
        ? 'Report downloaded as PDF successfully to Downloads folder!'
        : 'Report saved to app storage. You can access it from within the app.',
      [
        {
          text: 'View PDF',
          onPress: () =>
            Platform.OS === 'ios'
              ? viewFileInFiles(publicFilePath)
              : openPdf(publicFilePath),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ],
    );
    // Alert.alert('Error', 'Could not open the PDF file');
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
        userInfo: {filePath: filePath}, // Store the file path
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
      userInfo: {filePath: filePath},
      repeats: false,
      sound: 'default',
    });
  }
};
