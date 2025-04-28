import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Picker} from '@react-native-picker/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ViewShot from 'react-native-view-shot';
// Custom components
import ReportTable from '../components/ReportTable';
import IOSPickerModal from '../components/IOSPickerModal';
import IOSDatePickerModal from '../components/IOSDatePickerModal';
// Custom hooks
import { useReportData, ReportFilters } from '../hooks/useReportData';
import { usePdfGeneration } from '../hooks/usePdfGeneration';
// Initialize notifications
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
// Utilities
import { openPdf } from '../utils/ReportPdfUtils';
// ... existing code ...

const InwardOutwardReportScreen = () => {
  // Mode state
  const [isInward, setIsInward] = useState(true);
  
  // Form states
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [itemCategory, setItemCategory] = useState('');
  const [itemSubcategory, setItemSubcategory] = useState('');
  const [unit, setUnit] = useState('');
  
  // UI states
  const [showReport, setShowReport] = useState(false);
  const [showForm, setShowForm] = useState(true);
  
  // Modal visibility state for iOS pickers
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState('');
  
  // Sample data for units dropdown
  const units = ['D-39', 'D-514'];
  
  // Refs
  const tableRef = useRef<ScrollView>(null);
  const viewshotRef = useRef(null);
  
  // Use custom hooks
  const {
    apiCategories,
    apiSubcategories,
    reportData,
    customerName,
    loading,
    isReportLoading,
    isSearching,
    fetchReport,
    formatDate,
    formatDateForFilename,
  } = useReportData({ isInward });
  
  const {
    pdfGenerating: isPdfDownloading,
    downloadProgress,
    statusMessage,
    generatePdf,
    updateProgressUI
  } = usePdfGeneration({ isInward });
  
  // Date picker handlers with platform-specific implementation
  const showDatePicker = (pickerType: 'from' | 'to') => {
    if (pickerType === 'from') {
      setShowFromDatePicker(true);
    } else {
      setShowToDatePicker(true);
    }
  };

  const onFromDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || fromDate;
    setShowFromDatePicker(Platform.OS === 'ios');
    setFromDate(currentDate);
  };

  const onToDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || toDate;
    setShowToDatePicker(Platform.OS === 'ios');
    setToDate(currentDate);
  };
  
  // Helper function to show picker modal (for iOS)
  const openPicker = (pickerName: string) => {
    setCurrentPicker(pickerName);
    setIsPickerVisible(true);
  };
  
  // Handle clear button
  const handleClear = () => {
    setFromDate(new Date());
    setToDate(new Date());
    setItemCategory('');
    setItemSubcategory('');
    setUnit('');
  };
  
  // Handle search button
  const handleSearch = async () => {
    const filters: ReportFilters = {
      fromDate,
      toDate,
      itemCategory,
      itemSubcategory,
      unit
    };
    
    const success = await fetchReport(filters);
    if (success) {
      setShowReport(true);
      setShowForm(false);
    }
  };
  
  // Handle PDF download
  const handlePdfDownload = async () => {
    if (reportData.length === 0) {
      Alert.alert('No Data', 'There is no data to download.');
      return;
    }
    
    try {
      // Create PDF with all necessary parameters
      await generatePdf(
        reportData,
        fromDate,
        toDate,
        customerName,
        {
          unit,
          itemCategory,
          itemSubcategory
        }
      );
    } catch (err) {
      console.error('Error in PDF download flow:', err);
    }
  };
  
  // Add a function to go back to the form
  const handleBackToForm = () => {
    setShowForm(true);
    setShowReport(false);
  };
  
  // Reset subcategory when category changes
  useEffect(() => {
    if (itemCategory) {
      setItemSubcategory('');
    }
  }, [itemCategory]);
  
  // Configure notifications on component mount
  useEffect(() => {
    // Initialize push notifications
    PushNotification.configure({
      // (required) Called when a remote or local notification is opened or received
      onNotification: function (notification: any) {
        console.log("NOTIFICATION:", notification);
        
        // Try to open the PDF file when notification is pressed
        if (notification.userInfo?.filePath) {
          openPdf(notification.userInfo.filePath);
        }
        
        // Required on iOS only
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },
      
      // Android only: GCM or FCM Sender ID
      senderID: '',
      
      // iOS only: permission to use notifications
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      
      // Should the initial notification be popped automatically
      popInitialNotification: true,
      
      // Requesting permissions on iOS
      requestPermissions: Platform.OS === 'ios',
    });
    
    // For iOS, register notification categories with actions
    if (Platform.OS === 'ios') {
      PushNotificationIOS.setNotificationCategories([
        {
          id: 'pdf-download',
          actions: [
            {id: 'view', title: 'View', options: {foreground: true}},
          ],
        },
      ]);
    }
    
    return () => {
      // Clean up notifications on component unmount if needed
      PushNotification.unregister();
    };
  }, []);

  // Render appropriate picker components for iOS
  const renderIOSPicker = () => {
    switch (currentPicker) {
      case 'category':
        return (
          <Picker
            selectedValue={itemCategory}
            onValueChange={value => setItemCategory(value)}
            style={styles.iosPicker}
            itemStyle={styles.iosPickerItem}>
            <Picker.Item label="Select Category" value="" />
            {apiCategories.map((category, index) => (
              <Picker.Item key={index} label={category} value={category} />
            ))}
          </Picker>
        );
      case 'subcategory':
        return (
          <Picker
            selectedValue={itemSubcategory}
            onValueChange={value => setItemSubcategory(value)}
            style={styles.iosPicker}
            itemStyle={styles.iosPickerItem}>
            <Picker.Item label="Select Subcategory" value="" />
            {itemCategory &&
              apiSubcategories[itemCategory] &&
              apiSubcategories[itemCategory].map(
                (subcategory: string, index: number) => (
                  <Picker.Item
                    key={index}
                    label={subcategory}
                    value={subcategory}
                  />
                ),
              )}
          </Picker>
        );
      case 'unit':
        return (
          <Picker
            selectedValue={unit}
            onValueChange={value => setUnit(value)}
            style={styles.iosPicker}
            itemStyle={styles.iosPickerItem}>
            <Picker.Item label="Select Unit" value="" />
            {units.map((unit, index) => (
              <Picker.Item key={index} label={unit} value={unit} />
            ))}
          </Picker>
        );
      default:
        return null;
    }
  };

  // Render picker based on platform
  const renderPicker = (
    pickerType: string,
    value: string,
    label: string,
    items: string[],
    onValueChange: (value: string) => void,
    enabled: boolean = true,
  ) => {
    if (Platform.OS === 'ios') {
      return (
        <TouchableOpacity
          style={[styles.pickerContainer, !enabled && styles.disabledPicker]}
          onPress={() => {
            if (enabled) openPicker(pickerType);
          }}
          disabled={!enabled}>
          <Text
            style={value ? styles.pickerTextSelected : styles.pickerPlaceholder}
            numberOfLines={1}
            ellipsizeMode="tail">
            {value || `Select ${label}`}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#555" />
        </TouchableOpacity>
      );
    } else {
      // For Android, create better contrast with a dark background
      return (
        <View
          style={[
            styles.androidPickerContainer,
            !enabled && styles.disabledAndroidPicker,
          ]}>
          {/* The text that shows the selected value */}
          <Text
            style={[
              styles.androidSelectedText,
              !enabled && styles.disabledAndroidText,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {value || `Select ${label}`}
          </Text>

          {/* Dropdown arrow icon */}
          <MaterialIcons
            name="arrow-drop-down"
            size={28}
            color="#2C3E50"
            style={styles.androidDropdownIcon}
          />

          {/* The actual picker is transparent and overlays the text */}
          <Picker
            selectedValue={value}
            onValueChange={onValueChange}
            enabled={enabled}
            mode="dropdown"
            prompt={`Select ${label}`}
            style={styles.androidPicker}>
            <Picker.Item label={`Select ${label}`} value="" color="#FFFFFF" />
            {items.map((item, index) => (
              <Picker.Item
                key={index}
                label={item}
                value={item}
                color="#FFFFFF"
              />
            ))}
          </Picker>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        backgroundColor={isInward ? '#F48221' : '#4682B4'}
        barStyle="light-content"
      />

      {showForm ? (
        // Form Section
        <ScrollView style={styles.container}>
          {/* Toggle Button */}
          <View style={styles.toggleContainer}>
            <Text
              style={[
                styles.toggleText,
                !isInward && styles.toggleTextInactive,
              ]}>
              Inward
            </Text>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {backgroundColor: isInward ? '#F48221' : '#4682B4'},
              ]}
              onPress={() => setIsInward(!isInward)}>
              <View
                style={[
                  styles.toggleCircle,
                  {
                    left: isInward ? 4 : 36,
                    backgroundColor: '#FFFFFF',
                  },
                ]}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.toggleText,
                isInward && styles.toggleTextInactive,
              ]}>
              Outward
            </Text>
          </View>

          <View
            style={[
              styles.formContainer,
              isInward ? styles.inwardForm : styles.outwardForm,
            ]}>
            <Text
              style={[
                styles.formTitle,
                {color: isInward ? '#F48221' : '#4682B4'},
              ]}>
              {isInward ? 'Inward Report' : 'Outward Report'}
            </Text>

            {/* Loading Indicator */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={isInward ? '#F48221' : '#4682B4'}
                />
                <Text style={styles.loadingText}>Loading categories...</Text>
              </View>
            )}

            {/* Date Fields with Calendar Pickers */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>From Date</Text>
              <TouchableOpacity
                style={styles.dateInputContainer}
                onPress={() => showDatePicker('from')}>
                <View style={styles.dateInputContent}>
                  <MaterialIcons
                    name="event"
                    size={20}
                    color="#718096"
                    style={styles.inputIcon}
                  />
                  <Text style={styles.dateText}>{formatDate(fromDate)}</Text>
                </View>
              </TouchableOpacity>
              {showFromDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  testID="fromDatePicker"
                  value={fromDate}
                  mode="date"
                  display="default"
                  onChange={onFromDateChange}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>To Date</Text>
              <TouchableOpacity
                style={styles.dateInputContainer}
                onPress={() => showDatePicker('to')}>
                <View style={styles.dateInputContent}>
                  <MaterialIcons
                    name="event-available"
                    size={20}
                    color="#718096"
                    style={styles.inputIcon}
                  />
                  <Text style={styles.dateText}>{formatDate(toDate)}</Text>
                </View>
              </TouchableOpacity>
              {showToDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  testID="toDatePicker"
                  value={toDate}
                  mode="date"
                  display="default"
                  onChange={onToDateChange}
                />
              )}
            </View>

            {/* Category Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              {renderPicker(
                'category',
                itemCategory,
                'Category',
                apiCategories,
                value => setItemCategory(value),
              )}
            </View>

            {/* Subcategory Picker - Only enabled if category is selected */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Subcategory</Text>
              {renderPicker(
                'subcategory',
                itemSubcategory,
                'Subcategory',
                itemCategory && apiSubcategories[itemCategory]
                  ? apiSubcategories[itemCategory]
                  : [],
                value => setItemSubcategory(value),
                itemCategory !== '',
              )}
            </View>

            {/* Unit Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Unit</Text>
              {renderPicker(
                'unit',
                unit,
                'Unit',
                units,
                value => setUnit(value),
              )}
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  {backgroundColor: '#718096'}, // Grey for clear
                  isSearching && styles.disabledButton,
                ]}
                onPress={handleClear}
                disabled={isSearching}>
                <Text style={styles.buttonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  {backgroundColor: isInward ? '#F48221' : '#4682B4'},
                  isSearching && styles.disabledButton,
                ]}
                onPress={handleSearch}
                disabled={isSearching}>
                {isSearching ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : showReport ? (
        // Report Section
        <View style={styles.reportContainer}>
          <ViewShot
            ref={viewshotRef}
            options={{
              fileName: 'inward-outward-report',
              format: 'jpg',
              quality: 0.9,
            }}
            style={styles.reportContent}>
            {/* Report Header */}
            <View style={styles.reportHeader}>
              <View style={styles.reportHeaderLeft}>
                <TouchableOpacity
                  onPress={handleBackToForm}
                  style={[
                    styles.backButton,
                    {
                      backgroundColor: '#FFFFFF',
                      borderColor: isInward ? '#F48221' : '#4682B4',
                    },
                  ]}>
                  <MaterialIcons
                    name="arrow-back"
                    size={20}
                    color={isInward ? '#F48221' : '#4682B4'}
                  />
                  <Text
                    style={[
                      styles.backButtonText,
                      {color: isInward ? '#F48221' : '#4682B4'},
                    ]}>
                    Back
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.reportHeaderCenter}>
                <Text
                  style={[
                    styles.reportTitle,
                    {color: isInward ? '#F48221' : '#4682B4'},
                  ]}>
                  {isInward ? 'Inward Report' : 'Outward Report'}
                </Text>
              </View>
              <View style={styles.reportHeaderRight}>
                <TouchableOpacity
                  onPress={handlePdfDownload}
                  disabled={isPdfDownloading || reportData.length === 0}
                  style={[
                    styles.pdfButton,
                    {
                      backgroundColor:
                        reportData.length === 0
                          ? '#CBD5E1'
                          : isInward
                          ? '#F48221'
                          : '#4682B4',
                    },
                    isPdfDownloading && styles.disabledButton,
                  ]}>
                  <MaterialIcons name="picture-as-pdf" size={20} color="#FFFFFF" />
                  <Text style={styles.pdfButtonText}>PDF</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Report Sub Header */}
            <View style={styles.reportSubHeader}>
              {isPdfDownloading ? (
                <View style={styles.loadingIndicatorContainer}>
                  <ActivityIndicator
                    size="small"
                    color={isInward ? '#F48221' : '#4682B4'}
                  />
                  <Text style={styles.loadingIndicatorText}>
                    Generating PDF...
                  </Text>
                </View>
              ) : reportData.length > 0 ? (
                <View style={styles.resultsSummaryContainer}>
                  <MaterialIcons name="list-alt" size={20} color="#64748B" />
                  <Text
                    style={[
                      styles.reportCountText,
                      {color: isInward ? '#F48221' : '#4682B4'},
                    ]}>
                    {reportData.length} records found
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Scrolling Hint */}
            {reportData.length > 0 && (
              <View style={styles.scrollHintContainer}>
                <MaterialIcons name="swipe" size={18} color="#64748B" />
                <Text style={styles.scrollHintText}>
                  Scroll horizontally to view all data
                </Text>
              </View>
            )}

            {/* Report Table Section */}
            {reportData.length > 0 ? (
              <ReportTable 
                reportData={reportData}
                isInward={isInward}
                tableRef={tableRef}
              />
            ) : (
              <View style={styles.emptyTableContainer}>
                <MaterialIcons
                  name="search-off"
                  size={48}
                  color="#CBD5E1"
                />
                <Text style={styles.emptyTableText}>
                  No records found matching your filters.
                </Text>
              </View>
            )}
          </ViewShot>
        </View>
      ) : (
        // Empty State
        <View style={styles.emptyStateContainer}>
          <MaterialIcons
            name="error-outline"
            size={64}
            color="#E2E8F0"
          />
          <Text style={styles.emptyStateTitle}>
            Something went wrong
          </Text>
          <Text style={styles.emptyStateText}>
            Please go back and try again with different filters.
          </Text>
        </View>
      )}

      {/* iOS Picker Modal */}
      <IOSPickerModal 
        isVisible={isPickerVisible}
        currentPicker={currentPicker}
        itemCategory={itemCategory}
        itemSubcategory={itemSubcategory}
        unit={unit}
        apiCategories={apiCategories}
        apiSubcategories={apiSubcategories}
        units={units}
        setItemCategory={setItemCategory}
        setItemSubcategory={setItemSubcategory}
        setUnit={setUnit}
        onClose={() => setIsPickerVisible(false)}
      />

      {/* iOS Date Picker Modal */}
      <IOSDatePickerModal
        visible={showFromDatePicker && Platform.OS === 'ios'}
        date={fromDate}
        isInward={isInward}
        title="Select From Date"
        onClose={() => setShowFromDatePicker(false)}
        onDateChange={(event: any, date?: Date) => {
          if (date) setFromDate(date);
        }}
        onConfirm={() => {
          onFromDateChange({}, fromDate);
          setShowFromDatePicker(false);
        }}
      />

      <IOSDatePickerModal
        visible={showToDatePicker && Platform.OS === 'ios'}
        date={toDate}
        isInward={isInward}
        title="Select To Date"
        onClose={() => setShowToDatePicker(false)}
        onDateChange={(event: any, date?: Date) => {
          if (date) setToDate(date);
        }}
        onConfirm={() => {
          onToDateChange({}, toDate);
          setShowToDatePicker(false);
        }}
      />

      {/* PDF Loading Overlay */}
      {isPdfDownloading && (
        <View style={styles.pdfLoadingOverlay}>
          <View style={styles.pdfLoadingCard}>
            <Text style={styles.pdfLoadingText}>Generating PDF</Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${downloadProgress}%`,
                    backgroundColor: isInward ? '#F48221' : '#4682B4',
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{statusMessage}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  toggleButton: {
    width: 62,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    position: 'absolute',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleTextInactive: {
    opacity: 0.5,
  },
  formContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inwardForm: {
    // backgroundColor: '#FFF3E5', // Light orange
    backgroundColor: '#FFFBF6',
    borderColor: '#F48221',
    borderWidth: 1,
  },
  outwardForm: {
    // backgroundColor: '#E5F0FF', // Light blue
    backgroundColor: '#F5F9FF',
    borderColor: '#4682B4',
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  dateInputContainer: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
  },
  dateInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    color: '#2C3E50',
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    color: '#2C3E50',
    marginLeft: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  pickerContainer: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    height: 48,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  disabledPicker: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  picker: {
    height: 48,
    width: '100%',
  },
  pickerText: {
    fontSize: 14,
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  pickerTextSelected: {
    fontSize: 15,
    color: '#262626',
    fontWeight: 'bold',
    flex: 1,
  },
  pickerTextContainer: {
    flex: 1,
    paddingVertical: 12,
  },
  iosPicker: {
    width: '100%',
    height: 200,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  clearButton: {
    backgroundColor: '#888888',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  // Loading styles
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  // iOS Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  doneButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  doneButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // iOS date picker modal styles
  iosPickerItem: {
    color: '#000000', // Black text color for iOS picker items
    fontSize: 16,
  },
  iosDatePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  iosDatePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iosDatePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  iosDatePickerDoneBtn: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F48221',
  },
  iosDatePicker: {
    height: 200,
    marginTop: 10,
  },
  iosDatePickerConfirmBtn: {
    backgroundColor: '#F48221',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 5,
  },
  iosDatePickerConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Android picker styles
  androidPickerContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    height: 50,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  disabledAndroidPicker: {
    opacity: 0.7,
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
  },
  androidSelectedText: {
    color: '#2C3E50',
    fontSize: 15,
    maxWidth: '90%',
  },
  androidPicker: {
    width: '100%',
    height: 50,
    position: 'absolute',

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0, // Make the picker transparent but still functional
  },
  androidDropdownIcon: {
    position: 'absolute',
    right: 12,
  },
  disabledAndroidText: {
    color: '#A0A0A0',
  },
  reportContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: -24, // Increased negative margin to further reduce space above header
  },
  reportHeader: {
    padding: 0,
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    // marginTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 4,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  backButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 4,
  },
  pdfButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  reportSubHeader: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  loadingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingIndicatorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
  },
  resultsSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportCountText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  scrollHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  scrollHintText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 6,
  },
  tableContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    margin: 0,
    borderRadius: 0,
  },
  horizontalScrollContainer: {
    flex: 1,
  },
  tableWrapper: {
    flexDirection: 'column',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableCell: {
    fontSize: 14,
    color: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    textAlign: 'center',
  },
  emptyTableContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
  pdfLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  pdfLoadingCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  pdfLoadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 10,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  // iOS date picker styling
  inwardDatePicker: {
    borderColor: '#F48221',
    borderWidth: 1,
  },
  outwardDatePicker: {
    borderColor: '#4682B4',
    borderWidth: 1,
  },
  reportContent: {
    flex: 1,
  },
  reportHeaderLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  reportHeaderCenter: {
    flex: 2,
    alignItems: 'center',
  },
  reportHeaderRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
});

export default InwardOutwardReportScreen;