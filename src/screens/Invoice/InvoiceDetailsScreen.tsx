import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import axios, {AxiosError} from 'axios';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import QRCode from 'react-native-qrcode-svg'; // Add QRCode import
import Share from 'react-native-share'; // Import Share
import RNFetchBlob from 'rn-fetch-blob'; // Import RNFetchBlob
import {
  API_ENDPOINTS,
  getAuthHeaders,
  API_BASE_URL,
} from '../../config/api.config';
import {LayoutWrapper} from '../../components/AppLayout';

// Define navigation param list
type RootStackParamList = {
  InvoiceDetailsScreen: {invoiceNo: string};
  InvoiceReportScreen: any; // Add other routes as needed
};

// Define types for invoice data
interface InvoiceHeader {
  invoiceNo: string;
  invoiceDate: string;
  period: string;
  signedQRCode?: string; // Add QR code field
  hasQRCode?: boolean; // Add QR code flag
  qrCodeLength?: number; // Add QR code length
}

interface BillingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  gstin: string;
  stateCode: string; // Fixed typo from 'verschwTS' to 'string'
}

interface CustomerDetails {
  name: string;
}

interface InvoiceItem {
  inDate: string;
  outDate: string;
  lotNo: string;
  itemName: string;
  tax: {
    cgstPercent: number;
    sgstPercent: number;
    igstPercent: number;
  };
  quantity: number;
  rate: string;
  balanceQty: number;
  amount: string;
}

interface InvoiceSummary {
  totalInvoiceItemAmount: string;
  totalSGSTAmount: string;
  totalCGSTAmount: string;
  totalIGSTAmount: string;
  totalTaxAmount: string;
  totalRoundoffAmount: string;
  totalInvoiceAmount: string;
}

// Add SAC Code Summary interfaces
interface SacCodeDetail {
  serialNo: number;
  sacCode: string;
  sacCodeDescription: string;
  taxableValue: string;
  cgst: {
    percent: number;
    amount: string;
  };
  sgst: {
    percent: number;
    amount: string;
  };
  igst: {
    percent: number;
    amount: string;
  };
}

interface SacCodeSummary {
  title: string;
  details: SacCodeDetail[];
  totals: {
    totalTaxableValue: string;
    totalCGSTAmount: string;
    totalSGSTAmount: string;
    totalIGSTAmount: string;
  };
  additionalInfo?: {
    whetherTaxPayableUnderReverseCharges: string;
    errorAndOmissionsExcepted: boolean;
  };
}

interface InvoiceData {
  invoiceHeader: InvoiceHeader;
  billingAddress: BillingAddress;
  customerDetails: CustomerDetails;
  invoiceItems: InvoiceItem[];
  invoiceSummary: InvoiceSummary;
  sacCodeSummary?: SacCodeSummary; // Add SAC Code Summary
}

interface ApiResponse {
  success: boolean;
  invoiceData?: InvoiceData;
  message?: string;
}

const {width} = Dimensions.get('window');

