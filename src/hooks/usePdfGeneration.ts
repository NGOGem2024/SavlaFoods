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

interface ReportFilters {
  unit: string;
  itemCategories: string[];
  itemSubcategories: string[];
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
    filters: ReportFilters,
  ) => {
    try {
      setPdfGenerating(true);
      setDownloadProgress(0);
      setStatusMessage('Initializing PDF generation...');

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

      // Log current state to help with debugging
      console.log('===== PDF DOWNLOAD STARTED =====');
      console.log('Current mode:', isInward ? 'INWARD' : 'OUTWARD');
      console.log('Report data count:', sanitizedReportData.length);

      // Format dates for filename
      const formatDateForFilename = (date: Date) => {
        return `${date.getDate().toString().padStart(2, '0')}-${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, '0')}-${date.getFullYear()}`;
      };

      const fromDateFormatted = formatDateForFilename(fromDate);
      const toDateFormatted = formatDateForFilename(toDate);

      // Format filters for filename
      const unitText = filters.unit ? `-${filters.unit}` : '';

      // Generate a filename with proper filter info
      const pdfFilename = `${
        isInward ? 'Inward' : 'Outward'
      }_Report_${customerName.replace(
        /\s+/g,
        '_',
      )}_${fromDateFormatted}_to_${toDateFormatted}${unitText}.pdf`.replace(
        /[&\/\\#,+()$~%.'":*?<>{}]/g,
        '_',
      );

      // Ensure filename ends with .pdf
      const finalFilename = pdfFilename.endsWith('.pdf')
        ? pdfFilename
        : `${pdfFilename}.pdf`;

      // Create appropriate directory paths for different platforms
      let dirPath: string;
      let publicFilePath: string;

      if (Platform.OS === 'ios') {
        // For iOS, use the Documents directory which is accessible to the user
        dirPath = RNFS.DocumentDirectoryPath; // Use RNFS instead of RNBlobUtil for consistency
        publicFilePath = `${dirPath}/${finalFilename}`;
        // We'll open the document AFTER writing it, not here
      } else {
        // For Android, use the public Download directory
        // Request storage permissions if needed
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          console.log(
            'Storage permission denied, using app-specific directory as fallback',
          );
          dirPath = RNBlobUtil.fs.dirs.DownloadDir; // App-specific when permissions denied
          publicFilePath = `${dirPath}/${finalFilename}`;

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

          publicFilePath = `${dirPath}/${finalFilename}`;
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
      const footerHeight = 50; // Increased footer height to prevent overlap
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
        {title: 'SR.No', width: 48},
        {title: 'Unit', width: 51},
        {title: isInward ? 'Inward Date' : 'Outward Date', width: 75},
        {title: isInward ? 'Inward No' : 'Outward No', width: 65},
        // {title: 'Customer', width: 80},
        {title: 'Lot No', width: 60},
        {title: 'Item Name', width: 96},
        {title: 'Vakkal No', width: 68},
        {title: 'Item Mark', width: 72},
        {title: 'Qty', width: 50},  // Increased width to create more space
        {title: 'Remark', width: 50},
        {title: 'Vehicle No', width: 68},
        ...(isInward ? [] : [{title: 'Delivered To', width: 65}]),
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

          // First line: Customer Name
          page.drawText(`Customer: ${safeCustName}`, {
            x: margin,
            y: yPosition - 20,
            size: 16,
            font: boldFont,
            color: rgb(0, 0, 0),
          });

          yPosition -= 30;

          // Second line: Company name with Unit
          let companyText = 'Savla Foods';
          
          // Draw company name
          page.drawText(companyText, {
            x: margin,
            y: yPosition - 20,
            size: 14,
            font: boldFont,
            color: rgb(0.2, 0.2, 0.2),
          });
          
          // Draw Unit separately with more spacing and less boldness
          if (safeUnit) {
            const regularFont = await pdfDoc.embedStandardFont(StandardFonts.TimesRoman);
            page.drawText(`Unit - ${safeUnit}`, {
              x: margin + boldFont.widthOfTextAtSize(companyText, 14) + 15, // Add 15 points of extra space
              y: yPosition - 20,
              size: 14,
              font: regularFont, // Use regular font instead of bold
              color: rgb(0.2, 0.2, 0.2),
            });
          }

          yPosition -= 30;

          // Third line: Report type
          page.drawText(isInward ? 'Inward Report' : 'Outward Report', {
            x: margin,
            y: yPosition - 20,
            size: 12,
            color: rgb(0.4, 0.4, 0.4),
          });

          yPosition -= 30;

          // Fourth line: Date range
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
              y: yPosition - 15,
              size: 11,
              color: rgb(0.3, 0.3, 0.3),
            },
          );

          yPosition -= 35;
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
            // item.CUSTOMER_NAME || '-',
            item.LOT_NO || '-',
            item.ITEM_NAME || '-',
            item.VAKAL_NO || '-',
            item.ITEM_MARKS || '-',
            isInward ? item.QUANTITY || '-' : item.DC_QTY || '-',
            item.REMARK || item.REMARKS || '-',
            item.VEHICLE_NO || '-',
            ...(isInward ? [] : [item.DELIVERED_TO || '-']),
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

          // Calculate positions for the total row
          let itemMarkPosition = margin;
          let qtyPosition = margin;
          
          // Get position of Item Mark column (column 7)
          for (let i = 0; i < 7; i++) {
            itemMarkPosition += tableColumns[i].width;
          }
          
          // Get position of Qty column (column 8)
          for (let i = 0; i < 8; i++) {
            qtyPosition += tableColumns[i].width;
          }
          
          // Draw "Total Quantity:" label directly without wrapping
          const totalText = "Total Quantity";
          const textWidth = boldFont.widthOfTextAtSize(totalText, headerSize);
          
          // Calculate the Item Mark column's center position
          const itemMarkCenter = itemMarkPosition + tableColumns[7].width / 2;
          
          // Position label more to the left side
          page.drawText(totalText, {
            x: itemMarkCenter - textWidth / 2 - 15,  // Moved 15 points to the left
            y: totalRowY - rowHeight / 2,
            size: headerSize,
            font: boldFont,
          });
          
          // Draw the quantity value aligned with the Qty column above, but moved left
          page.drawText(`${Math.round(totalQty)}`, {
            x: qtyPosition + tableColumns[8].width / 2 - boldFont.widthOfTextAtSize(`${Math.round(totalQty)}`, headerSize) / 2 - 15, // Moved 15 points left to match label
            y: totalRowY - rowHeight / 2,
            size: headerSize,
            font: boldFont,
          });
        }

        // Add footer with page number and generation timestamp with better positioning
        const footerY = margin + 25; // Moved footer higher to avoid overlap
        
        page.drawText(`Page ${pageNumber + 1} of ${totalPages}`, {
          x: pageWidth - margin - 100,
          y: footerY,
          size: 8,
          color: rgb(0.5, 0.5, 0.5),
        });

        // Add generation timestamp
        const safeTimestamp = sanitizeStringForPdf(new Date().toLocaleString());
        page.drawText(`Generated: ${safeTimestamp}`, {
          x: margin,
          y: footerY,
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
        publicFilePath = await getUniqueFileName(dirPath, finalFilename);

        // Write the file
        await RNBlobUtil.fs.writeFile(publicFilePath, base64Pdf, 'base64');

        // For iOS, try to open the document AFTER it's been written
        if (Platform.OS === 'ios') {
          try {
            await RNBlobUtil.ios.openDocument(publicFilePath);
          } catch (iosError) {
            console.log(
              'Could not open the document automatically, but it was saved:',
              iosError,
            );
          }
        }

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
        showDownloadNotification(publicFilePath, finalFilename, isInward);

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
              onPress: () => {
                try {
                  // Make sure the path format is correct for the platform
                  const formattedPath =
                    Platform.OS === 'android' &&
                    !publicFilePath.startsWith('file://')
                      ? `file://${publicFilePath}`
                      : publicFilePath;

                  // Open the PDF with a slight delay to ensure it's fully written
                  setTimeout(() => {
                    openPdf(formattedPath);
                  }, 300);
                } catch (viewError) {
                  console.error('Error opening PDF:', viewError);
                  Alert.alert(
                    'Error',
                    'Could not open the PDF file. The file was saved successfully, but there was an error opening it.',
                  );
                }
              },
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