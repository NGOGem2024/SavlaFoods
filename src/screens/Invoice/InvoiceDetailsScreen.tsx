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

interface PlanDetails {
  planId?: string;
  planCode?: string;
  planName?: string;
  planType?: string;
  planSubType?: string;
  planNoOfDays?: number;
  planBillingMechanism?: string;
  minimumBilling?: string;
  planStatus?: string;
  planSacCode?: string;
  planSacCodeDesc?: string;
}

interface ItemDetails {
  itemId: string;
  itemCode: string;
  originalRate: string;
  taxAmount: string;
  totalAmount: string;
  cgstPercent: number;
  cgstAmount: string;
  sgstPercent: number;
  sgstAmount: string;
  igstPercent: number;
  igstAmount: string;
  sacCode: string;
  sacCodeDesc: string;
  isConsolidated: boolean;
  originalItemCount: number;
  consolidatedItemIds: string[];
}

interface InvoiceItem {
  fromDate: string;
  toDate: string;
  lotNo: string;
  itemName: string;
  tax: string;
  qty: number;
  preservationRate: string;
  balance: number;
  preservationAmount: string;
  itemDetails: ItemDetails;
}

interface ItemSection {
  sectionHeader: string;
  planDetails: PlanDetails;
  items: InvoiceItem[];
}

interface InvoiceSummary {
  total: string;
  sgst: string;
  cgst: string;
  igst: string;
  taxable: string;
  taxTotal: string;
  whetherTaxPayable: string;
  roundOffAmount: string;
  currentBillTotal: string;
  amountInWords: string;
}
interface SACSummaryItem {
  sr: number;
  sacCode: string;
  taxableValue: string;
  cgst: string;
  cgstAmount: string;
  sgst: string;
  sgstAmount: string;
  igst: string;
  igstAmount: string;
}

