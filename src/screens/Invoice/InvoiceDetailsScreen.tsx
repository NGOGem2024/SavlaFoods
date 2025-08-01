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
import QRCode from 'react-native-qrcode-svg';
import {
  API_ENDPOINTS,
  getAuthHeaders,
  API_BASE_URL,
} from '../../config/api.config';
import {LayoutWrapper} from '../../components/AppLayout';

// Define navigation param list
type RootStackParamList = {
  InvoiceDetailsScreen: {invoiceNo: string};
  InvoiceReportScreen: any;
};

// Define types for invoice data
interface InvoiceHeader {
  invoiceNo: string;
  invoiceDate: string;
  period: string;
  signedQRCode?: string;
  irnNo?: string;
  ackNumber?: string;
  ackDate?: string;
}

interface BillingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  gstin: string;
  stateCode: string;
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

interface SACSummaryItem {
  serialNo: number;
  sacCode: string;
  sacCodeDescription: string;
  taxableValue: string;
  cgst: {percent: number; amount: string};
  sgst: {percent: number; amount: string};
  igst: {percent: number; amount: string};
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

interface InvoiceData {
  invoiceHeader: InvoiceHeader;
  billingAddress: BillingAddress;
  customerDetails: CustomerDetails;
  invoiceItems: InvoiceItem[];
  invoiceSummary: InvoiceSummary;
  sacCodeSummary: {
    title: string;
    details: SACSummaryItem[];
    totals: {
      totalTaxableValue: string;
      totalCGSTAmount: string;
      totalSGSTAmount: string;
      totalIGSTAmount: string;
    };
    additionalInfo: {
      whetherTaxPayableUnderReverseCharges: string;
      errorAndOmissionsExcepted: boolean;
    };
  };
}

interface ApiResponse {
  success: boolean;
  invoiceData?: InvoiceData;
  message?: string;
}

const {width} = Dimensions.get('window');

const InvoiceDetailsScreen: React.FC = () => {
  const route =
    useRoute<RouteProp<RootStackParamList, 'InvoiceDetailsScreen'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {invoiceNo} = route.params || {};

  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState<boolean>(false);

  useEffect(() => {
    if (invoiceNo) {
      fetchInvoiceDetails();
    } else {
      setError('Invoice number not provided');
      setLoading(false);
    }
  }, [invoiceNo]);

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

  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to storage to download PDF files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error: unknown) {
        console.warn('Storage Permission Error:', error);
        return false;
      }
    }
    return true;
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

      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Storage permission is required to download PDF files.',
        );
        return;
      }

      const headers = await getAuthHeaders();
      const pdfEndpoint = `${API_ENDPOINTS.GET_PDF_REPORT}/${invoiceNo}`;

      console.log('Downloading PDF from:', pdfEndpoint);

      Alert.alert(
        'Download Started',
        'Your invoice PDF is being downloaded. Please wait...',
      );

      const response = await axios.get(pdfEndpoint, {
        headers,
        responseType: 'blob',
        timeout: 60000,
      });

      const fileName = `Invoice_${invoiceNo}.pdf`;
      const downloadPath = Platform.select({
        ios: `${RNFS.DocumentDirectoryPath}/${fileName}`,
        android: `${RNFS.DownloadDirectoryPath}/${fileName}`,
      });

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const base64 = reader.result.split(',')[1] || '';
            resolve(base64);
          } else {
            reject(new Error('FileReader result is not a string'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(response.data);
      });

      await RNFS.writeFile(downloadPath, base64Data, 'base64');

      console.log('PDF downloaded successfully to:', downloadPath);

      Alert.alert(
        'Download Complete',
        `Invoice PDF has been downloaded successfully!`,
        [
          {
            text: 'Open PDF',
            onPress: () => openPDF(downloadPath),
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

  const openPDF = async (filePath: string) => {
    try {
      await FileViewer.open(filePath);
    } catch (error: unknown) {
      console.error('Error opening PDF:', error);
      Alert.alert(
        'Cannot Open PDF',
        'Unable to open the PDF file. Please check if you have a PDF viewer installed.',
        [
          {
            text: 'Open Downloads Folder',
            onPress: () => {
              if (Platform.OS === 'android') {
                Linking.openURL(
                  'content://com.android.externalstorage.documents/document/primary%3ADownload',
                );
              }
            },
          },
          {
            text: 'OK',
            style: 'default',
          },
        ],
      );
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
                <View style={[styles.tableCell, {width: 100}]}>
                  <Text style={styles.tableHeaderText}>From Date</Text>
                </View>
                <View style={[styles.tableCell, {width: 100}]}>
                  <Text style={styles.tableHeaderText}>To Date</Text>
                </View>
                <View style={[styles.tableCell, {width: 70}]}>
                  <Text style={styles.tableHeaderText}>Lot No</Text>
                </View>
                <View style={[styles.tableCell, {width: 140}]}>
                  <Text style={styles.tableHeaderText}>Item Name</Text>
                </View>
                <View style={[styles.tableCell, {width: 60}]}>
                  <Text style={styles.tableHeaderText}>Tax</Text>
                </View>
                <View style={[styles.tableCell, {width: 60}]}>
                  <Text style={styles.tableHeaderText}>Qty</Text>
                </View>
                <View style={[styles.tableCell, {width: 80}]}>
                  <Text style={styles.tableHeaderText}>Rate</Text>
                </View>
                <View style={[styles.tableCell, {width: 80}]}>
                  <Text style={styles.tableHeaderText}>Balance</Text>
                </View>
                <View style={[styles.tableCell, {width: 90}]}>
                  <Text style={styles.tableHeaderText}>Amount</Text>
                </View>
              </View>

              <ScrollView style={styles.tableBody}>
                {items.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <View style={[styles.tableCell, {width: 100}]}>
                      <Text style={styles.tableRowText}>
                        {formatDate(item.inDate)}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 100}]}>
                      <Text style={styles.tableRowText}>
                        {formatDate(item.outDate)}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 70}]}>
                      <Text style={styles.tableRowText}>
                        {item.lotNo || 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 140}]}>
                      <Text style={styles.tableRowText}>
                        {item.itemName || 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 60}]}>
                      <Text style={styles.tableRowText}>
                        {item.tax
                          ? item.tax.cgstPercent > 0
                            ? `${item.tax.cgstPercent + item.tax.sgstPercent}%`
                            : `${item.tax.igstPercent}%`
                          : 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 60}]}>
                      <Text style={styles.tableRowText}>
                        {item.quantity || '0'}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 80}]}>
                      <Text style={styles.tableRowText}>
                        {item.rate || '0.00'}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 80}]}>
                      <Text style={styles.tableRowText}>
                        {item.balanceQty || '0'}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, {width: 90}]}>
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

  const renderSACSummaryTable = () => {
    if (!invoiceData?.sacCodeSummary) return null;

    const {sacCodeSummary} = invoiceData;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{sacCodeSummary.title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.sacCodeContainer}>
            {/* Header Row */}
            <View style={styles.sacCodeRow}>
              <View
                style={[styles.sacCodeCell, styles.sacCodeHeader, {width: 50}]}>
                <Text style={styles.sacCodeHeaderText}>Sr</Text>
              </View>
              <View
                style={[
                  styles.sacCodeCell,
                  styles.sacCodeHeader,
                  {width: 120},
                ]}>
                <Text style={styles.sacCodeHeaderText}>SAC Code</Text>
              </View>
              <View
                style={[
                  styles.sacCodeCell,
                  styles.sacCodeHeader,
                  {width: 120},
                ]}>
                <Text style={styles.sacCodeHeaderText}>Taxable Value</Text>
              </View>
              <View
                style={[
                  styles.sacCodeCell,
                  styles.sacCodeHeader,
                  {width: 120},
                ]}>
                <Text style={styles.sacCodeHeaderText}>CGST</Text>
              </View>
              <View
                style={[
                  styles.sacCodeCell,
                  styles.sacCodeHeader,
                  {width: 120},
                ]}>
                <Text style={styles.sacCodeHeaderText}>SGST</Text>
              </View>
              <View
                style={[
                  styles.sacCodeCell,
                  styles.sacCodeHeader,
                  {width: 120, borderRightWidth: 0},
                ]}>
                <Text style={styles.sacCodeHeaderText}>IGST</Text>
              </View>
            </View>

            {/* Data Rows */}
            {sacCodeSummary.details.map(
              (detail: SACSummaryItem, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.sacCodeRow,
                    index % 2 === 0
                      ? styles.sacCodeRowEven
                      : styles.sacCodeRowOdd,
                  ]}>
                  <View style={[styles.sacCodeCell, {width: 50}]}>
                    <Text style={styles.sacCodeCellText}>
                      {detail.serialNo}
                    </Text>
                  </View>
                  <View style={[styles.sacCodeCell, {width: 120}]}>
                    <Text style={styles.sacCodeCellText}>{detail.sacCode}</Text>
                  </View>
                  <View style={[styles.sacCodeCell, {width: 120}]}>
                    <Text style={styles.sacCodeCellText}>
                      {formatCurrency(detail.taxableValue).replace('₹', '')}
                    </Text>
                  </View>
                  <View style={[styles.sacCodeCell, {width: 120}]}>
                    <Text style={styles.sacCodeCellText}>
                      {detail.cgst.percent.toFixed(2)}% |{' '}
                      {formatCurrency(detail.cgst.amount).replace('₹', '')}
                    </Text>
                  </View>
                  <View style={[styles.sacCodeCell, {width: 120}]}>
                    <Text style={styles.sacCodeCellText}>
                      {detail.sgst.percent.toFixed(2)}% |{' '}
                      {formatCurrency(detail.sgst.amount).replace('₹', '')}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.sacCodeCell,
                      {width: 120, borderRightWidth: 0},
                    ]}>
                    <Text style={styles.sacCodeCellText}>
                      {detail.igst.percent.toFixed(2)}% |{' '}
                      {formatCurrency(detail.igst.amount).replace('₹', '')}
                    </Text>
                  </View>
                </View>
              ),
            )}

            {/* Total row */}
            <View style={styles.sacCodeTotalRow}>
              <View style={[styles.sacCodeCell, {width: 50}]}>
                <Text style={styles.sacCodeTotalText}></Text>
              </View>
              <View style={[styles.sacCodeCell, {width: 120}]}>
                <Text style={styles.sacCodeTotalText}>Total</Text>
              </View>
              <View style={[styles.sacCodeCell, {width: 120}]}>
                <Text style={styles.sacCodeTotalText}>
                  {formatCurrency(
                    sacCodeSummary.totals.totalTaxableValue,
                  ).replace('₹', '')}
                </Text>
              </View>
              <View style={[styles.sacCodeCell, {width: 120}]}>
                <Text style={styles.sacCodeTotalText}>
                  {formatCurrency(
                    sacCodeSummary.totals.totalCGSTAmount,
                  ).replace('₹', '')}
                </Text>
              </View>
              <View style={[styles.sacCodeCell, {width: 120}]}>
                <Text style={styles.sacCodeTotalText}>
                  {formatCurrency(
                    sacCodeSummary.totals.totalSGSTAmount,
                  ).replace('₹', '')}
                </Text>
              </View>
              <View
                style={[styles.sacCodeCell, {width: 120, borderRightWidth: 0}]}>
                <Text style={styles.sacCodeTotalText}>
                  {formatCurrency(
                    sacCodeSummary.totals.totalIGSTAmount,
                  ).replace('₹', '')}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
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

      {/* QR Code and IRN Details Section */}
      <View style={styles.qrIrnContainer}>
        <Text style={styles.sectionTitle}>E-Invoice Details</Text>
        <View style={styles.qrIrnWrapper}>
          {/* QR Code Section - Left */}
          <View style={styles.qrCodeSection}>
            <Text style={styles.qrCodeTitle}>QR Code</Text>
            {invoiceData?.invoiceHeader?.signedQRCode ? (
              <View style={styles.qrCodeWrapper}>
                <QRCode
                  value={invoiceData.invoiceHeader.signedQRCode}
                  size={80}
                  backgroundColor="#fff"
                  color="#000"
                />
              </View>
            ) : (
              <Text style={styles.noDataText}>No QR Code available</Text>
            )}
          </View>

          {/* IRN Details Section - Right */}
          <View style={styles.irnDetailsSection}>
            {/* <Text style={styles.irnDetailsTitle}>IRN Details</Text> */}
            <View style={styles.irnDetailsCard}>
              <View style={styles.irnDetailRow}>
                <Text style={styles.irnDetailLabel}>IRN No:</Text>
                <Text style={styles.irnDetailValue}>
                  {invoiceData?.invoiceHeader?.irnNo || 'N/A'}
                </Text>
              </View>
              <View style={styles.irnDetailRow}>
                <Text style={styles.irnDetailLabel}>ACK No:</Text>
                <Text style={styles.irnDetailValue}>
                  {invoiceData?.invoiceHeader?.ackNumber || 'N/A'}
                </Text>
              </View>
              <View style={styles.irnDetailRow}>
                <Text style={styles.irnDetailLabel}>ACK Date:</Text>
                <Text style={styles.irnDetailValue}>
                  {invoiceData?.invoiceHeader?.ackDate
                    ? formatDate(invoiceData.invoiceHeader.ackDate)
                    : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

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
          {renderSACSummaryTable()}
          {renderFooter()}
        </View>
      </ScrollView>
    </LayoutWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: '#666',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  invoiceContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContainer: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
  },
  companyHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  companyName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#63A1E9',
    textAlign: 'center',
    marginBottom: 8,
  },
  taxInvoiceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    letterSpacing: 1,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  downloadButton: {
    backgroundColor: '#63A1D8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
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
    fontSize: 14,
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
    marginHorizontal: 8,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  billingCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#63A1D8',
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    lineHeight: 20,
  },
  gstContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  gstRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  gstLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  gstValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    color: '#666',
    fontSize: 16,
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
    paddingVertical: 10,
  },
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  tableCell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  tableHeaderText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRowText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    lineHeight: 16,
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
    // backgroundColor: '#94b7d6',
    paddingVertical: 0, // Reduced from 10
    height: 34, // Set explicit height to match other rows
  },
  sacCodeTotalText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#63A1D8',
    marginHorizontal: -20,
    marginBottom: -20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'right',
  },
  termsCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 6,
    marginBottom: 20,
  },
  termText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  additionalInfoContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  additionalInfoText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  qrIrnContainer: {
    marginTop: 20,
  },
  qrIrnWrapper: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  qrCodeSection: {
    flex: 0.3,
    alignItems: 'center',
  },
  qrCodeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  qrCodeWrapper: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  irnDetailsSection: {
    flex: 0.75,
    paddingLeft: 15,
  },
  irnDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  irnDetailsCard: {
    // backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 1,
    // },
    // shadowOpacity: 0.2,
    // shadowRadius: 1.41,
  },
  irnDetailRow: {
    marginBottom: 8,
  },
  irnDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  irnDetailValue: {
    fontSize: 11,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flexWrap: 'wrap',
  },
  qrCodeContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});

export default InvoiceDetailsScreen;