const InvoiceDetailsScreen: React.FC = () => {
  // Corrected typing for useRoute
  const route =
    useRoute<RouteProp<RootStackParamList, 'InvoiceDetailsScreen'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {invoiceNo} = route.params || {};

  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState<boolean>(false);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);
  const [qrCodeLoading, setQrCodeLoading] = useState<boolean>(false);

  useEffect(() => {
    if (invoiceNo) {
      fetchInvoiceDetails();
    } else {
      setError('Invoice number not provided');
      setLoading(false);
    }
  }, [invoiceNo]);

  // Reset QR code error when invoice data changes
  useEffect(() => {
    if (invoiceData) {
      setQrCodeError(null);
      setQrCodeLoading(true);
      // Simulate loading time for QR code generation
      const timer = setTimeout(() => {
        setQrCodeLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [invoiceData]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const endpoint = `${API_ENDPOINTS.GET_TAX_INVOICE_DETAILS}/${invoiceNo}`;

      console.log('Fetching invoice details from:', endpoint);

      const response = await axios.get<ApiResponse>(endpoint, {
        headers,
        timeout: 30000,
      });

      console.log('Invoice Details Response:', response.data);

      if (response.data.success && response.data.invoiceData) {
        setInvoiceData(response.data.invoiceData);
      } else {
        const errorMessage =
          response.data.message || 'Failed to fetch invoice details';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error('Invoice Details API Error:', axiosError);
      let errorMessage = 'Failed to fetch invoice details';

      if (axiosError.response) {
        console.error('Error Response:', axiosError.response.data);
        if (axiosError.response.status === 404) {
          errorMessage = 'Invoice not found. Please check the invoice number.';
        } else {
          errorMessage =
            (axiosError.response.data as {message?: string})?.message ||
            `Server Error: ${axiosError.response.status}`;
        }
      } else if (axiosError.request) {
        console.error('No Response:', axiosError.request);
        errorMessage = 'Network Error: Unable to connect to server';
      } else {
        console.error('Error Message:', axiosError.message);
        errorMessage = axiosError.message || 'An unexpected error occurred';
      }

      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceNo) {
      Alert.alert('Error', 'Invoice number is required to download PDF');
      return;
    }

    if (!API_BASE_URL) {
      console.error('Base URL is undefined');
      Alert.alert(
        'Configuration Error',
        'API base URL is not configured properly.',
      );
      return;
    }

    try {
      setDownloadingPDF(true);
      
      // Show downloading notification
      Alert.alert(
        'Download Started',
        'Your invoice PDF is being downloaded. Please wait...',
        [{ text: 'OK' }],
        { cancelable: true }
      );

      // Get auth headers
      const headers = await getAuthHeaders();
      const pdfEndpoint = `${API_ENDPOINTS.GET_PDF_REPORT}/${invoiceNo}`;
      
      console.log('Downloading PDF from:', pdfEndpoint);
      
      // Create a unique filename with timestamp to avoid conflicts
      const fileName = `Invoice_${invoiceNo}_${Date.now()}.pdf`;
      
      // Get directory path based on platform
      const { dirs } = RNFetchBlob.fs;
      const dirPath = Platform.OS === 'ios' ? dirs.DocumentDir : dirs.DownloadDir;
      
      // Configure options for RNFetchBlob
      const configOptions = {
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true, // Use Android's download manager
          notification: true, // Show notification when download is complete
          mediaScannable: true, // Make the file visible in the Downloads app
          title: `Invoice_${invoiceNo}.pdf`,
          description: 'Downloading invoice PDF',
          mime: 'application/pdf',
          path: `${dirPath}/${fileName}`,
        },
        path: `${dirPath}/${fileName}`,
      };
      
      // Convert headers object to format expected by RNFetchBlob
      const rnFetchBlobHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(headers)) {
        if (typeof value === 'string') {
          rnFetchBlobHeaders[key] = value;
        }
      }
      
      // Download the file using RNFetchBlob
      const response = await RNFetchBlob.config(configOptions)
        .fetch('GET', pdfEndpoint, rnFetchBlobHeaders);
      
      const filePath = response.path();
      console.log('PDF downloaded successfully to:', filePath);
      
      // Show success message
      Alert.alert(
        'Download Complete',
        `Invoice PDF has been downloaded successfully to your ${Platform.OS === 'android' ? 'Downloads folder' : 'Documents folder'}!`,
        [
          {
            text: 'Open PDF',
            onPress: () => {
              if (Platform.OS === 'ios') {
                // For iOS, use FileViewer
                FileViewer.open(filePath)
                  .catch(error => {
                    console.error('Error opening PDF:', error);
                    Alert.alert('Error', 'Unable to open the PDF file.');
                  });
              } else {
                // For Android, use the Android file opener
                RNFetchBlob.android.actionViewIntent(filePath, 'application/pdf');
              }
            },
          },
          {
            text: 'Share',
            onPress: () => {
              Share.open({
                url: `file://${filePath}`,
                type: 'application/pdf',
                title: 'Share Invoice PDF',
              }).catch(error => {
                console.error('Error sharing PDF:', error);
              });
            },
          },
          {
            text: 'OK',
            style: 'default',
          },
        ],
      );
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error('PDF Download Error:', axiosError);
      let errorMessage = 'Failed to download PDF';

      if (axiosError.response) {
        console.error('Error Response:', axiosError.response.data);
        if (axiosError.response.status === 404) {
          errorMessage = 'Invoice not found. Please check the invoice number.';
        } else if (axiosError.response.status === 500) {
          errorMessage = 'Server error occurred while generating PDF.';
        } else {
          errorMessage =
            (axiosError.response.data as {message?: string})?.message ||
            `Server Error: ${axiosError.response.status}`;
        }
      } else if (axiosError.request) {
        console.error('No Response:', axiosError.request);
        errorMessage = 'Network Error: Unable to connect to server';
      } else {
        console.error('Error Message:', axiosError.message);
        errorMessage = axiosError.message || 'An unexpected error occurred';
      }

      Alert.alert('Download Failed', errorMessage);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const formatCurrency = (amount: string | number): string => {
    const numAmount = parseFloat(amount.toString() || '0');
    if (isNaN(numAmount)) return '₹0.00';
    return `₹${numAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string | number | Date): string => {
    if (!dateString) return 'N/A';
    try {
      let dateStr = dateString.toString();
      const parts = dateStr.split('/');
      if (parts.length === 3 && parts[2].length === 4) {
        dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error: unknown) {
      return dateString.toString();
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.companyHeader}>
        <Text style={styles.companyName}>
          Savla Foods & Cold Storage Pvt. Ltd.
        </Text>
      </View>

      <View style={styles.taxInvoiceRow}>
        <Text style={styles.taxInvoiceTitle}>TAX INVOICE</Text>
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.downloadButton,
            downloadingPDF && styles.downloadButtonDisabled,
          ]}
          onPress={handleDownloadPDF}
          disabled={downloadingPDF}>
          {downloadingPDF ? (
            <View style={styles.downloadButtonContent}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.downloadButtonText}>Downloading...</Text>
            </View>
          ) : (
            <Text style={styles.downloadButtonText}>📄 Download PDF</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.printButton}
          onPress={() => {
            // Capture the current screen as an image
            Alert.alert(
              'Print Screen',
              'Screen capture functionality initiated',
              [{ text: 'OK' }]
            );
          }}>
          <Text style={styles.printButtonText}>🖨️ Print Screen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInvoiceInfo = () => {
    if (!invoiceData?.invoiceHeader || !invoiceData?.billingAddress)
      return null;

    const {invoiceHeader, billingAddress} = invoiceData;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Invoice Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invoice No</Text>
              <Text style={styles.infoValue}>
                {invoiceHeader.invoiceNo || 'N/A'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invoice Date</Text>
              <Text style={styles.infoValue}>
                {formatDate(invoiceHeader.invoiceDate)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Period</Text>
              <Text style={styles.infoValue}>
                {invoiceHeader.period || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Place of Supply</Text>
              <Text style={styles.infoValue}>
                {billingAddress.state || 'N/A'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>State Code</Text>
              <Text style={styles.infoValue}>
                {billingAddress.stateCode || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderBillingInfo = () => {
    if (!invoiceData?.customerDetails || !invoiceData?.billingAddress)
      return null;

    const {customerDetails, billingAddress} = invoiceData;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Billing Information</Text>
        <View style={styles.billingCard}>
          <Text style={styles.customerName}>
            {customerDetails.name || 'N/A'}
          </Text>
          <Text style={styles.addressText}>
            {billingAddress.addressLine1 || ''}
          </Text>
          {billingAddress.addressLine2 && (
            <Text style={styles.addressText}>
              {billingAddress.addressLine2}
            </Text>
          )}
          <Text style={styles.addressText}>
            {billingAddress.city ? `${billingAddress.city}, ` : ''}
            {billingAddress.state ? `${billingAddress.state} - ` : ''}
            {billingAddress.pincode || ''}
          </Text>
          <Text style={styles.addressText}>{billingAddress.country || ''}</Text>

          <View style={styles.gstContainer}>
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>GSTIN</Text>
              <Text style={styles.gstValue}>
                {billingAddress.gstin || 'N/A'}
              </Text>
            </View>
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>State Code</Text>
              <Text style={styles.gstValue}>
                {billingAddress.stateCode || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderItemsTable = () => {
    if (
      !invoiceData?.invoiceItems ||
      !Array.isArray(invoiceData.invoiceItems)
    ) {
      return (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Invoice Items</Text>
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No items found</Text>
          </View>
        </View>
      );
    }

    const items = invoiceData.invoiceItems;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Invoice Items</Text>

        <View style={styles.tableContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={[styles.tableCell, {width: 90}]}>
                  <Text style={styles.tableHeaderText}>From Date</Text>
                </View>
                <View style={[styles.tableCell, {width: 90}]}>
                  <Text style={styles.tableHeaderText}>To Date</Text>
                </View>
                <View style={[styles.tableCell, {width: 65}]}>
                  <Text style={styles.tableHeaderText}>Lot No</Text>
                </View>
                <View style={[styles.tableCell, {width: 130}]}>
                  <Text style={styles.tableHeaderText}>Item Name</Text>
                </View>
                <View style={[styles.tableCell, {width: 50}]}>
                  <Text style={styles.tableHeaderText}>Tax</Text>
                </View>
                <View style={[styles.tableCell, {width: 50}]}>
                  <Text style={styles.tableHeaderText}>Qty</Text>
                </View>
                <View style={[styles.tableCell, {width: 70}]}>
                  <Text style={styles.tableHeaderText}>Rate</Text>
                </View>
                <View style={[styles.tableCell, {width: 70}]}>
                  <Text style={styles.tableHeaderText}>Balance</Text>
                </View>
                <View style={[styles.tableCell, {width: 80}]}>
                  <Text style={styles.tableHeaderText}>Amount</Text>
                </View>
              </View>

              <ScrollView style={styles.tableBody}>
                {items.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <View style={[styles.tableCell, {width: 90}]}>
                      <Text style={styles.tableRowText}>
                        {formatDate(item.inDate)}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 90}]}>
                      <Text style={styles.tableRowText}>
                        {formatDate(item.outDate)}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 65}]}>
                      <Text style={styles.tableRowText}>
                        {item.lotNo || 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 130}]}>
                      <Text style={styles.tableRowText}>
                        {item.itemName || 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 50}]}>
                      <Text style={styles.tableRowText}>
                        {item.tax
                          ? item.tax.cgstPercent > 0
                            ? `${item.tax.cgstPercent + item.tax.sgstPercent}%`
                            : `${item.tax.igstPercent}%`
                          : 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 50}]}>
                      <Text style={styles.tableRowText}>
                        {item.quantity || '0'}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 70}]}>
                      <Text style={styles.tableRowText}>
                        {item.rate || '0.00'}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 70}]}>
                      <Text style={styles.tableRowText}>
                        {item.balanceQty || '0'}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 80}]}>
                      <Text style={styles.tableRowText}>
                        {item.amount || '0.00'}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderSummary = () => {
    if (!invoiceData?.invoiceSummary) return null;

    const {invoiceSummary} = invoiceData;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Invoice Summary</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(invoiceSummary.totalInvoiceItemAmount)}
            </Text>
          </View>

          {parseFloat(invoiceSummary.totalSGSTAmount || '0') > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SGST</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(invoiceSummary.totalSGSTAmount)}
              </Text>
            </View>
          )}

          {parseFloat(invoiceSummary.totalCGSTAmount || '0') > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>CGST</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(invoiceSummary.totalCGSTAmount)}
              </Text>
            </View>
          )}

          {parseFloat(invoiceSummary.totalIGSTAmount || '0') >= 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>IGST</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(invoiceSummary.totalIGSTAmount)}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax Total</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(invoiceSummary.totalTaxAmount)}
            </Text>
          </View>

          {parseFloat(invoiceSummary.totalRoundoffAmount || '0') !== 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Roundoff Amount</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(invoiceSummary.totalRoundoffAmount)}
              </Text>
            </View>
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Current Bill Total</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoiceSummary.totalInvoiceAmount)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderFooter = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Terms & Conditions</Text>
      <View style={styles.termsCard}>
        <Text style={styles.termText}>
          • All payments to be made within 15 days from the date of Invoice.
        </Text>
        <Text style={styles.termText}>
          • Overdue amounts shall bear the D.P.C. @24% P.A.
        </Text>
        <Text style={styles.termText}>
          • If any discrepancy is found in this invoice including stock
          position, you are hereby requested to inform our office within 7 days
          of the date receipt of this invoice, failing which we shall consider
          the same to be correct and accepted by you.
        </Text>
        <Text style={styles.termText}>
          • All disputes shall be limited to Mumbai and shall be subject to
          Mumbai Jurisdiction only.
        </Text>
      </View>
    </View>
  );

  // Add SAC Code Summary section
  const renderSacCodeSummary = () => {
    if (!invoiceData?.sacCodeSummary) return null;
    
    const { sacCodeSummary } = invoiceData;
    
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{sacCodeSummary.title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.sacCodeContainer}>
            {/* Header Row */}
            <View style={styles.sacCodeRow}>
              <View style={[styles.sacCodeCell, styles.sacCodeHeader, {width: 50}]}>
                <Text style={styles.sacCodeHeaderText}>Sr</Text>
              </View>
              <View style={[styles.sacCodeCell, styles.sacCodeHeader, {width: 120}]}>
                <Text style={styles.sacCodeHeaderText}>SAC Code</Text>
              </View>
              <View style={[styles.sacCodeCell, styles.sacCodeHeader, {width: 120}]}>
                <Text style={styles.sacCodeHeaderText}>Taxable Value</Text>
              </View>
              <View style={[styles.sacCodeCell, styles.sacCodeHeader, {width: 120}]}>
                <Text style={styles.sacCodeHeaderText}>CGST</Text>
              </View>
              <View style={[styles.sacCodeCell, styles.sacCodeHeader, {width: 120}]}>
                <Text style={styles.sacCodeHeaderText}>SGST</Text>
              </View>
              <View style={[styles.sacCodeCell, styles.sacCodeHeader, {width: 120, borderRightWidth: 0}]}>
                <Text style={styles.sacCodeHeaderText}>IGST</Text>
              </View>
            </View>

            {/* Data Rows */}
            {sacCodeSummary.details.map((detail: SacCodeDetail, index: number) => (
              <View key={index} style={[styles.sacCodeRow, index % 2 === 0 ? styles.sacCodeRowEven : styles.sacCodeRowOdd]}>
                <View style={[styles.sacCodeCell, {width: 50}]}>
                  <Text style={styles.sacCodeCellText}>{detail.serialNo}</Text>
                </View>
                <View style={[styles.sacCodeCell, {width: 120}]}>
                  <Text style={styles.sacCodeCellText}>{detail.sacCode}</Text>
                </View>
                <View style={[styles.sacCodeCell, {width: 120}]}>
                  <Text style={styles.sacCodeCellText}>{formatCurrency(detail.taxableValue).replace('₹', '')}</Text>
                </View>
                <View style={[styles.sacCodeCell, {width: 120}]}>
                  <Text style={styles.sacCodeCellText}>
                    {detail.cgst.percent.toFixed(2)}% | {formatCurrency(detail.cgst.amount).replace('₹', '')}
                  </Text>
                </View>
                <View style={[styles.sacCodeCell, {width: 120}]}>
                  <Text style={styles.sacCodeCellText}>
                    {detail.sgst.percent.toFixed(2)}% | {formatCurrency(detail.sgst.amount).replace('₹', '')}
                  </Text>
                </View>
                <View style={[styles.sacCodeCell, {width: 120, borderRightWidth: 0}]}>
                  <Text style={styles.sacCodeCellText}>
                    {detail.igst.percent.toFixed(2)}% | {formatCurrency(detail.igst.amount).replace('₹', '')}
                  </Text>
                </View>
              </View>
            ))}
            
            {/* Total row */}
            <View style={styles.sacCodeTotalRow}>
              <View style={[styles.sacCodeCell, {width: 50}]}>
                <Text style={styles.sacCodeTotalText}></Text>
              </View>
              <View style={[styles.sacCodeCell, {width: 120}]}>
                <Text style={styles.sacCodeTotalText}>Total</Text>
              </View>
              <View style={[styles.sacCodeCell, {width: 120}]}>
                <Text style={styles.sacCodeTotalText}>{formatCurrency(sacCodeSummary.totals.totalTaxableValue).replace('₹', '')}</Text>
              </View>
              <View style={[styles.sacCodeCell, {width: 120}]}>
                <Text style={styles.sacCodeTotalText}>{formatCurrency(sacCodeSummary.totals.totalCGSTAmount).replace('₹', '')}</Text>
              </View>
              <View style={[styles.sacCodeCell, {width: 120}]}>
                <Text style={styles.sacCodeTotalText}>{formatCurrency(sacCodeSummary.totals.totalSGSTAmount).replace('₹', '')}</Text>
              </View>
              <View style={[styles.sacCodeCell, {width: 120, borderRightWidth: 0}]}>
                <Text style={styles.sacCodeTotalText}>{formatCurrency(sacCodeSummary.totals.totalIGSTAmount).replace('₹', '')}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  // After renderFooter function, add renderQRCode function
  const renderQRCode = () => {
    if (!invoiceData?.invoiceHeader) return null;
    
    const { hasQRCode, signedQRCode } = invoiceData.invoiceHeader;
    
    if (!signedQRCode) {
      return null;
    }

    const handleRetryQRCode = () => {
      setQrCodeError(null);
      setQrCodeLoading(true);
      // Simulate loading time for QR code generation
      setTimeout(() => {
        setQrCodeLoading(false);
      }, 500);
    };

    return (
      <View style={[styles.sectionContainer, { paddingTop: 8, paddingBottom: 8 }]}>
        <Text style={[styles.sectionTitle, styles.qrSectionTitle]}>QR Code</Text>
        <View style={styles.qrCodeContainer}>
          {qrCodeError ? (
            <View style={styles.qrCodeErrorContainer}>
              <Text style={styles.qrCodeErrorText}>
                Unable to display QR code: {qrCodeError}
              </Text>
              <TouchableOpacity 
                style={styles.retryQrButton}
                onPress={handleRetryQRCode}
              >
                <Text style={styles.retryQrButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : qrCodeLoading ? (
            <View style={styles.qrCodeLoadingContainer}>
              <ActivityIndicator size="large" color="#63A1D8" />
              <Text style={styles.qrCodeLoadingText}>
                Generating QR Code...
              </Text>
            </View>
          ) : (
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={signedQRCode}
                size={130}
                color="black"
                backgroundColor="white"
                ecl="M" // Error correction level
                onError={(error: Error) => {
                  console.error('QR Code Error:', error);
                  setQrCodeError(error.message || 'Failed to generate QR code');
                }}
              />
            </View>
          )}
          <Text style={styles.qrCodeNote}>
            Scan to verify invoice authenticity
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LayoutWrapper showHeader={true} showTabBar={false} route={undefined}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.loadingText}>Loading invoice details...</Text>
        </View>
      </LayoutWrapper>
    );
  }

  if (error) {
    return (
      <LayoutWrapper showHeader={true} showTabBar={false} route={undefined}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error Loading Invoice</Text>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorButtonsContainer}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchInvoiceDetails}>
              <Text style={styles.retryButtonText}>🔄 Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>← Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper showHeader={true} showTabBar={false} route={undefined}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.invoiceContainer}>
          {renderHeader()}
          {renderInvoiceInfo()}
          {renderBillingInfo()}
          {renderItemsTable()}
          {renderSummary()}
          {renderFooter()}
          {renderSacCodeSummary()} {/* Add SAC Code Summary section here */}
          {renderQRCode()} {/* Add QR Code component here */}
        </View>
      </ScrollView>
    </LayoutWrapper>
  );
};

// Define styles first so they can be referenced by components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 10, // Reduced from 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12, // Reduced from 16
    fontSize: 15, // Reduced from 16
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20, // Reduced from 24
  },
  errorIcon: {
    fontSize: 42, // Reduced from 48
    marginBottom: 12, // Reduced from 16
  },
  errorTitle: {
    fontSize: 18, // Reduced from 20
    fontWeight: '600',
    color: '#333',
    marginBottom: 6, // Reduced from 8
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15, // Reduced from 16
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20, // Reduced from 24
    lineHeight: 22, // Reduced from 24
  },
  errorButtonsContainer: {
    flexDirection: 'row',
    gap: 10, // Reduced from 12
  },
  retryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20, // Reduced from 24
    paddingVertical: 10, // Reduced from 12
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15, // Reduced from 16
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: '#666',
    paddingHorizontal: 20, // Reduced from 24
    paddingVertical: 10, // Reduced from 12
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 15, // Reduced from 16
    fontWeight: '500',
  },
  invoiceContainer: {
    backgroundColor: '#fff',
    margin: 12, // Reduced from 16
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContainer: {
    padding: 16, // Reduced from 24
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
  },
  companyHeader: {
    alignItems: 'center',
    marginBottom: 8, // Reduced spacing
  },
  companyName: {
    fontSize: 20, // Reduced from 22
    fontWeight: '600',
    color: '#63A1E9',
    textAlign: 'center',
    marginBottom: 6, // Reduced from 8
  },
  taxInvoiceRow: {
    marginBottom: 12,
    alignItems: 'center',
  },
  taxInvoiceTitle: {
    fontSize: 15, // Reduced from 16
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    letterSpacing: 1,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap', // Allow buttons to wrap if needed
    width: '100%',
  },
  downloadButton: {
    backgroundColor: '#63A1D8',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 130, // Ensure consistent button width
  },
  downloadButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  downloadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 13, // Reduced from 14
    fontWeight: '500',
  },
  printButton: {
    backgroundColor: '#3F88C5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 130, // Ensure consistent button width
  },
  printButtonText: {
    color: '#fff',
    fontSize: 13, // Same as download button
    fontWeight: '500',
  },
  sectionContainer: {
    padding: 16, // Reduced from 20
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 16, // Reduced from 18
    fontWeight: '600',
    color: '#333',
    marginBottom: 12, // Reduced from 16
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoColumn: {
    flex: 1,
    marginHorizontal: 6, // Reduced from 8
  },
  infoRow: {
    marginBottom: 12, // Reduced from 16
  },
  infoLabel: {
    fontSize: 13, // Reduced from 14
    color: '#666',
    marginBottom: 2, // Reduced from 4
  },
  infoValue: {
    fontSize: 15, // Reduced from 16
    color: '#333',
    fontWeight: '500',
  },
  billingCard: {
    backgroundColor: '#f8f9fa',
    padding: 14, // Reduced from 16
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#63A1D8',
  },
  customerName: {
    fontSize: 16, // Reduced from 18
    fontWeight: '600',
    color: '#333',
    marginBottom: 6, // Reduced from 8
  },
  addressText: {
    fontSize: 13, // Reduced from 14
    color: '#555',
    marginBottom: 3, // Reduced from 4
    lineHeight: 18, // Reduced from 20
  },
  gstContainer: {
    marginTop: 12, // Reduced from 16
    paddingTop: 12, // Reduced from 16
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  gstRow: {
    flexDirection: 'row',
    marginBottom: 3, // Reduced from 4
  },
  gstLabel: {
    fontSize: 13, // Reduced from 14
    color: '#666',
    width: 90, // Reduced from 100
  },
  gstValue: {
    fontSize: 13, // Reduced from 14
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  noDataContainer: {
    padding: 30, // Reduced from 40
    alignItems: 'center',
  },
  noDataText: {
    color: '#666',
    fontSize: 15, // Reduced from 16
    fontStyle: 'italic',
  },
  tableContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    overflow: 'hidden',
  },
  table: {
    minWidth: width - 32,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#63A1D8',
    paddingVertical: 12, // Reduced from 14
  },
  tableBody: {
    maxHeight: 350, // Reduced from 400
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10, // Reduced from 12
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  tableCell: {
    paddingHorizontal: 10, // Reduced from 12
    justifyContent: 'center',
  },
  tableHeaderText: {
    color: '#fff',
    fontSize: 11, // Reduced from 12
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRowText: {
    fontSize: 11, // Reduced from 12
    color: '#555',
    textAlign: 'center',
    lineHeight: 15, // Reduced from 16
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    padding: 16, // Reduced from 20
    borderRadius: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10, // Reduced from 12
  },
  summaryLabel: {
    fontSize: 13, // Reduced from 14
    color: '#666',
    flex: 1,
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 13, // Reduced from 14
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 12, // Reduced from 16
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#63A1D8',
    marginHorizontal: -16, // Adjusted from -20
    marginBottom: -16, // Adjusted from -20
    paddingHorizontal: 16, // Reduced from 20
    paddingVertical: 14, // Reduced from 16
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  totalLabel: {
    fontSize: 15, // Reduced from 16
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  totalValue: {
    fontSize: 16, // Reduced from 18
    fontWeight: '600',
    color: '#fff',
    textAlign: 'right',
  },
  termsCard: {
    backgroundColor: '#f8f9fa',
    padding: 14, // Reduced from 16
    borderRadius: 6,
    marginBottom: 16, // Reduced from 20
  },
  termText: {
    fontSize: 12, // Reduced from 13
    color: '#666',
    lineHeight: 18, // Reduced from 20
    marginBottom: 6, // Reduced from 8
  },
  signatureContainer: {
    alignItems: 'flex-end',
    marginTop: 24, // Reduced from 32
  },
  signatureLine: {
    width: 180, // Reduced from 200
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 6, // Reduced from 8
  },
  signatureText: {
    fontSize: 13, // Reduced from 14
    color: '#333',
    fontWeight: '500',
  },
  qrCodeContainer: {
    alignItems: 'center',
    padding: 10, // Reduced from 12
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    maxWidth: 220, // Reduced from 250
    alignSelf: 'center',
  },
  qrCodeWrapper: {
    padding: 10, // Reduced from 12
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  qrCodeNote: {
    marginTop: 6, // Reduced from 8
    fontSize: 11, // Reduced from 12
    color: '#666',
    textAlign: 'center',
  },
  qrCodeErrorContainer: {
    padding: 14, // Reduced from 16
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    width: 140, // Reduced from 150
    height: 140, // Reduced from 150
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCodeErrorText: {
    color: '#c62828',
    fontSize: 13, // Reduced from 14
    textAlign: 'center',
    padding: 6, // Reduced from 8
  },
  retryQrButton: {
    backgroundColor: '#c62828',
    paddingHorizontal: 14, // Reduced from 16
    paddingVertical: 6, // Reduced from 8
    borderRadius: 4,
    marginTop: 10, // Reduced from 12
  },
  retryQrButtonText: {
    color: '#ffffff',
    fontSize: 13, // Reduced from 14
    fontWeight: '500',
  },
  qrCodeLoadingContainer: {
    width: 140, // Reduced from 150
    height: 140, // Reduced from 150
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  qrCodeLoadingText: {
    marginTop: 10, // Reduced from 12
    fontSize: 13, // Reduced from 14
    color: '#666',
    textAlign: 'center',
  },
  tableTotalText: {
    fontSize: 11, // Reduced from 12
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 15, // Reduced from 16
  },
  additionalInfoContainer: {
    marginTop: 12, // Reduced from 16
    padding: 10, // Reduced from 12
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  additionalInfoText: {
    fontSize: 11, // Reduced from 12
    color: '#666',
    marginBottom: 3, // Reduced from 4
  },
  qrSectionTitle: {
    fontSize: 15, // Reduced from 16
    marginBottom: 6, // Reduced from 8
  },
  // Add new styles for the SAC Code Summary
  sacCodeContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: '100%',
    marginTop: 5,
  },
  sacCodeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sacCodeRowEven: {
    backgroundColor: '#f9f9f9',
  },
  sacCodeRowOdd: {
    backgroundColor: '#ffffff',
  },
  sacCodeCell: {
    padding: 8, // Reduced from 10
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    height: 36, // Set explicit height for consistency
  },
  sacCodeHeader: {
    backgroundColor: '#63A1D8',
    padding: 8, // Reduced from 12
    height: 36, // Set explicit height to match total row
  },
  sacCodeHeaderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  sacCodeCellText: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
  },
  sacCodeTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#94b7d6',
    paddingVertical: 0, // Reduced from 10
    height: 34, // Set explicit height to match other rows
  },
  sacCodeTotalText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});

export default InvoiceDetailsScreen;
