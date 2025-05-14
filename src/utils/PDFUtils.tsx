import {PDFDocument, rgb, PDFFont, PDFPage, RGB, StandardFonts} from 'pdf-lib';
import {Buffer} from 'buffer';
import RNBlobUtil from 'react-native-blob-util';
import {Platform, Alert} from 'react-native';

/**
 * Function to draw wrapped text in a PDF
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
  // Default options
  const lineHeight = options?.lineHeight || fontSize * 1.2;
  const align = options?.align || 'left';
  const font = options?.font;

  // If text is empty or undefined, return without drawing
  if (!text || text.trim() === '') return y;

  // Split text into words
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    let testWidth = testLine.length * (fontSize * 0.6); // Approximate width

    if (testWidth > width && line.length > 0) {
      // Draw the current line
      let drawX = x;
      if (align === 'center') {
        const lineWidth = line.length * (fontSize * 0.6);
        drawX = x + (width - lineWidth) / 2;
      } else if (align === 'right') {
        const lineWidth = line.length * (fontSize * 0.6);
        drawX = x + (width - lineWidth);
      }

      // Draw text with or without custom font
      if (font) {
        page.drawText(line, {
          x: drawX,
          y: currentY,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
      } else {
        page.drawText(line, {
          x: drawX,
          y: currentY,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
      }

      // Move to the next line
      line = words[i] + ' ';
      currentY -= lineHeight;
    } else {
      line = testLine;
    }
  }

  // Draw the last line
  if (line.trim().length > 0) {
    let drawX = x;
    if (align === 'center') {
      const lineWidth = line.length * (fontSize * 0.6);
      drawX = x + (width - lineWidth) / 2;
    } else if (align === 'right') {
      const lineWidth = line.length * (fontSize * 0.6);
      drawX = x + (width - lineWidth);
    }

    // Draw text with or without custom font
    if (font) {
      page.drawText(line, {
        x: drawX,
        y: currentY,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
    } else {
      page.drawText(line, {
        x: drawX,
        y: currentY,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
    }
  }

  return currentY;
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
 * Request storage permission for Android
 */
export const requestStoragePermission = async () => {
  if (Platform.OS !== 'android') return true;

  try {
    const granted = await RNBlobUtil.fs.df();
    return true;
  } catch (err) {
    console.warn('Storage permission error:', err);
    return false;
  }
};

/**
 * Format date for filename (safe format)
 */
export const formatDateForFilename = (date: Date) => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

/**
 * Get appropriate directory path for saving PDFs based on platform
 */
export const getPDFDirectoryPath = async (fileName: string) => {
  let dirPath: string;
  let publicFilePath: string;

  if (Platform.OS === 'ios') {
    // For iOS, use the Documents directory which is accessible to the user
    dirPath = RNBlobUtil.fs.dirs.DocumentDir;
    publicFilePath = `${dirPath}/${fileName}`;
  } else {
    // For Android, use the ACTUAL public Download directory
    // Let's request storage permissions if needed
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      console.log(
        'Storage permission denied, using app-specific directory as fallback',
      );
      // Use app-specific directory as fallback (will still work, just not visible in Downloads)
      dirPath = RNBlobUtil.fs.dirs.DownloadDir;
      publicFilePath = `${dirPath}/${fileName}`;

      // Show a different alert that explains the situation but allows continuing
      Alert.alert(
        'Limited Storage Access',
        'PDF will be saved to app storage only since storage permission was denied. You can still view the PDF from within the app.',
        [{text: 'Continue'}],
      );
    } else {
      // Use the public Download directory (NOT the app's private directory)
      dirPath = RNBlobUtil.fs.dirs.DownloadDir;
      publicFilePath = `${dirPath}/${fileName}`;
    }
  }

  return {dirPath, publicFilePath};
};