interface BankDetails {
  label: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

interface InvoiceData {
  documentInfo: {
    pageNumber: string;
    documentType: string;
    title: string;
  };
  billedTo: {
    label: string;
    name: string;
    addressLine1: string;
    addressLine2: string;
    cityPincode: string;
    state: string;
    placeOfSupply: string;
    stateWithCode: string;
  };
  invoiceDetails: {
    invoiceNo: string;
    invoiceDate: string;
    period: string;
    gstin: string;
    stateInfo: string;
  };
  itemSections: ItemSection[];
  financialSummary: InvoiceSummary;
  sacCodeSummary: {
    sacCodeLine: string;
    eoeStatement: string;
    tableHeaders: string[];
    details: SACSummaryItem[];
    totals: {
      label: string;
      taxableValue: string;
      cgstAmount: string;
      sgstAmount: string;
      igstAmount: string;
    };
  };
  eInvoiceDetails: {
    irnNo: string;
    acknowledgment: string;
    signedQRCode: string;
    hasQRCode: boolean;
  };
  termsAndConditions: string[];
  bankDetails: BankDetails;
  signature: {
    companyLine: string;
    designation: string;
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

  const formatCurrency = (
    amount: string | number | undefined | null,
  ): string => {
    if (amount === undefined || amount === null) return '₹0.00';
    const numAmount = parseFloat(amount.toString());
    if (isNaN(numAmount)) return '₹0.00';
    return `₹${numAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (
    dateString: string | number | Date | undefined | null,
  ): string => {
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
      return 'N/A';
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.companyHeader}>
        <Text style={styles.companyName}>
          Savla Foods & Cold Storage Pvt. Ltd.
        </Text>
        <Text style={styles.taxInvoiceTitle}>
          {invoiceData?.documentInfo.title || 'TAX INVOICE'}
        </Text>
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
    if (!invoiceData?.invoiceDetails) return null;

    const {invoiceDetails} = invoiceData;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Invoice Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invoice No</Text>
              <Text style={styles.infoValue}>
                {invoiceDetails.invoiceNo.replace('Invoice No : ', '') || 'N/A'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invoice Date</Text>
              <Text style={styles.infoValue}>
                {formatDate(
                  invoiceDetails.invoiceDate.replace('Invoice Date : ', ''),
                )}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Period</Text>
              <Text style={styles.infoValue}>
                {invoiceDetails.period.replace('Period : ', '') || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Place of Supply</Text>
              <Text style={styles.infoValue}>
                {invoiceData.billedTo.placeOfSupply.replace(
                  'Place of Supply : ',
                  '',
                ) || 'N/A'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>State Code</Text>
              <Text style={styles.infoValue}>
                {invoiceData.billedTo.stateWithCode.split('Code: ')[1] || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderBillingInfo = () => {
    if (!invoiceData?.billedTo) return null;

    const {billedTo} = invoiceData;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Billing Information</Text>
        <View style={styles.billingCard}>
          <Text style={styles.customerName}>{billedTo.name || 'N/A'}</Text>
          <Text style={styles.addressText}>{billedTo.addressLine1 || ''}</Text>
          {billedTo.addressLine2 && (
            <Text style={styles.addressText}>{billedTo.addressLine2}</Text>
          )}
          <Text style={styles.addressText}>{billedTo.cityPincode || ''}</Text>
          <Text style={styles.addressText}>{billedTo.state || ''}</Text>

          <View style={styles.gstContainer}>
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>GSTIN</Text>
              <Text style={styles.gstValue}>
                {invoiceData.invoiceDetails.gstin.replace('GSTIN : ', '') ||
                  'N/A'}
              </Text>
            </View>
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>State Code</Text>
              <Text style={styles.gstValue}>
                {billedTo.stateWithCode.split('Code: ')[1] || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderItemsTable = () => {
    if (
      !invoiceData?.itemSections ||
      !Array.isArray(invoiceData.itemSections)
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

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Invoice Items</Text>
        {invoiceData.itemSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.sectionPlanContainer}>
            <Text style={styles.sectionPlanTitle}>{section.sectionHeader}</Text>
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
                    {section.items.map((item, index) => (
                      <View key={index} style={styles.tableRow}>
                        <View style={[styles.tableCell, {width: 100}]}>
                          <Text style={styles.tableRowText}>
                            {formatDate(item.fromDate)}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, {width: 100}]}>
                          <Text style={styles.tableRowText}>
                            {formatDate(item.toDate)}
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
                            {item.tax || 'N/A'}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, {width: 60}]}>
                          <Text style={styles.tableRowText}>
                            {item.qty || '0'}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, {width: 80}]}>
                          <Text style={styles.tableRowText}>
                            {formatCurrency(item.preservationRate)}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, {width: 80}]}>
                          <Text style={styles.tableRowText}>
                            {item.balance || '0'}
                          </Text>
                        </View>
                        <View style={[styles.tableCell, {width: 90}]}>
                          <Text style={styles.tableRowText}>
                            {formatCurrency(item.preservationAmount)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </ScrollView>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderSummary = () => {
    if (!invoiceData?.financialSummary) return null;

    const {financialSummary} = invoiceData;

    // Extract numerical values from the string fields
    const taxableValue = financialSummary.taxable.replace('Taxable ', '');
    const cgstAmount = financialSummary.cgst.replace('CGST ', '');
    const sgstAmount = financialSummary.sgst.replace('SGST ', '');
    const igstAmount = financialSummary.igst.replace('IGST ', '');
    const taxTotal = financialSummary.taxTotal.replace('Tax Total ', '');
    const roundOffAmount = financialSummary.roundOffAmount.replace(
      'RoundOff Amount ',
      '',
    );
    const currentBillTotal = financialSummary.currentBillTotal.replace(
      'Current Bill Total ',
      '',
    );

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Invoice Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxable Amount</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(taxableValue)}
            </Text>
          </View>

          {parseFloat(cgstAmount || '0') > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>CGST</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(cgstAmount)}
              </Text>
            </View>
          )}

          {parseFloat(sgstAmount || '0') > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SGST</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(sgstAmount)}
              </Text>
            </View>
          )}

          {parseFloat(igstAmount || '0') >= 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>IGST</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(igstAmount)}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Tax</Text>
            <Text style={styles.summaryValue}>{formatCurrency(taxTotal)}</Text>
          </View>

          {parseFloat(roundOffAmount || '0') !== 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Round Off Amount</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(roundOffAmount)}
              </Text>
            </View>
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Current Bill Total</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(currentBillTotal)}
            </Text>
          </View>

          <View style={styles.amountInWordsContainer}>
            <Text style={styles.amountInWordsLabel}>Amount in Words</Text>
            <Text style={styles.amountInWordsValue}>
              {financialSummary.amountInWords.replace('Amt In Words : ', '')}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Tax Payable on Reverse Charge
            </Text>
            <Text style={styles.summaryValue}>
              {financialSummary.whetherTaxPayable.split(':')[1].trim()}
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
        <Text style={styles.sectionTitle}>{sacCodeSummary.sacCodeLine}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.sacCodeContainer}>
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

            {sacCodeSummary.details.map((detail, index) => (
              <View
                key={index}
                style={[
                  styles.sacCodeRow,
                  index % 2 === 0
                    ? styles.sacCodeRowEven
                    : styles.sacCodeRowOdd,
                ]}>
                <View style={[styles.sacCodeCell, {width: 50}]}>
                  <Text style={styles.sacCodeCellText}>{detail.sr}</Text>
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
                    {detail.cgst} |{' '}
                    {formatCurrency(detail.cgstAmount).replace('₹', '')}
                  </Text>
                </View>
                <View style={[styles.sacCodeCell, {width: 120}]}>
                  <Text style={styles.sacCodeCellText}>
                    {detail.sgst} |{' '}
                    {formatCurrency(detail.sgstAmount).replace('₹', '')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.sacCodeCell,
                    {width: 120, borderRightWidth: 0},
                  ]}>
                  <Text style={styles.sacCodeCellText}>
                    {detail.igst} |{' '}
                    {formatCurrency(detail.igstAmount).replace('₹', '')}
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.sacCodeTotalRow}>
              <View style={[styles.sacCodeCell, {width: 50}]}>
                <Text style={styles.sacCodeTotalText}></Text>
              </View>
              <View style={[styles.sacCodeCell, {width: 120}]}>
                <Text style={styles.sacCodeTotalText}>Total</Text>
              </View>
              <View style={[styles.sacCodeCell, {width: 120}]}>
                <Text style={styles.sacCodeTotalText}>
                  {formatCurrency(sacCodeSummary.totals.taxableValue).replace(
                    '₹',
                    '',
                  )}
                </Text>
              </View>
              <View style={[styles.sacCodeCell, {width: 120}]}>
                <Text style={styles.sacCodeTotalText}>
                  {formatCurrency(sacCodeSummary.totals.cgstAmount).replace(
                    '₹',
                    '',
                  )}
                </Text>
              </View>
              <View style={[styles.sacCodeCell, {width: 120}]}>
                <Text style={styles.sacCodeTotalText}>
                  {formatCurrency(sacCodeSummary.totals.sgstAmount).replace(
                    '₹',
                    '',
                  )}
                </Text>
              </View>
              <View
                style={[styles.sacCodeCell, {width: 120, borderRightWidth: 0}]}>
                <Text style={styles.sacCodeTotalText}>
                  {formatCurrency(sacCodeSummary.totals.igstAmount).replace(
                    '₹',
                    '',
                  )}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderFooter = () => {
    if (!invoiceData?.termsAndConditions || !invoiceData?.bankDetails)
      return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Terms & Conditions</Text>
        <View style={styles.termsCard}>
          {invoiceData.termsAndConditions.map((term, index) => (
            <Text key={index} style={styles.termText}>
              • {term}
            </Text>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Bank Details</Text>
        <View style={styles.bankDetailsCard}>
          <Text style={styles.bankDetailText}>
            {invoiceData.bankDetails.label}
          </Text>
          <Text style={styles.bankDetailText}>
            Bank: {invoiceData.bankDetails.bankName}
          </Text>
          <Text style={styles.bankDetailText}>
            {invoiceData.bankDetails.accountNumber}
          </Text>
          <Text style={styles.bankDetailText}>
            {invoiceData.bankDetails.ifscCode}
          </Text>
        </View>

        <View style={styles.qrIrnContainer}>
          <Text style={styles.sectionTitle}>E-Invoice Details</Text>
          <View style={styles.qrIrnWrapper}>
            <View style={styles.qrCodeSection}>
              <Text style={styles.qrCodeTitle}>QR Code</Text>
              {invoiceData.eInvoiceDetails.signedQRCode ? (
                <View style={styles.qrCodeWrapper}>
                  <QRCode
                    value={invoiceData.eInvoiceDetails.signedQRCode}
                    size={80}
                    backgroundColor="#fff"
                    color="#000"
                  />
                </View>
              ) : (
                <Text style={styles.noDataText}>No QR Code available</Text>
              )}
            </View>

            <View style={styles.irnDetailsSection}>
              <View style={styles.irnDetailsCard}>
                <View style={styles.irnDetailRow}>
                  <Text style={styles.irnDetailLabel}>IRN No:</Text>
                  <Text style={styles.irnDetailValue}>
                    {invoiceData.eInvoiceDetails.irnNo.replace(
                      'IRN No : ',
                      '',
                    ) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.irnDetailRow}>
                  <Text style={styles.irnDetailLabel}>ACK No:</Text>
                  <Text style={styles.irnDetailValue}>
                    {invoiceData.eInvoiceDetails.acknowledgment
                      .split('Ack No : ')[1]
                      ?.split(' Ack Date')[0] || 'N/A'}
                  </Text>
                </View>
                <View style={styles.irnDetailRow}>
                  <Text style={styles.irnDetailLabel}>ACK Date:</Text>
                  <Text style={styles.irnDetailValue}>
                    {formatDate(
                      invoiceData.eInvoiceDetails.acknowledgment.split(
                        'Ack Date : ',
                      )[1],
                    ) || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionPlanContainer: {
    marginBottom: 16,
  },
  sectionPlanTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#63A1D8',
    marginBottom: 8,
    marginLeft: 8,
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
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    height: 36,
  },
  sacCodeHeader: {
    backgroundColor: '#63A1D8',
    padding: 8,
    height: 36,
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
    height: 34,
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
    marginTop: 2,
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
  bankDetailsCard: {
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
  bankDetailText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
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
  irnDetailsCard: {
    padding: 12,
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
  amountInWordsContainer: {
    marginTop: 14,
    marginBottom: 12,
    paddingHorizontal: 5, // Match padding with totalRow for consistency
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  amountInWordsLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  amountInWordsValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'left',
    flexWrap: 'wrap', // Ensure text wraps properly
    lineHeight: 20, // Improve readability
  },
});

export default InvoiceDetailsScreen;