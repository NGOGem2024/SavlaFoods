import {useState} from 'react';
import {Alert, Platform, ToastAndroid} from 'react-native';
import RNFS from 'react-native-fs';
// @ts-ignore
import {PDFDocument, rgb, StandardFonts} from 'pdf-lib';
// Buffer polyfill for pdf-lib
import {Buffer} from 'buffer';
// @ts-ignore
import RNBlobUtil from 'react-native-blob-util';

import {
  drawWrappedText,
  getUniqueFileName,
  openPdf,
  requestStoragePermission,
  showDownloadNotification,
} from '../utils/ReportPdfUtils';

interface UsePdfGenerationProps {
  isInward: boolean;
}

export const usePdfGeneration = ({isInward}: UsePdfGenerationProps) => {
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Preparing...');

  // Update progress UI
  const updateProgressUI = (progress: number, message: string): void => {
    setDownloadProgress(progress);
    setStatusMessage(message);
  };

  // Helper function to sanitize strings for PDF generation
  const sanitizeStringForPdf = (input: string): string => {
    if (typeof input !== 'string') return String(input);

    return (
      input
        // Replace problematic whitespace characters
        .replace(/[\u202F\u00A0\u2007\u2060\uFEFF\u200B\u200C\u200D]/g, ' ') // Various space and zero-width characters
        // Replace various dash characters
        .replace(/[\u2013\u2014\u2015\u2212]/g, '-')
        // Replace quotes
        .replace(/[\u201C\u201D\u2018\u2019]/g, '"')
        // Other common problematic characters
        .replace(/[\u2022]/g, '*') // bullet points
        .replace(/[^\x00-\x7F]/g, char => {
          // Replace any remaining non-ASCII characters with closest ASCII equivalent or empty string
          try {
            return char.normalize('NFKD').replace(/[^\x00-\x7F]/g, '');
          } catch (e) {
            return '';
          }
        })
    );
  };

  // Generate PDF report
  const generatePdf = async (
    reportData: any[],
    fromDate: Date,
    toDate: Date,
    customerName: string,
    filters: any,
  ) => {
    try {
      setPdfGenerating(true);
      setDownloadProgress(0);

      // Create notification for download progress
      updateProgressUI(20, 'Preparing your report PDF...');

      // Sanitize all reportData values to remove problematic Unicode characters
      const sanitizedReportData = reportData.map(item => {
        const sanitizedItem = {...item};
        // Process each property to replace problematic characters
        Object.keys(sanitizedItem).forEach(key => {
          if (typeof sanitizedItem[key] === 'string') {
            sanitizedItem[key] = sanitizeStringForPdf(sanitizedItem[key]);
          }
        });
        return sanitizedItem;
      });

      // Also sanitize the customer name and other text inputs
      const safeCustName = sanitizeStringForPdf(customerName);
      const safeUnit = filters.unit ? sanitizeStringForPdf(filters.unit) : '';
      const safeItemCategory = filters.itemCategory
        ? sanitizeStringForPdf(filters.itemCategory)
        : '';
      const safeItemSubcategory = filters.itemSubcategory
        ? sanitizeStringForPdf(filters.itemSubcategory)
        : '';

      // Log current state to help with debugging
      console.log('===== PDF DOWNLOAD STARTED =====');
      console.log('Current mode:', isInward ? 'INWARD' : 'OUTWARD');
      console.log('Report data count:', sanitizedReportData.length);

      // Format dates for filename - avoid any slashes or special characters
      const formatDateForFilename = (date: Date) => {
        return `${date.getDate().toString().padStart(2, '0')}-${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, '0')}-${date.getFullYear()}`;
      };

      const safeFromDate = formatDateForFilename(fromDate);
      const safeToDate = formatDateForFilename(toDate);
      const reportTitle = isInward ? 'Inward_Report' : 'Outward_Report';
      const fileName = `${reportTitle}_${safeFromDate}_to_${safeToDate}.pdf`;

      // Create appropriate directory paths for different platforms
      let dirPath: string;
      let publicFilePath: string;

      if (Platform.OS === 'ios') {
        // For iOS, use the Documents directory which is accessible to the user
        dirPath = RNFS.DocumentDirectoryPath; // Use RNFS instead of RNBlobUtil for consistency
        publicFilePath = `${dirPath}/${fileName}`;

        // After saving the file, we need to make it accessible
        const success = await RNBlobUtil.ios.openDocument(publicFilePath);
        if (!success) {
          console.log('Could not open the document, but it was saved');
        }
      } else {
        // For Android, use the public Download directory
        // Request storage permissions if needed
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          console.log(
            'Storage permission denied, using app-specific directory as fallback',
          );
          dirPath = RNBlobUtil.fs.dirs.DownloadDir; // App-specific when permissions denied
          publicFilePath = `${dirPath}/${fileName}`;

          Alert.alert(
            'Limited Storage Access',
            'PDF will be saved to app storage only since storage permission was denied.',
            [{text: 'Continue'}],
          );
        } else {
          // Use the public Download directory
          dirPath = RNBlobUtil.fs.dirs.DownloadDir;

          // Ensure we're using the public Downloads directory
          if (dirPath.includes('Android/data')) {
            // If we got the app's private directory, try to get public directory
            const directPath = '/storage/emulated/0/Download';
            try {
              const directPathExists = await RNBlobUtil.fs.exists(directPath);
              if (directPathExists) {
                // Test if writable
                const testFile = `${directPath}/test-write-access.txt`;
                await RNBlobUtil.fs.writeFile(testFile, 'test', 'utf8');
                await RNBlobUtil.fs.unlink(testFile);
                dirPath = directPath;
              }
            } catch (error) {
              console.log('Using app-specific directory due to error:', error);
            }
          }

          publicFilePath = `${dirPath}/${fileName}`;
        }
      }

      // Update progress
      setDownloadProgress(25);
      updateProgressUI(25, 'Creating PDF document...');

      // Create a PDF document
      const pdfDoc = await PDFDocument.create();

      // Set up PDF dimensions and styles
      const totalRows = sanitizedReportData.length;
      let fontSize =
        totalRows <= 10 ? 9 : totalRows <= 20 ? 8 : totalRows <= 40 ? 7 : 6;
      let headerSize = fontSize + 2;
      let rowHeight = fontSize * 5;
      let lineHeight = fontSize * 1.2;

      // Landscape A4 dimensions
      const pageWidth = 842;
      const pageHeight = 595;
      const margin = 20;

      // Calculate available space and rows per page
      const headerHeight = 160;
      const continuedPageHeaderHeight = 40;
      const footerHeight = 30;
      const availableHeight =
        pageHeight - margin * 2 - headerHeight - footerHeight;
      const availableHeightContinuedPage =
        pageHeight - margin * 2 - continuedPageHeaderHeight - footerHeight;

      const rowsPerFirstPage = Math.floor(availableHeight / rowHeight);
      const rowsPerContinuedPage = Math.floor(
        availableHeightContinuedPage / rowHeight,
      );

      // Calculate total pages needed
      let remainingRows = sanitizedReportData.length - rowsPerFirstPage;
      let totalPages = 1;

      if (remainingRows > 0) {
        totalPages += Math.ceil(remainingRows / rowsPerContinuedPage);
      }

      // Define table columns with widths
      const tableColumns = [
        {title: '#', width: 25},
        {title: 'Unit', width: 40},
        {title: isInward ? 'Inward Date' : 'Outward Date', width: 70},
        {title: isInward ? 'Inward No' : 'Outward No', width: 60},
        {title: 'Customer', width: 80},
        {title: 'Vehicle', width: 60},
        {title: 'Lot No', width: 45},
        {title: 'Item Name', width: 90},
        {title: 'Remark', width: 50},
        {title: 'Item', width: 50},
        {title: 'Vakkal', width: 40},
        {title: 'Qty', width: 35},
        {title: 'Delivered', width: 55},
      ];

      // Calculate table width
      const tableWidth = tableColumns.reduce((sum, col) => sum + col.width, 0);

      // Generate pages
      let processedRows = 0;

      for (let pageNumber = 0; pageNumber < totalPages; pageNumber++) {
        // Create a new page
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Initial y-position from top of page
        let yPosition = pageHeight - margin;

        // Calculate rows for this page
        const isFirstPage = pageNumber === 0;
        const rowsOnThisPage = isFirstPage
          ? rowsPerFirstPage
          : rowsPerContinuedPage;
        const startRow = processedRows;
        const endRow = Math.min(
          startRow + rowsOnThisPage,
          sanitizedReportData.length,
        );

        // Draw page header based on page type
        if (isFirstPage) {
          // Draw title and company info on first page
          const boldFont = await pdfDoc.embedStandardFont(
            StandardFonts.TimesRomanBold,
          );

          page.drawText(isInward ? 'Inward Report' : 'Outward Report', {
            x: margin,
            y: yPosition - 20,
            size: 18,
            font: boldFont,
            color: rgb(0, 0, 0),
          });

          page.drawText('Savla Foods & Cold Storage Pvt Ltd', {
            x: margin,
            y: yPosition - 45,
            size: 12,
            color: rgb(0.2, 0.2, 0.2),
          });

          yPosition -= 65;

          // Add report metadata (dates, filters, etc.)
          const formatDate = (date: Date) => {
            return `${date.getDate().toString().padStart(2, '0')}/${(
              date.getMonth() + 1
            )
              .toString()
              .padStart(2, '0')}/${date.getFullYear()}`;
          };

          page.drawText(
            `From: ${formatDate(fromDate)} To: ${formatDate(toDate)}`,
            {
              x: margin,
              y: yPosition,
              size: 10,
              color: rgb(0.2, 0.2, 0.2),
            },
          );

          yPosition -= 20;

          // Draw filters text
          let filtersText = ` Customer: ${safeCustName}`;
          if (safeUnit) filtersText += `, Unit: ${safeUnit}`;
          if (safeItemCategory)
            filtersText += `, Category: ${safeItemCategory}`;
          if (safeItemSubcategory)
            filtersText += `, Subcategory: ${safeItemSubcategory}`;

          page.drawText(filtersText, {
            x: margin,
            y: yPosition,
            size: 8,
            color: rgb(0.3, 0.3, 0.3),
          });

          yPosition -= 20;

          // Draw record count
          page.drawText(`Records found: ${sanitizedReportData.length}`, {
            x: margin,
            y: yPosition,
            size: 10,
            color: rgb(0.2, 0.2, 0.2),
          });

          yPosition -= 20;
        } else {
          // For continued pages, just add a small header
          const boldFont = await pdfDoc.embedStandardFont(
            StandardFonts.TimesRomanBold,
          );
          page.drawText(
            `${isInward ? 'Inward' : 'Outward'} Report (Continued)`,
            {
              x: margin,
              y: yPosition - 20,
              size: 14,
              font: boldFont,
              color: rgb(0, 0, 0),
            },
          );

          yPosition -= 40;
        }

        // Table start position
        const tableTop = yPosition;

        // Draw table outer border
        page.drawRectangle({
          x: margin,
          y: tableTop - (endRow - startRow + 1) * rowHeight,
          width: tableWidth,
          height: (endRow - startRow + 1) * rowHeight,
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 1,
          color: rgb(1, 1, 1), // White fill
        });

        // Draw table header
        page.drawRectangle({
          x: margin,
          y: tableTop - rowHeight,
          width: tableWidth,
          height: rowHeight,
          color: rgb(0.92, 0.92, 0.92), // Slightly darker gray background
          borderWidth: 1,
          borderColor: rgb(0.7, 0.7, 0.7),
        });

        // Draw vertical column lines
        let xPosition = margin;
        for (const column of tableColumns) {
          xPosition += column.width;

          if (column !== tableColumns[tableColumns.length - 1]) {
            page.drawLine({
              start: {x: xPosition, y: tableTop - rowHeight},
              end: {
                x: xPosition,
                y: tableTop - (endRow - startRow + 1) * rowHeight,
              },
              color: rgb(0.7, 0.7, 0.7),
              thickness: 0.5,
            });
          }
        }

        // Draw column headers
        xPosition = margin;
        const boldFont = await pdfDoc.embedStandardFont(
          StandardFonts.TimesRomanBold,
        );

        for (let colIndex = 0; colIndex < tableColumns.length; colIndex++) {
          const column = tableColumns[colIndex];

          // Determine alignment for this column (center for # and Qty)
          let columnAlign: 'left' | 'center' | 'right' =
            colIndex === 0 || colIndex === 11 ? 'center' : 'left';

          drawWrappedText(
            page,
            column.title,
            xPosition + 4,
            tableTop - rowHeight / 2,
            column.width - 8,
            headerSize,
            {font: boldFont, align: columnAlign},
          );

          xPosition += column.width;
        }

        // Draw horizontal line after header
        page.drawLine({
          start: {x: margin, y: tableTop - rowHeight},
          end: {x: margin + tableWidth, y: tableTop - rowHeight},
          color: rgb(0.6, 0.6, 0.6),
          thickness: 1.5,
        });

        // Draw data rows
        for (let i = startRow; i < endRow; i++) {
          const item = sanitizedReportData[i];
          const rowY = tableTop - rowHeight - (i - startRow) * rowHeight;

          // Draw row background (alternating colors)
          page.drawRectangle({
            x: margin,
            y: rowY - rowHeight,
            width: tableWidth,
            height: rowHeight,
            color: i % 2 === 0 ? rgb(0.98, 0.98, 1) : rgb(1, 1, 1),
            borderWidth: 0,
          });

          // Draw horizontal line after each data row
          page.drawLine({
            start: {x: margin, y: rowY - rowHeight},
            end: {x: margin + tableWidth, y: rowY - rowHeight},
            color: rgb(0.8, 0.8, 0.8),
            thickness: 0.5,
          });

          // Insert data in each cell
          xPosition = margin;

          // Column alignments
          const columnAlignments = tableColumns.map((_, index) =>
            index === 0 || index === 11 ? 'center' : 'left',
          ) as ('left' | 'center' | 'right')[];

          // Render each cell in the row
          // Column 1: Index number
          drawWrappedText(
            page,
            String(i + 1),
            xPosition + 4,
            rowY - rowHeight / 2,
            tableColumns[0].width - 8,
            fontSize,
            {align: columnAlignments[0]},
          );

          xPosition += tableColumns[0].width;

          // Column 2: Unit
          drawWrappedText(
            page,
            String(item.UNIT_NAME || '-'),
            xPosition + 4,
            rowY - rowHeight / 2,
            tableColumns[1].width - 8,
            fontSize,
            {align: columnAlignments[1]},
          );

          xPosition += tableColumns[1].width;

          // Column 3: Date
          const dateText = isInward
            ? item.GRN_DATE
              ? new Date(item.GRN_DATE).toLocaleDateString('en-GB')
              : '-'
            : item.OUTWARD_DATE
            ? new Date(item.OUTWARD_DATE).toLocaleDateString('en-GB')
            : '-';

          drawWrappedText(
            page,
            String(dateText),
            xPosition + 4,
            rowY - rowHeight / 2,
            tableColumns[2].width - 8,
            fontSize,
            {align: columnAlignments[2]},
          );

          xPosition += tableColumns[2].width;

          // Remaining columns (columns 4-13)
          const remainingColumns = [
            isInward ? item.GRN_NO || '-' : item.OUTWARD_NO || '-',
            item.CUSTOMER_NAME || '-',
            item.VEHICLE_NO || '-',
            item.LOT_NO || '-',
            item.ITEM_NAME || '-',
            item.REMARK || item.REMARKS || '-',
            item.ITEM_MARKS || '-',
            item.VAKAL_NO || '-',
            isInward ? item.QUANTITY || '-' : item.DC_QTY || '-',
            item.DELIVERED_TO || '-',
          ];

          for (let c = 0; c < remainingColumns.length; c++) {
            drawWrappedText(
              page,
              String(remainingColumns[c]),
              xPosition + 4,
              rowY - rowHeight / 2,
              tableColumns[c + 3].width - 8,
              fontSize,
              {align: columnAlignments[c + 3]},
            );

            xPosition += tableColumns[c + 3].width;
          }
        }

        // Add total row on the last page
        if (pageNumber === totalPages - 1) {
          const totalRowY =
            tableTop - rowHeight - (endRow - startRow) * rowHeight;

          // Draw total row background
          page.drawRectangle({
            x: margin,
            y: totalRowY - rowHeight,
            width: tableWidth,
            height: rowHeight,
            color: rgb(0.95, 0.95, 0.95),
            borderWidth: 0,
          });

          // Calculate total quantity
          const totalQty = sanitizedReportData.reduce((total, item) => {
            const qty = isInward
              ? parseFloat(item.QUANTITY || '0')
              : parseFloat(item.DC_QTY || '0');
            return total + (isNaN(qty) ? 0 : qty);
          }, 0);

          // Draw total text
          drawWrappedText(
            page,
            `Total Quantity: ${totalQty.toFixed(2)}`,
            margin + 10,
            totalRowY - rowHeight / 2,
            tableWidth - 20,
            headerSize,
            {font: boldFont},
          );
        }

        // Add footer with page number
        page.drawText(`Page ${pageNumber + 1} of ${totalPages}`, {
          x: pageWidth - margin - 100,
          y: margin + 10,
          size: 8,
          color: rgb(0.5, 0.5, 0.5),
        });

        // Add generation timestamp
        const safeTimestamp = sanitizeStringForPdf(new Date().toLocaleString());
        page.drawText(`Generated: ${safeTimestamp}`, {
          x: margin,
          y: margin + 10,
          size: 8,
          color: rgb(0.5, 0.5, 0.5),
        });

        // Update progress for each page
        setDownloadProgress(
          30 + Math.floor(((pageNumber + 1) / totalPages) * 50),
        );
        updateProgressUI(
          30 + Math.floor(((pageNumber + 1) / totalPages) * 50),
          `Creating page ${pageNumber + 1} of ${totalPages}...`,
        );

        // Update processed rows
        processedRows += rowsOnThisPage;
      }

      // Save the PDF
      setDownloadProgress(80);
      updateProgressUI(80, 'Finalizing PDF...');

      const pdfBytes = await pdfDoc.save();
      const base64Pdf = Buffer.from(pdfBytes).toString('base64');

      try {
        // Create directory if needed
        const dirExists = await RNBlobUtil.fs.exists(dirPath);
        if (!dirExists) {
          await RNBlobUtil.fs.mkdir(dirPath);
        }

        // Get unique filename to avoid conflicts
        publicFilePath = await getUniqueFileName(dirPath, fileName);

        // Write the file
        await RNBlobUtil.fs.writeFile(publicFilePath, base64Pdf, 'base64');

        // Make file visible in media gallery (Android)
        if (Platform.OS === 'android') {
          try {
            await RNBlobUtil.fs.scanFile([
              {path: publicFilePath, mime: 'application/pdf'},
            ]);
            ToastAndroid.showWithGravity(
              'PDF saved to Downloads folder',
              ToastAndroid.LONG,
              ToastAndroid.BOTTOM,
            );
          } catch (scanError) {
            console.warn('Error scanning file:', scanError);
          }
        }

        // Complete progress
        setDownloadProgress(100);
        updateProgressUI(100, 'Download complete!');

        // Show notification
        showDownloadNotification(publicFilePath, fileName, isInward);

        // Show success alert
        const isPublicStorage = !publicFilePath.includes('Android/data');
        Alert.alert(
          'Success',
          isPublicStorage
            ? 'Report downloaded as PDF successfully to Downloads folder!'
            : 'Report saved to app storage. You can access it from within the app.',
          [
            {
              text: 'View PDF',
              onPress: () => openPdf(publicFilePath),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ],
        );

        return publicFilePath;
      } catch (error) {
        console.error('Error saving PDF:', error);
        Alert.alert(
          'Error',
          'Failed to save PDF file: ' +
            (error instanceof Error ? error.message : String(error)),
        );
        throw error;
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert(
        'Error',
        'Failed to generate PDF: ' +
          (error instanceof Error ? error.message : String(error)),
      );
      throw error;
    } finally {
      setPdfGenerating(false);
    }
  };

  return {
    pdfGenerating,
    downloadProgress,
    statusMessage,
    generatePdf,
    updateProgressUI,
  };
};
